import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const vendorRoutes = new Hono()
vendorRoutes.use("*", authMiddleware)

// ── Middleware: vendor only ──────────────────────────────
const vendorOnly = async (c: any, next: any) => {
  const userId = c.get("userId")
  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) return c.json({ success: false, message: "ليس لديك صلاحية البائع" }, 403)
  c.set("vendorId", vendor.id)
  c.set("vendor", vendor)
  await next()
}

// ══════════════════════════════════════════════════════════
// التسجيل كبائع
// ══════════════════════════════════════════════════════════
vendorRoutes.post(
  "/apply",
  zValidator("json", z.object({
    storeName:   z.string().min(2),
    storeNameAr: z.string().min(2),
    phone:       z.string().min(10),
    category:    z.string(),
    description: z.string().min(20),
  })),
  async (c) => {
    const userId = c.get("userId")
    const body   = c.req.valid("json")

    // تحقق ما عنده طلب سابق
    const existing = await prisma.vendorApplication.findUnique({ where: { userId } })
    if (existing) {
      return c.json({
        success: false,
        message: existing.status === "PENDING"
          ? "طلبك قيد المراجعة"
          : existing.status === "APPROVED"
          ? "أنت بائع مسبقاً"
          : "طلبك مرفوض — تواصل مع الدعم",
      }, 400)
    }

    const application = await prisma.vendorApplication.create({
      data: { userId, ...body },
    })

    return c.json({ success: true, data: application }, 201)
  }
)

// حالة الطلب
vendorRoutes.get("/apply/status", async (c) => {
  const userId = c.get("userId")
  const app = await prisma.vendorApplication.findUnique({ where: { userId } })
  if (!app) return c.json({ success: true, data: null })
  return c.json({ success: true, data: app })
})

// ══════════════════════════════════════════════════════════
// بيانات المتجر
// ══════════════════════════════════════════════════════════
vendorRoutes.get("/me", vendorOnly, async (c) => {
  const vendor = c.get("vendor")
  return c.json({ success: true, data: vendor })
})

vendorRoutes.patch(
  "/me",
  vendorOnly,
  zValidator("json", z.object({
    storeName:   z.string().min(2).optional(),
    storeNameAr: z.string().min(2).optional(),
    logo:        z.string().optional(),
    description: z.string().optional(),
  })),
  async (c) => {
    const vendorId = c.get("vendorId")
    const body     = c.req.valid("json")
    const updated  = await prisma.vendor.update({ where: { id: vendorId }, data: body })
    return c.json({ success: true, data: updated })
  }
)

// ══════════════════════════════════════════════════════════
// منتجات البائع
// ══════════════════════════════════════════════════════════
vendorRoutes.get("/products", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const { page = "1", limit = "20", search } = c.req.query()
  const skip = (Number(page) - 1) * Number(limit)

  const where: any = { vendorId }
  if (search) where.OR = [
    { name:   { contains: search, mode: "insensitive" } },
    { nameAr: { contains: search, mode: "insensitive" } },
  ]

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: Number(limit),
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ])

  return c.json({ success: true, data: products, total })
})

vendorRoutes.post(
  "/products",
  vendorOnly,
  zValidator("json", z.object({
    name:          z.string().min(2),
    nameAr:        z.string().min(2),
    description:   z.string(),
    descriptionAr: z.string(),
    price:         z.number().positive(),
    comparePrice:  z.number().optional(),
    stock:         z.number().int().min(0),
    categoryId:    z.string(),
    images:        z.array(z.string()).optional(),
  })),
  async (c) => {
    const vendorId = c.get("vendorId")
    const body     = c.req.valid("json")

    const product = await prisma.product.create({
      data: { ...body, vendorId, images: body.images || [] },
    })

    return c.json({ success: true, data: product }, 201)
  }
)

vendorRoutes.patch(
  "/products/:id",
  vendorOnly,
  async (c) => {
    const vendorId = c.get("vendorId")
    const id       = c.req.param("id")
    const body     = await c.req.json()

    // تأكد المنتج يخص هذا البائع
    const existing = await prisma.product.findFirst({ where: { id, vendorId } })
    if (!existing) return c.json({ success: false, message: "المنتج غير موجود" }, 404)

    const updated = await prisma.product.update({ where: { id }, data: body })
    return c.json({ success: true, data: updated })
  }
)

vendorRoutes.delete("/products/:id", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const id       = c.req.param("id")

  const existing = await prisma.product.findFirst({ where: { id, vendorId } })
  if (!existing) return c.json({ success: false, message: "المنتج غير موجود" }, 404)

  await prisma.product.update({ where: { id }, data: { isActive: false } })
  return c.json({ success: true })
})

// ══════════════════════════════════════════════════════════
// طلبات البائع
// ══════════════════════════════════════════════════════════
vendorRoutes.get("/orders", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const { status } = c.req.query()

  const where: any = {
    items: { some: { product: { vendorId } } },
    ...(status && { status }),
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        where: { product: { vendorId } },
        include: { product: true },
      },
      user: { select: { name: true, phone: true } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return c.json({ success: true, data: orders })
})

// ══════════════════════════════════════════════════════════
// إحصائيات البائع
// ══════════════════════════════════════════════════════════
vendorRoutes.get("/stats", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const now      = new Date()
  const monthAgo = new Date(now.setMonth(now.getMonth() - 1))

  const [totalProducts, totalOrders, revenue, commissions] = await Promise.all([
    prisma.product.count({ where: { vendorId, isActive: true } }),
    prisma.orderItem.count({ where: { product: { vendorId } } }),
    prisma.orderItem.aggregate({
      _sum: { price: true },
      where: {
        product: { vendorId },
        order: { paymentStatus: "PAID" },
      },
    }),
    prisma.commission.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const totalRevenue  = revenue._sum.price || 0
  const COMMISSION_RATE = 0.10  // 10% عمولة
  const myEarnings    = totalRevenue * (1 - COMMISSION_RATE)

  return c.json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      totalRevenue,
      myEarnings,
      commissionRate: COMMISSION_RATE,
      recentCommissions: commissions,
    },
  })
})
