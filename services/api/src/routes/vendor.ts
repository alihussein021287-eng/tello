import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import { sendNotification } from "./notifications"

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

    // إشعار الأدمن ببائع جديد
    try {
      const applicant = await prisma.user.findUnique({ where: { id: userId } })
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
      for (const a of admins) {
        await sendNotification({
          userId: a.id, type: "VENDOR_APPROVED" as any,
          title: "New vendor application",
          body: `بائع جديد (${applicant?.name || "مستخدم"}) قدّم طلب انضمام — راجعه`,
          data: { link: "/dashboard/vendors" },
        })
      }
    } catch (e: any) { console.error("[vendor app notif]", e.message) }
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
      data: { ...body, vendorId, images: body.images || [], status: "PENDING", isActive: false },
    })

    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
      for (const a of admins) {
        await sendNotification({ userId: a.id, type: "VENDOR_APPROVED" as any, title: "New product pending", body: `منتج جديد "${body.nameAr}" بانتظار مراجعتك`, data: { link: "/dashboard/products" } })
      }
    } catch (e: any) { console.error("[product pending notif]", e.message) }
    return c.json({ success: true, data: product }, 201)
  }
)

// استيراد منتجات بالجملة (Excel/API) — كلها PENDING للموافقة
vendorRoutes.post("/products/bulk", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const body = await c.req.json()
  const items = Array.isArray(body.products) ? body.products : []
  if (!items.length) return c.json({ success: false, message: "لا توجد منتجات" }, 400)
  if (items.length > 500) return c.json({ success: false, message: "الحد الأقصى 500 منتج بالمرة" }, 400)

  const cats = await prisma.category.findMany({ select: { id: true, name: true, nameAr: true } })
  const findCat = (v: string) => {
    if (!v) return cats[0]?.id
    const m = cats.find(c2 => c2.id === v || c2.name?.toLowerCase() === String(v).toLowerCase() || c2.nameAr === v)
    return m?.id || cats[0]?.id
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] }
  for (let i = 0; i < items.length; i++) {
    const p = items[i]
    const nameAr = (p.nameAr || p.name || "").trim()
    const name   = (p.name || p.nameAr || "").trim()
    const price  = Number(p.price)
    if (!nameAr || !name) { results.skipped++; results.errors.push(`صف ${i+1}: بلا اسم`); continue }
    if (!price || price <= 0) { results.skipped++; results.errors.push(`صف ${i+1}: سعر غير صالح`); continue }
    // تجاهل المكرر (نفس الاسم لنفس البائع)
    const dup = await prisma.product.findFirst({ where: { vendorId, OR: [{ name }, { nameAr }] } })
    if (dup) { results.skipped++; results.errors.push(`صف ${i+1}: "${nameAr}" موجود مسبقاً`); continue }
    try {
      await prisma.product.create({
        data: {
          name, nameAr,
          description: p.description || "", descriptionAr: p.descriptionAr || p.description || "",
          price, comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
          stock: Number(p.stock) || 0,
          categoryId: findCat(p.category || p.categoryId),
          vendorId, images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
          status: "PENDING", isActive: false,
        },
      })
      results.created++
    } catch (e: any) {
      results.skipped++; results.errors.push(`صف ${i+1}: ${e.message}`)
    }
  }

  // إشعار الأدمن بدفعة منتجات للمراجعة
  if (results.created > 0) {
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
      for (const a of admins) {
        await sendNotification({
          userId: a.id, type: "VENDOR_APPROVED" as any,
          title: "Bulk products pending",
          body: `بائع استورد ${results.created} منتج بانتظار مراجعتك`,
          data: { link: "/dashboard/products" },
        })
      }
    } catch {}
  }
  return c.json({ success: true, data: results })
})

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
// البائع يغيّر حالة طلب يخص منتجاته
vendorRoutes.patch("/orders/:id/status", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const { id }   = c.req.param()
  const { status } = await c.req.json()
  // البائع يسمح له بحالات محددة فقط
  const allowed = ["CONFIRMED", "PREPARING", "SHIPPING"]
  if (!allowed.includes(status)) {
    return c.json({ success: false, message: "حالة غير مسموحة" }, 400)
  }
  // تأكد الطلب فيه منتج من منتجات هذا البائع (أمان)
  const order = await prisma.order.findFirst({
    where: { id, items: { some: { product: { vendorId } } } },
  })
  if (!order) return c.json({ success: false, message: "الطلب غير موجود" }, 404)
  const updated = await prisma.order.update({ where: { id }, data: { status } })
  // إشعار الزبون
  try {
    const sNum = id.slice(-6).toUpperCase()
    const map: Record<string, string> = {
      CONFIRMED: `تم تأكيد طلبك #${sNum} ✓`,
      PREPARING: `جاري تحضير طلبك #${sNum} 📦`,
      SHIPPING:  `طلبك #${sNum} بالطريق إليك 🚚`,
    }
    await sendNotification({
      userId: order.userId, type: ("ORDER_" + status) as any,
      title: "Order update", body: map[status],
      data: { orderId: id, link: `/account/orders/${id}` },
    })
  } catch (e: any) { console.error("[vendor order status notif]", e.message) }
  return c.json({ success: true, data: updated })
})

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
