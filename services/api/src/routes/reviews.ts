import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const reviewRoutes = new Hono()

// جلب تقييمات منتج
reviewRoutes.get("/product/:productId", async (c) => {
  const { productId } = c.req.param()
  const { page = "1" } = c.req.query()
  const skip = (Number(page) - 1) * 10

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip, take: 10,
    }),
    prisma.review.count({ where: { productId } }),
  ])

  // معدل التقييم
  const avg = await prisma.review.aggregate({
    _avg: { rating: true },
    where: { productId },
  })

  // توزيع النجوم
  const dist = await Promise.all(
    [5,4,3,2,1].map(async (star) => ({
      star,
      count: await prisma.review.count({ where: { productId, rating: star } }),
    }))
  )

  return c.json({
    success: true,
    data: reviews,
    total,
    avgRating: avg._avg.rating || 0,
    distribution: dist,
    page: Number(page),
    hasMore: skip + reviews.length < total,
  })
})

// إضافة تقييم
reviewRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", z.object({
    productId: z.string(),
    orderId:   z.string(),
    rating:    z.number().int().min(1).max(5),
    comment:   z.string().max(500).optional(),
  })),
  async (c) => {
    const userId = c.get("userId")
    const body   = c.req.valid("json")

    // تحقق أن الزبون اشترى المنتج
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: body.productId,
        orderId:   body.orderId,
        order: { userId, status: "DELIVERED" },
      },
    })
    if (!purchased) {
      return c.json({ success: false, message: "يمكن التقييم فقط بعد استلام المنتج" }, 403)
    }

    // تحقق ما قيّم مسبقاً
    const existing = await prisma.review.findFirst({
      where: { userId, productId: body.productId },
    })
    if (existing) {
      return c.json({ success: false, message: "قيّمت هذا المنتج مسبقاً" }, 400)
    }

    const review = await prisma.review.create({
      data: { userId, ...body },
      include: { user: { select: { name: true, avatar: true } } },
    })

    return c.json({ success: true, data: review }, 201)
  }
)

// تعديل تقييم
reviewRoutes.patch(
  "/:id",
  authMiddleware,
  zValidator("json", z.object({
    rating:  z.number().int().min(1).max(5).optional(),
    comment: z.string().max(500).optional(),
  })),
  async (c) => {
    const userId = c.get("userId")
    const id     = c.req.param("id")
    const body   = c.req.valid("json")

    const review = await prisma.review.findFirst({ where: { id, userId } })
    if (!review) return c.json({ success: false, message: "التقييم غير موجود" }, 404)

    const updated = await prisma.review.update({ where: { id }, data: body })
    return c.json({ success: true, data: updated })
  }
)
