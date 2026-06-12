import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const userRoutes = new Hono()
userRoutes.use("*", authMiddleware)

userRoutes.get("/me", async (c) => {
  const userId = c.get("userId")
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, addresses: true },
  })
  return c.json({ success: true, data: user })
})

userRoutes.patch("/me", zValidator("json", z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
})), async (c) => {
  const userId = c.get("userId")
  const body = c.req.valid("json")
  const user = await prisma.user.update({
    where: { id: userId }, data: body,
    select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
  })
  return c.json({ success: true, data: user })
})

userRoutes.patch("/me/password", zValidator("json", z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
})), async (c) => {
  const userId = c.get("userId")
  const { currentPassword, newPassword } = c.req.valid("json")
  const bcrypt = await import("bcryptjs")
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return c.json({ success: false, message: "المستخدم غير موجود" }, 404)
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return c.json({ success: false, message: "كلمة المرور الحالية غير صحيحة" }, 400)
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return c.json({ success: true, message: "تم تغيير كلمة المرور" })
})

// ─── العناوين ───────────────────────────────
const addrSchema = z.object({
  label: z.string().min(1), city: z.string().min(1),
  district: z.string().min(1), street: z.string().min(1),
  building: z.string().optional(), notes: z.string().optional(),
  lat: z.number().optional(), lng: z.number().optional(),
})

userRoutes.get("/addresses", async (c) => {
  const addresses = await prisma.address.findMany({
    where: { userId: c.get("userId") }, orderBy: { id: "asc" },
  })
  return c.json({ success: true, data: addresses })
})

userRoutes.post("/addresses", zValidator("json", addrSchema), async (c) => {
  const address = await prisma.address.create({
    data: { ...c.req.valid("json"), userId: c.get("userId") },
  })
  return c.json({ success: true, data: address }, 201)
})

userRoutes.patch("/addresses/:id", zValidator("json", addrSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const existing = await prisma.address.findFirst({ where: { id, userId: c.get("userId") } })
  if (!existing) return c.json({ success: false, message: "العنوان غير موجود" }, 404)
  const updated = await prisma.address.update({ where: { id }, data: c.req.valid("json") })
  return c.json({ success: true, data: updated })
})

userRoutes.delete("/addresses/:id", async (c) => {
  const { id } = c.req.param()
  const existing = await prisma.address.findFirst({ where: { id, userId: c.get("userId") } })
  if (!existing) return c.json({ success: false, message: "العنوان غير موجود" }, 404)
  await prisma.address.delete({ where: { id } })
  return c.json({ success: true })
})
