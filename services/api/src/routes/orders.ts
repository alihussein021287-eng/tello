import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import { awardPoints } from "./loyalty"

export const orderRoutes = new Hono()
orderRoutes.use("*", authMiddleware)

const createOrderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(["CASH", "CARD", "WALLET"]),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })),
  notes: z.string().optional(),
})

orderRoutes.get("/", async (c) => {
  const userId = c.get("userId")
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } }, address: true },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: orders })
})

orderRoutes.post("/", zValidator("json", createOrderSchema), async (c) => {
  const userId = c.get("userId")
  const body = c.req.valid("json")
  const products = await prisma.product.findMany({
    where: { id: { in: body.items.map((i) => i.productId) } },
  })
  const total = body.items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId)
    return sum + (p?.price || 0) * item.quantity
  }, 0)
  const order = await prisma.order.create({
    data: {
      userId, addressId: body.addressId,
      paymentMethod: body.paymentMethod,
      notes: body.notes, total,
      items: {
        create: body.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((p) => p.id === item.productId)?.price || 0,
        })),
      },
    },
    include: { items: { include: { product: true } }, address: true },
  })

  // منح نقاط الولاء (لا يكسر الطلب إذا فشل)
  try {
    await awardPoints(userId, order.id, total)
  } catch (e) {
    console.error("[awardPoints] failed:", e)
  }

  return c.json({ success: true, data: order }, 201)
})

orderRoutes.get("/:id", async (c) => {
  const userId = c.get("userId")
  const order = await prisma.order.findFirst({
    where: { id: c.req.param("id"), userId },
    include: { items: { include: { product: true } }, address: true },
  })
  if (!order) return c.json({ success: false, message: "Order not found" }, 404)
  return c.json({ success: true, data: order })
})
