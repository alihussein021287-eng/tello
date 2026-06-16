import { Hono } from "hono"
import bcrypt from "bcryptjs"
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
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true, isActive: true,
        _count: { select: { orders: true } },
        vendor: { select: { id: true, storeName: true } },
        propertyOwner: { select: { id: true, storeName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ])
  // نضيف أعلام التمييز
  const data = users.map((u: any) => ({
    ...u,
    hasVendor: !!u.vendor,
    hasPropertyOwner: !!u.propertyOwner,
    vendorName: u.vendor?.storeName || null,
    propertyOwnerName: u.propertyOwner?.storeName || null,
  }))
  return c.json({ success: true, data, total })
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

// ═══ موافقة العقارات (منصة الحجوزات) ═══

// قائمة كل العقارات (للأدمن) مع فلتر الحالة
adminStatsRoutes.get("/properties", async (c) => {
  const { status } = c.req.query()
  const where: any = {}
  if (status) where.status = status
  const properties = await prisma.property.findMany({
    where,
    include: { owner: { select: { storeName: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: properties })
})

// موافقة على عقار
adminStatsRoutes.patch("/properties/:id/approve", async (c) => {
  const { id } = c.req.param()
  const property = await prisma.property.update({
    where: { id }, data: { status: "APPROVED", isActive: true },
    include: { owner: true },
  })
  try {
    if (property.owner?.userId) {
      await sendNotification({
        userId: property.owner.userId, type: "VENDOR_APPROVED" as any,
        title: "Property approved",
        body: `تمت الموافقة على عقارك "${property.titleAr}" ✓ وأصبح ظاهراً للزبائن`,
        data: { link: "/booking/owner" },
      })
    }
  } catch (e: any) { console.error("[property approve notif]", e.message) }
  return c.json({ success: true, data: property })
})

// رفض عقار
adminStatsRoutes.patch("/properties/:id/reject", async (c) => {
  const { id } = c.req.param()
  const { reason } = await c.req.json().catch(() => ({ reason: "" }))
  const property = await prisma.property.update({
    where: { id }, data: { status: "REJECTED", isActive: false },
    include: { owner: true },
  })
  try {
    if (property.owner?.userId) {
      await sendNotification({
        userId: property.owner.userId, type: "VENDOR_REJECTED" as any,
        title: "Property rejected",
        body: `تم رفض عقارك "${property.titleAr}"${reason ? ": " + reason : ""}`,
        data: { link: "/booking/owner" },
      })
    }
  } catch (e: any) { console.error("[property reject notif]", e.message) }
  return c.json({ success: true, data: property })
})

// ═══ إدارة المستخدمين (تحكم كامل للأدمن) ═══

// تفاصيل مستخدم كاملة
adminStatsRoutes.get("/users/:id", async (c) => {
  const { id } = c.req.param()
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, role: true, createdAt: true, isActive: true,
      _count: { select: { orders: true } },
      vendor: { select: { id: true, storeName: true } },
      propertyOwner: { select: { id: true, storeName: true, _count: { select: { properties: true } } } },
      orders: { select: { id: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
      bookings: { select: { id: true, totalPrice: true, status: true, checkIn: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  })
  if (!user) return c.json({ success: false, message: "المستخدم غير موجود" }, 404)
  return c.json({ success: true, data: user })
})

// تغيير دور المستخدم
adminStatsRoutes.patch("/users/:id/role", async (c) => {
  const { id } = c.req.param()
  const { role } = await c.req.json()
  if (!["CUSTOMER", "VENDOR", "ADMIN"].includes(role)) {
    return c.json({ success: false, message: "دور غير صالح" }, 400)
  }
  // لو رقّيناه لبائع، ننشئ Vendor إن ماكو
  if (role === "VENDOR") {
    const existing = await prisma.vendor.findUnique({ where: { userId: id } })
    if (!existing) {
      const u = await prisma.user.findUnique({ where: { id } })
      await prisma.vendor.create({ data: { userId: id, storeName: (u?.name || "متجر") + " Store" } })
    }
  }
  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, role: true } })
  return c.json({ success: true, data: user })
})

// تفعيل/تعطيل (حظر) مستخدم
adminStatsRoutes.patch("/users/:id/toggle", async (c) => {
  const { id } = c.req.param()
  const adminId = c.get("userId")
  if (id === adminId) return c.json({ success: false, message: "لا يمكنك حظر نفسك" }, 400)
  const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true } })
  if (!user) return c.json({ success: false, message: "غير موجود" }, 404)
  const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: { id: true, isActive: true } })
  return c.json({ success: true, data: updated })
})

// تعديل بيانات مستخدم
adminStatsRoutes.patch("/users/:id", async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const data: any = {}
  if (body.name)  data.name = body.name
  if (body.email) data.email = body.email
  if (body.phone !== undefined) data.phone = body.phone
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, phone: true } })
  return c.json({ success: true, data: user })
})

// إعادة تعيين كلمة السر
adminStatsRoutes.patch("/users/:id/password", async (c) => {
  const { id } = c.req.param()
  const { password } = await c.req.json()
  if (!password || password.length < 6) return c.json({ success: false, message: "كلمة السر 6 أحرف على الأقل" }, 400)
  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { password: hashed } })
  return c.json({ success: true, message: "تم تغيير كلمة السر" })
})

// حذف مستخدم
adminStatsRoutes.delete("/users/:id", async (c) => {
  const { id } = c.req.param()
  const adminId = c.get("userId")
  if (id === adminId) return c.json({ success: false, message: "لا يمكنك حذف نفسك" }, 400)
  // نعطّله بدل الحذف الفعلي (آمن — يحفظ سجلّ الطلبات)
  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return c.json({ success: true, message: "تم تعطيل الحساب" })
})

