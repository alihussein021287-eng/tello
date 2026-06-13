import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { shoppingAssistant, getRecommendations, smartSearch } from "../agents/shopping-assistant"
import {
  getAdminInsights,
  generateProductDescription,
  autoTagProduct,
  detectOrderAnomalies,
  reviewProduct,
  generateFullProduct,
  askAdminAI,
  improveDescription,
  generateProductImage,
} from "../agents/admin-ai"

export const aiRoutes = new Hono()

// ===== SHOPPING ASSISTANT (streaming chat) =====
aiRoutes.post(
  "/chat",
  zValidator("json", z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })),
    userId: z.string().optional(),
  })),
  async (c) => {
    const { messages, userId } = c.req.valid("json")

    // Return SSE stream for real-time typing effect
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const reply = await shoppingAssistant(messages, userId)
            // Stream word by word for UX effect
            const words = reply.split(" ")
            for (const word of words) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`)
              )
              await new Promise((r) => setTimeout(r, 20))
            }
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
            controller.close()
          } catch (err) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ error: "حدث خطأ" })}\n\n`)
            )
            controller.close()
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      }
    )
  }
)

// ===== SMART SEARCH =====
aiRoutes.get(
  "/search",
  zValidator("query", z.object({ q: z.string().min(1) })),
  async (c) => {
    const { q } = c.req.valid("query")
    const results = await smartSearch(q)
    try {
      return c.json({ success: true, data: JSON.parse(results) })
    } catch {
      return c.json({ success: true, data: [], raw: results })
    }
  }
)

// ===== RECOMMENDATIONS =====
aiRoutes.get(
  "/recommendations/:userId",
  async (c) => {
    const userId = c.req.param("userId")
    const result = await getRecommendations(userId)
    try {
      return c.json({ success: true, productIds: JSON.parse(result) })
    } catch {
      return c.json({ success: true, productIds: [] })
    }
  }
)

// ===== ADMIN: INSIGHTS =====
aiRoutes.get(
  "/admin/insights/:period",
  async (c) => {
    const period = c.req.param("period") as "today" | "week" | "month" | "year"
    const insight = await getAdminInsights(period)
    return c.json({ success: true, insight })
  }
)

// ===== ADMIN: GENERATE PRODUCT DESCRIPTION =====
aiRoutes.post(
  "/admin/generate-description",
  zValidator("json", z.object({
    name: z.string(),
    category: z.string(),
    price: z.number(),
    specs: z.string().optional(),
  })),
  async (c) => {
    const body = c.req.valid("json")
    const description = await generateProductDescription(body)
    return c.json({ success: true, description })
  }
)

// ===== ADMIN: AUTO-TAG PRODUCT =====
aiRoutes.post(
  "/admin/auto-tag",
  zValidator("json", z.object({
    name: z.string(),
    description: z.string(),
  })),
  async (c) => {
    const { name, description } = c.req.valid("json")
    const tags = await autoTagProduct(name, description)
    return c.json({ success: true, ...tags })
  }
)

// ===== ADMIN: ANOMALY DETECTION =====
aiRoutes.post(
  "/admin/check-order/:orderId",
  async (c) => {
    const orderId = c.req.param("orderId")
    const result = await detectOrderAnomalies(orderId)
    return c.json({ success: true, ...result })
  }
)

// ===== مراجعة منتج ذكية =====
aiRoutes.post(
  "/admin/review-product",
  async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const result = await reviewProduct(body)
    return c.json({ success: true, data: result })
  }
)

// ===== توليد منتج كامل =====
aiRoutes.post(
  "/admin/generate-product",
  async (c) => {
    const body = await c.req.json().catch(() => ({}))
    if (!body.name) return c.json({ success: false, message: "الاسم مطلوب" }, 400)
    const result = await generateFullProduct(body)
    return c.json({ success: true, data: result })
  }
)

// ===== مساعد الأدمن التفاعلي =====
aiRoutes.post(
  "/admin/ask",
  async (c) => {
    const body = await c.req.json().catch(() => ({}))
    if (!body.question) return c.json({ success: false, message: "السؤال مطلوب" }, 400)
    const answer = await askAdminAI(body.question)
    return c.json({ success: true, data: { answer } })
  }
)

// ===== تحسين وترجمة الوصف =====
aiRoutes.post(
  "/admin/improve-description",
  async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const result = await improveDescription(body)
    return c.json({ success: true, data: result })
  }
)

// ===== توليد صورة منتج بالـ AI =====
aiRoutes.post(
  "/admin/generate-image",
  async (c) => {
    const body = await c.req.json().catch(() => ({}))
    if (!body.name) return c.json({ success: false, message: "الاسم مطلوب" }, 400)
    try {
      const result = await generateProductImage(body)
      return c.json({ success: true, data: result })
    } catch (e: any) {
      return c.json({ success: false, message: e.message || "تعذّر توليد الصورة" }, 500)
    }
  }
)
