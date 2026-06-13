import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"
import { sendNotification } from "./notifications"

export const adminStatsRoutes = new Hono()
adminStatsRoutes.use("*", authMiddleware, adminMiddleware)

adminStatsRoutes.get("/stats", async (c) => {
  const now       = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0))
  const monthStart = new Date(new Date().setDate(1))
  const lastMonth  = new Date(new Date().setMonth(new Date().getMonth() - 1))

  const [
    totalUsers, newUsersToday, totalOrders, ordersToday,
    revenue, revenueLastMonth, totalProducts, pendingVendors,
    recentOrders, topProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID", createdAt: { gte: lastMonth, lt: monthStart } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.vendorApplication.count({ where: { status: "PENDING" } }),

    // آخر 8 طلبات
    prisma.order.findMany({
      take: 8, orderBy: { createdAt: "desc" },
      include: {
        user:  { select: { name: true } },
        items: { select: { id: true } },
      },
    }),

    // أكثر 5 منتجات مبيعاً
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ])

  // تفاصيل المنتجات الأكثر مبيعاً
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProducts.map(p => p.productId) } },
    select: { id: true, nameAr: true, price: true, images: true },
  })

  const topProductsMerged = topProducts.map(p => ({
    ...topProductDetails.find(d => d.id === p.productId),
    soldCount: p._sum.quantity,
  }))

  // مبيعات آخر 7 أيام
  const salesChart = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const d     = new Date()
      d.setDate(d.getDate() - (6 - i))
      const start = new Date(d.setHours(0, 0, 0, 0))
      const end   = new Date(d.setHours(23, 59, 59, 999))
      return prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: start, lte: end }, paymentStatus: "PAID" },
      }).then(r => ({
        day:   start.toLocaleDateString("ar-IQ", { weekday: "short" }),
        sales: r._sum.total || 0,
      }))
    })
  )

  const totalRevenue     = revenue._sum.total       || 0
  const lastMonthRevenue = revenueLastMonth._sum.total || 0
  const revenueGrowth    = lastMonthRevenue
    ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : "0"

  return c.json({
    success: true,
    data: {
      stats: {
        totalUsers,    newUsersToday,
        totalOrders,   ordersToday,
        totalRevenue,  revenueGrowth: Number(revenueGrowth),
        totalProducts, pendingVendors,
      },
      recentOrders,
      topProducts: topProductsMerged,
      salesChart,
    },
  })
})

// طلبات الأدمن
adminStatsRoutes.get("/orders", async (c) => {
  const { status, page = "1", limit = "20", search } = c.req.query()
  const skip = (Number(page) - 1) * Number(limit)
  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { id: { contains: search } },
    { user: { name: { contains: search, mode: "insensitive" } } },
  ]

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user:    { select: { name: true, email: true, phone: true } },
        address: true,
        items:   { include: { product: { select: { nameAr: true, images: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ])
  return c.json({ success: true, data: orders, total })
})

adminStatsRoutes.patch("/orders/:id/status", async (c) => {
  const { id }     = c.req.param()
  const { status } = await c.req.json()
  const order = await prisma.order.update({ where: { id }, data: { status } })
  // إشعار الزبون بتغيّر الحالة
  try {
    const sNum = order.id.slice(-6).toUpperCase()
    const map: Record<string, { t: string; b: string }> = {
      CONFIRMED: { t: "Order confirmed", b: `تم تأكيد طلبك #${sNum} ✓` },
      PREPARING: { t: "Order preparing", b: `جاري تحضير طلبك #${sNum} 📦` },
      SHIPPING:  { t: "Order shipping", b: `طلبك #${sNum} بالطريق إليك 🚚` },
      DELIVERED: { t: "Order delivered", b: `تم توصيل طلبك #${sNum} بنجاح ✓` },
      CANCELLED: { t: "Order cancelled", b: `تم إلغاء طلبك #${sNum}` },
    }
    const m = map[status]
    if (m) {
      await sendNotification({
        userId: order.userId, type: ("ORDER_" + status) as any,
        title: m.t, body: m.b,
        data: { orderId: order.id, link: `/account/orders/${order.id}` },
      })
    }
  } catch (e: any) {
    console.error("[order status notif] failed:", e.message)
  }
  return c.json({ success: true, data: order })
})

// منتجات الأدمن
adminStatsRoutes.get("/products", async (c) => {
  const { search, page = "1", limit = "20" } = c.req.query()
  const skip  = (Number(page) - 1) * Number(limit)
  const where: any = {}
  const statusF = c.req.query("status")
  if (statusF) where.status = statusF
  if (search) where.OR = [
    { nameAr: { contains: search, mode: "insensitive" } },
    { name:   { contains: search, mode: "insensitive" } },
  ]
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: Number(limit),
      include: { category: true, vendor: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ])
  return c.json({ success: true, data: products, total })
})

adminStatsRoutes.patch("/products/:id", async (c) => {
  const { id } = c.req.param()
  const body   = await c.req.json()
  const product = await prisma.product.update({ where: { id }, data: body })
  return c.json({ success: true, data: product })
})

adminStatsRoutes.delete("/products/:id", async (c) => {
  const { id } = c.req.param()
  await prisma.product.update({ where: { id }, data: { isActive: false } })
  return c.json({ success: true })
})

// موافقة على منتج بائع
adminStatsRoutes.patch("/products/:id/approve", async (c) => {
  const { id } = c.req.param()
  const product = await prisma.product.update({
    where: { id }, data: { status: "APPROVED", isActive: true },
    include: { vendor: true },
  })
  try {
    if (product.vendor?.userId) {
      await sendNotification({
        userId: product.vendor.userId, type: "VENDOR_APPROVED" as any,
        title: "Product approved",
        body: `تمت الموافقة على منتجك "${product.nameAr}" ✓ وأصبح ظاهراً للزبائن`,
        data: { link: "/vendor/dashboard/products" },
      })
    }
  } catch (e: any) { console.error("[approve notif]", e.message) }
  return c.json({ success: true, data: product })
})

// رفض منتج بائع
adminStatsRoutes.patch("/products/:id/reject", async (c) => {
  const { id } = c.req.param()
  const { reason } = await c.req.json().catch(() => ({ reason: "" }))
  const product = await prisma.product.update({
    where: { id }, data: { status: "REJECTED", isActive: false },
    include: { vendor: true },
  })
  try {
    if (product.vendor?.userId) {
      await sendNotification({
        userId: product.vendor.userId, type: "VENDOR_APPROVED" as any,
        title: "Product rejected",
        body: `تم رفض منتجك "${product.nameAr}"${reason ? " — السبب: " + reason : ""}`,
        data: { link: "/vendor/dashboard/products" },
      })
    }
  } catch (e: any) { console.error("[reject notif]", e.message) }
  return c.json({ success: true, data: product })
})

// مستخدمين الأدمن
adminStatsRoutes.get("/users", async (c) => {
  const { search, page = "1", limit = "20" } = c.req.query()
  const skip  = (Number(page) - 1) * Number(limit)
  const where: any = {}
  if (search) where.OR = [
    { name:  { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ]
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: Number(limit),
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, isActive: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ])
  return c.json({ success: true, data: users, total })
})

// Admin product creation
adminStatsRoutes.post("/products", async (c) => {
  const body = await c.req.json()
  // رفض بلا اسم + فحص تكرار
  const _pName = body.nameEn || body.name
  const _pNameAr = body.nameAr || body.name
  if (!_pName || !_pNameAr) return c.json({ success: false, message: "Product name required" }, 400)
  const _dup = await prisma.product.findFirst({ where: { OR: [{ name: _pName }, { nameAr: _pNameAr }] } })
  if (_dup) return c.json({ success: false, message: "Product already exists", skipped: true, data: _dup }, 200)
  const product = await prisma.product.create({
    data: {
      name:          body.name          || body.nameAr,
      nameAr:        body.nameAr,
      description:   body.description   || body.descriptionAr || "",
      descriptionAr: body.descriptionAr || "",
      price:         Number(body.price),
      comparePrice:  body.comparePrice ? Number(body.comparePrice) : null,
      stock:         Number(body.stock) || 0,
      categoryId:    body.categoryId,
      vendorId:      body.vendorId,
      images:        body.images || [],
      isActive:      true,
    },
  })
  return c.json({ success: true, data: product }, 201)
})

// AI Product Creation (for n8n automation)
adminStatsRoutes.post("/products", async (c) => {
  const body = await c.req.json()
  
  // get first vendor or admin as default vendor
  const vendor = await import("../lib/db").then(m => m.prisma.vendor.findFirst())
  if (!vendor) return c.json({ success: false, message: "No vendor found" }, 400)
  
  const product = await import("../lib/db").then(m => m.prisma.product.create({
    data: {
      name: body.nameEn || body.name,
      nameAr: body.nameAr || body.name,
      description: body.description || "",
      descriptionAr: body.descriptionAr || body.description || "",
      price: Number(body.price) || 50000,
      comparePrice: Number(body.price) * 1.2 || 60000,
      stock: Number(body.stock) || 20,
      categoryId: body.categoryId,
      vendorId: vendor.id,
      brand: body.brand || "Generic",
      images: body.images?.filter(Boolean) || [],
      isActive: true,
    }
  }))
  
  return c.json({ success: true, data: product }, 201)
})

// Internal AI endpoint - no auth required, uses internal key
adminStatsRoutes.post("/ai-products", async (c) => {
  const internalKey = c.req.header("x-internal-key")
  if (internalKey !== (process.env.INTERNAL_SERVICE_KEY || "6a33560048ac03491a0aace7efa26754")) {
    return c.json({ success: false, message: "Unauthorized" }, 401)
  }
  
  const body = await c.req.json()
  const { prisma } = await import("../lib/db")
  
  const vendor = await prisma.vendor.findFirst()
  if (!vendor) return c.json({ success: false, message: "No vendor found" }, 400)

  const category = await prisma.category.findFirst()
  
  // رفض بلا اسم + فحص تكرار
  const _pName = body.nameEn || body.name
  const _pNameAr = body.nameAr || body.name
  if (!_pName || !_pNameAr) return c.json({ success: false, message: "Product name required" }, 400)
  const _dup = await prisma.product.findFirst({ where: { OR: [{ name: _pName }, { nameAr: _pNameAr }] } })
  if (_dup) return c.json({ success: false, message: "Product already exists", skipped: true, data: _dup }, 200)
  const product = await prisma.product.create({
    data: {
      name: _pName,
      nameAr: _pNameAr,
      description: body.description || "",
      descriptionAr: body.descriptionAr || body.description || "",
      price: Number(body.price) || 50000,
      comparePrice: Math.round(Number(body.price) * 1.2) || 60000,
      stock: Number(body.stock) || 20,
      categoryId: body.categoryId || category?.id,
      vendorId: vendor.id,
      brand: body.brand || "Generic",
      images: (body.images || []).filter(Boolean),
      isActive: true,
    }
  })
  
  return c.json({ success: true, data: product }, 201)
})
