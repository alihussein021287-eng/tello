import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const notifRoutes = new Hono()
notifRoutes.use("*", authMiddleware)

// ── أنواع الإشعارات ──────────────────────────────────────
export type NotifType =
  | "ORDER_PLACED"        // زبون — طلب جديد
  | "ORDER_CONFIRMED"     // زبون — تأكيد الطلب
  | "ORDER_SHIPPED"       // زبون — الطلب خرج للتوصيل
  | "ORDER_DELIVERED"     // زبون — الطلب وصل
  | "ORDER_CANCELLED"     // زبون — الطلب ملغي
  | "NEW_VENDOR_ORDER"    // بائع — طلب جديد فيه منتجاته
  | "LOW_STOCK"           // بائع — منتج يقترب من النفاد
  | "VENDOR_APPROVED"     // بائع — قبول الطلب

// ── إرسال إشعار ─────────────────────────────────────────
export async function sendNotification({
  userId, type, title, body, data = {},
}: {
  userId: string
  type:   NotifType
  title:  string
  body:   string
  data?:  Record<string, any>
}) {
  // حفظ في Redis (للـ real-time SSE)
  const notif = {
    id:        `notif_${Date.now()}`,
    userId,
    type,
    title,
    body,
    data,
    read:      false,
    createdAt: new Date().toISOString(),
  }

  // دفع للقائمة + انتهاء بعد 30 يوم
  const key = `notifs:${userId}`
  await redis.lpush(key, JSON.stringify(notif))
  await redis.ltrim(key, 0, 49)  // آخر 50 إشعار
  await redis.expire(key, 60 * 60 * 24 * 30)

  // نشر على channel لـ SSE
  await redis.publish(`notif:${userId}`, JSON.stringify(notif))

  return notif
}

// ── جلب الإشعارات ────────────────────────────────────────
notifRoutes.get("/", async (c) => {
  const userId = c.get("userId")
  const key    = `notifs:${userId}`

  const raw   = await redis.lrange(key, 0, 49)
  const notifs = raw.map(n => JSON.parse(n))

  const unread = notifs.filter(n => !n.read).length

  return c.json({ success: true, data: notifs, unread })
})

// ── تعليم كمقروء ─────────────────────────────────────────
notifRoutes.patch("/:id/read", async (c) => {
  const userId = c.get("userId")
  const id     = c.req.param("id")
  const key    = `notifs:${userId}`

  const raw    = await redis.lrange(key, 0, 49)
  const updated = raw.map(n => {
    const parsed = JSON.parse(n)
    if (parsed.id === id) parsed.read = true
    return JSON.stringify(parsed)
  })

  await redis.del(key)
  if (updated.length) await redis.rpush(key, ...updated)

  return c.json({ success: true })
})

// ── تعليم الكل كمقروء ────────────────────────────────────
notifRoutes.patch("/read-all", async (c) => {
  const userId = c.get("userId")
  const key    = `notifs:${userId}`

  const raw    = await redis.lrange(key, 0, 49)
  const updated = raw.map(n => {
    const parsed = JSON.parse(n)
    parsed.read  = true
    return JSON.stringify(parsed)
  })

  await redis.del(key)
  if (updated.length) await redis.rpush(key, ...updated)

  return c.json({ success: true })
})

// ── SSE Stream للإشعارات الفورية ─────────────────────────
notifRoutes.get("/stream", async (c) => {
  const userId = c.get("userId")

  return new Response(
    new ReadableStream({
      async start(controller) {
        const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

        // أرسل إشعار ترحيب
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`)
        )

        // اشترك على الـ channel
        await sub.subscribe(`notif:${userId}`)
        sub.on("message", (channel, message) => {
          try {
            controller.enqueue(
              new TextEncoder().encode(`data: ${message}\n\n`)
            )
          } catch { sub.disconnect() }
        })

        // Keep-alive كل 30 ثانية
        const ping = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": ping\n\n"))
          } catch { clearInterval(ping); sub.disconnect() }
        }, 30_000)
      },
    }),
    {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
      },
    }
  )
})
