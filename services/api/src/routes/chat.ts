import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import Redis from "ioredis"

const redis    = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
const redisSub = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const chatRoutes = new Hono()
chatRoutes.use("*", authMiddleware)

// ── إنشاء أو جلب محادثة بين زبون وبائع ──────────────────
chatRoutes.post(
  "/conversations",
  zValidator("json", z.object({ vendorId: z.string() })),
  async (c) => {
    const userId   = c.get("userId")
    const { vendorId } = c.req.valid("json")

    // تحقق البائع موجود
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) return c.json({ success: false, message: "البائع غير موجود" }, 404)

    // جلب محادثة موجودة أو إنشاء جديدة
    let conv = await prisma.chatConversation.findFirst({
      where: {
        OR: [
          { userId, vendorId },
          { userId: vendor.userId, vendorId, customerId: userId },
        ],
      },
      include: {
        messages: { take: 30, orderBy: { createdAt: "asc" } },
        user:     { select: { name: true, avatar: true } },
        vendor:   { select: { storeName: true, logo: true } },
      },
    })

    if (!conv) {
      conv = await prisma.chatConversation.create({
        data:    { userId, vendorId, customerId: userId },
        include: {
          messages: { take: 30, orderBy: { createdAt: "asc" } },
          user:     { select: { name: true, avatar: true } },
          vendor:   { select: { storeName: true, logo: true } },
        },
      })
    }

    return c.json({ success: true, data: conv })
  }
)

// ── قائمة محادثات المستخدم ───────────────────────────────
chatRoutes.get("/conversations", async (c) => {
  const userId = c.get("userId")
  const user   = await prisma.user.findUnique({ where: { id: userId }, select: { vendor: true } })

  // إذا البائع — جلب محادثاته كبائع أيضاً
  const where = user?.vendor
    ? { OR: [{ userId }, { vendorId: user.vendor.id }] }
    : { userId }

  const convs = await prisma.chatConversation.findMany({
    where,
    include: {
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      user:     { select: { name: true, avatar: true } },
      vendor:   { select: { storeName: true, logo: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return c.json({ success: true, data: convs })
})

// ── إرسال رسالة ──────────────────────────────────────────
chatRoutes.post(
  "/conversations/:convId/messages",
  zValidator("json", z.object({
    content:     z.string().min(1).max(1000),
    messageType: z.enum(["text", "image", "product"]).default("text"),
    metadata:    z.record(z.any()).optional(),
  })),
  async (c) => {
    const userId = c.get("userId")
    const convId = c.req.param("convId")
    const body   = c.req.valid("json")

    const conv = await prisma.chatConversation.findUnique({ where: { id: convId } })
    if (!conv) return c.json({ success: false, message: "المحادثة غير موجودة" }, 404)

    // تحقق المستخدم طرف في المحادثة
    const vendor = await prisma.vendor.findFirst({ where: { userId } })
    const isParty = conv.userId === userId || conv.vendorId === vendor?.id
    if (!isParty) return c.json({ success: false, message: "غير مصرح" }, 403)

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        senderId:       userId,
        content:        body.content,
        messageType:    body.messageType,
        metadata:       body.metadata ? JSON.stringify(body.metadata) : null,
      },
    })

    // تحديث وقت المحادثة
    await prisma.chatConversation.update({
      where: { id: convId },
      data:  { updatedAt: new Date() },
    })

    // نشر على Redis للـ SSE
    await redis.publish(
      `chat:${convId}`,
      JSON.stringify({ ...message, senderId: userId })
    )

    return c.json({ success: true, data: message }, 201)
  }
)

// ── جلب رسائل محادثة ─────────────────────────────────────
chatRoutes.get("/conversations/:convId/messages", async (c) => {
  const convId = c.req.param("convId")
  const { before, limit = "30" } = c.req.query()

  const messages = await prisma.chatMessage.findMany({
    where:   { conversationId: convId, ...(before && { createdAt: { lt: new Date(before) } }) },
    orderBy: { createdAt: "desc" },
    take:    Number(limit),
  })

  return c.json({ success: true, data: messages.reverse() })
})

// ── تعليم كمقروء ─────────────────────────────────────────
chatRoutes.patch("/conversations/:convId/read", async (c) => {
  const userId = c.get("userId")
  const convId = c.req.param("convId")

  await prisma.chatMessage.updateMany({
    where: { conversationId: convId, senderId: { not: userId }, isRead: false },
    data:  { isRead: true },
  })

  return c.json({ success: true })
})

// ── SSE Stream للرسائل الفورية ────────────────────────────
chatRoutes.get("/conversations/:convId/stream", async (c) => {
  const convId = c.req.param("convId")
  const sub    = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

  return new Response(
    new ReadableStream({
      async start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode(`: connected\n\n`))
        await sub.subscribe(`chat:${convId}`)

        sub.on("message", (_, msg) => {
          try {
            ctrl.enqueue(new TextEncoder().encode(`data: ${msg}\n\n`))
          } catch { sub.disconnect() }
        })

        const ping = setInterval(() => {
          try { ctrl.enqueue(new TextEncoder().encode(": ping\n\n")) }
          catch { clearInterval(ping); sub.disconnect() }
        }, 25_000)
      },
    }),
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } }
  )
})
