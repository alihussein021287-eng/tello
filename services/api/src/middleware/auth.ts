import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tello-secret-change-in-production"
)

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header("Authorization")
  if (!authorization?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }
  const token = authorization.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    c.set("userId", payload.sub as string)
    c.set("role", payload.role as string)
    await next()
  } catch {
    throw new HTTPException(401, { message: "Invalid token" })
  }
})

export const adminMiddleware = createMiddleware(async (c, next) => {
  const role = c.get("role")
  if (role !== "ADMIN") {
    throw new HTTPException(403, { message: "Forbidden" })
  }
  await next()
})
