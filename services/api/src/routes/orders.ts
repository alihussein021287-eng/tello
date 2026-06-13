import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import { awardPoints } from "./loyalty"
import { sendNotification } from "./notifications"

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

  // إشعار الطلب عبر n8n/واتساب (fire-and-forget)
  const orderWebhook = process.env.N8N_ORDER_WEBHOOK
  if (orderWebhook) {
    const itemsSummary = order.items.map((it: any) => `${it.product?.nameAr || it.product?.name} \u00d7${it.quantity}`).join("\u060c ")
    fetch(orderWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, total, paymentMethod: body.paymentMethod, items: itemsSummary, address: order.address, notes: body.notes || "", createdAt: order.createdAt }),
    }).catch((e) => console.error("[order webhook] failed:", e.message))
  }
  // ── إشعارات داخلية (الزبون + البائع + الأدمن) ──
  try {
    // 1) الزبون
    await sendNotification({
      userId, type: "ORDER_PLACED",
      title: "Order received", body: `تم استلام طلبك #${order.id.slice(-6).toUpperCase()} بنجاح`,
      data: { orderId: order.id, link: `/account/orders/${order.id}` },
    })
    // 2) البائعون أصحاب المنتجات (فريدين)
    const vendorIds = [...new Set(order.items.map((it: any) => it.product?.vendorId).filter(Boolean))]
    const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds as string[] } } })
    for (const v of vendors) {
      await sendNotification({
        userId: v.userId, type: "NEW_VENDOR_ORDER",
        title: "New order", body: `عندك طلب جديد #${order.id.slice(-6).toUpperCase()} على أحد منتجاتك`,
        data: { orderId: order.id, link: `/vendor/dashboard/orders` },
      })
    }
    // 3) الأدمن(ون)
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
    for (const a of admins) {
      await sendNotification({
        userId: a.id, type: "ORDER_PLACED",
        title: "New order", body: `طلب جديد #${order.id.slice(-6).toUpperCase()} بقيمة ${total.toLocaleString()} د.ع`,
        data: { orderId: order.id, link: `/dashboard/orders` },
      })
    }
  } catch (e: any) {
    console.error("[order notifications] failed:", e.message)
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
