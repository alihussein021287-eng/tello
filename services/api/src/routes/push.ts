import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { authMiddleware } from "../middleware/auth"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const pushRoutes = new Hono()
pushRoutes.use("*", authMiddleware)

// حفظ push token
pushRoutes.post(
  "/push-token",
  zValidator("json", z.object({
    token:    z.string(),
    platform: z.enum(["ios", "android"]).optional(),
  })),
  async (c) => {
    const userId = c.get("userId")
    const { token, platform } = c.req.valid("json")

    await redis.set(
      `push:${userId}`,
      JSON.stringify({ token, platform }),
      "EX",
      60 * 60 * 24 * 30
    )

    return c.json({ success: true })
  }
)

// ── إرسال push notification عبر Expo API ────────────────
export async function sendPushNotification({
  userId,
  title,
  body,
  data = {},
}: {
  userId: string
  title:  string
  body:   string
  data?:  Record<string, any>
}) {
  const raw = await redis.get(`push:${userId}`)
  if (!raw) return

  const { token } = JSON.parse(raw)
  if (!token) return

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        to:    token,
        title,
        body,
        data,
        sound:  "default",
        badge:  1,
      }),
    })
  } catch (err) {
    console.error("[Push] Failed to send:", err)
  }
}

// ── إرسال لعدة مستخدمين ──────────────────────────────────
export async function sendBulkPushNotifications(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, any> }
) {
  const messages = []

  for (const userId of userIds) {
    const raw = await redis.get(`push:${userId}`)
    if (!raw) continue
    const { token } = JSON.parse(raw)
    if (!token) continue
    messages.push({ to: token, ...notification, sound: "default" })
  }

  if (!messages.length) return

  // إرسال batch
  await fetch("https://exp.host/--/api/v2/push/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(messages),
  })
}
