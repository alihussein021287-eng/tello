import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const wishlistRoutes = new Hono()
wishlistRoutes.use("*", authMiddleware)

// جلب المفضلة
wishlistRoutes.get("/", async (c) => {
  const userId = c.get("userId")
  const key    = `wishlist:${userId}`

  const ids = await redis.smembers(key)
  if (!ids.length) return c.json({ success: true, data: [] })

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { category: true, vendor: { select: { storeName: true } } },
  })

  return c.json({ success: true, data: products })
})

// إضافة للمفضلة
wishlistRoutes.post("/:productId", async (c) => {
  const userId    = c.get("userId")
  const productId = c.req.param("productId")
  const key       = `wishlist:${userId}`

  await redis.sadd(key, productId)
  await redis.expire(key, 60 * 60 * 24 * 365) // سنة

  return c.json({ success: true, message: "تمت الإضافة للمفضلة" })
})

// حذف من المفضلة
wishlistRoutes.delete("/:productId", async (c) => {
  const userId    = c.get("userId")
  const productId = c.req.param("productId")
  const key       = `wishlist:${userId}`

  await redis.srem(key, productId)
  return c.json({ success: true, message: "تم الحذف من المفضلة" })
})

// هل المنتج في المفضلة؟
wishlistRoutes.get("/check/:productId", async (c) => {
  const userId    = c.get("userId")
  const productId = c.req.param("productId")
  const key       = `wishlist:${userId}`

  const isMember = await redis.sismember(key, productId)
  return c.json({ success: true, data: { inWishlist: Boolean(isMember) } })
})

// عدد المفضلة
wishlistRoutes.get("/count", async (c) => {
  const userId = c.get("userId")
  const key    = `wishlist:${userId}`
  const count  = await redis.scard(key)
  return c.json({ success: true, data: { count } })
})
