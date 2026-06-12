import { runAgent } from "./agent-loop"
import { claude, CLAUDE_MODEL } from "../lib/claude"
import { cachedAI } from "../lib/cache"
import { prisma } from "../lib/db"

/**
 * Admin Dashboard Insights
 * Analyzes sales data and gives actionable recommendations
 */
export async function getAdminInsights(period: "today" | "week" | "month" | "year"): Promise<string> {
  return cachedAI(`insights:${period}`, 1800, () =>
    runAgent({
      messages: [
        {
          role: "user",
          content: `
حلل أداء المتجر لفترة: ${period}.
استخدم get_sales_analytics وget_low_stock_products.
أعطني:
1. ملخص الأداء
2. المنتجات الأكثر مبيعاً
3. تحذيرات المخزون
4. توصيات لتحسين المبيعات
أجب بالعربية بشكل مختصر وعملي.
          `.trim(),
        },
      ],
      systemExtra: "أنت محلل أعمال خبير. ردودك موجهة للأدمن وتكون دقيقة وعملية.",
    })
  )
}

/**
 * Auto-generate product description in Arabic + English
 */
export async function generateProductDescription(productInfo: {
  name: string
  category: string
  price: number
  specs?: string
}): Promise<{ ar: string; en: string }> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `
اكتب وصفاً تسويقياً لهذا المنتج:
الاسم: ${productInfo.name}
القسم: ${productInfo.category}
السعر: ${productInfo.price} د.ع
${productInfo.specs ? `المواصفات: ${productInfo.specs}` : ""}

أرجع فقط JSON بهذا الشكل:
{"ar": "الوصف بالعربية (2-3 جمل)", "en": "Description in English (2-3 sentences)"}
        `.trim(),
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")

  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return {
      ar: `${productInfo.name} — منتج عالي الجودة بسعر ${productInfo.price} د.ع`,
      en: `${productInfo.name} — High quality product at ${productInfo.price} IQD`,
    }
  }
}

/**
 * Auto-tag and categorize a product
 */
export async function autoTagProduct(productName: string, description: string): Promise<{
  suggestedCategory: string
  tags: string[]
  searchKeywords: string[]
}> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, nameAr: true },
  })

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `
المنتج: ${productName}
الوصف: ${description}
الأقسام المتاحة: ${JSON.stringify(categories)}

أرجع فقط JSON:
{
  "suggestedCategory": "category_id",
  "tags": ["tag1", "tag2", "tag3"],
  "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
        `.trim(),
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")

  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { suggestedCategory: "", tags: [], searchKeywords: [] }
  }
}

/**
 * Anomaly Detection - flags suspicious orders
 */
export async function detectOrderAnomalies(orderId: string): Promise<{
  isSuspicious: boolean
  reason?: string
  riskScore: number
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: { select: { createdAt: true, orders: { select: { id: true } } } },
    },
  })

  if (!order) return { isSuspicious: false, riskScore: 0 }

  // Basic heuristics
  const flags: string[] = []
  let riskScore = 0

  // New account with large order
  const accountAge = Date.now() - order.user.createdAt.getTime()
  const accountAgeDays = accountAge / (1000 * 60 * 60 * 24)
  if (accountAgeDays < 1 && order.total > 100000) {
    flags.push("حساب جديد مع طلب كبير")
    riskScore += 30
  }

  // Very high quantity of same item
  const highQtyItem = order.items.find((i) => i.quantity > 20)
  if (highQtyItem) {
    flags.push(`كمية غير طبيعية: ${highQtyItem.quantity}x`)
    riskScore += 40
  }

  // Total too high
  if (order.total > 5000000) {
    flags.push("مبلغ مرتفع جداً")
    riskScore += 20
  }

  // If borderline, ask Claude
  if (riskScore > 20 && riskScore < 70) {
    const aiVerdict = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content: `طلب بمواصفات: المبلغ=${order.total}، عمر الحساب=${Math.round(accountAgeDays)} يوم، عدد الطلبات السابقة=${order.user.orders.length}. هل هذا مشبوه؟ أجب بـ JSON: {"suspicious": true/false, "reason": "السبب"}`,
        },
      ],
    })

    try {
      const aiText = (aiVerdict.content[0] as any).text
      const aiResult = JSON.parse(aiText.replace(/```json|```/g, "").trim())
      if (aiResult.suspicious) {
        flags.push(aiResult.reason)
        riskScore += 20
      }
    } catch {}
  }

  return {
    isSuspicious: riskScore >= 60,
    reason: flags.join(" | "),
    riskScore: Math.min(riskScore, 100),
  }
}
