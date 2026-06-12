import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tello-secret-change-in-production"
)

export const authRoutes = new Hono()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json")
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return c.json({ success: false, message: "Email already exists" }, 400)
  const hashed = await bcrypt.hash(body.password, 12)
  const user = await prisma.user.create({
    data: { ...body, password: hashed },
    select: { id: true, name: true, email: true, role: true },
  })
  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET)
  return c.json({ success: true, data: { user, token } }, 201)
})

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json")
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return c.json({ success: false, message: "Invalid credentials" }, 401)
  }
  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET)
  const { password: _pwd, ...safe } = user
  return c.json({ success: true, data: { user: safe, token } })
})
