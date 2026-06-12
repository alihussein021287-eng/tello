import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

export const adminVendorRoutes = new Hono()
adminVendorRoutes.use("*", authMiddleware, adminMiddleware)

// قائمة الطلبات المعلقة
adminVendorRoutes.get("/applications", async (c) => {
  const { status = "PENDING" } = c.req.query()
  const apps = await prisma.vendorApplication.findMany({
    where: { status },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: apps })
})

// قبول أو رفض طلب بائع
adminVendorRoutes.patch("/applications/:userId", async (c) => {
  const { userId } = c.req.param()
  const { action }  = await c.req.json() // "approve" | "reject"

  const app = await prisma.vendorApplication.findUnique({ where: { userId } })
  if (!app) return c.json({ success: false, message: "الطلب غير موجود" }, 404)

  if (action === "approve") {
    // إنشاء Vendor + تحديث role المستخدم
    await prisma.$transaction([
      prisma.vendor.upsert({
        where:  { userId },
        update: {},
        create: {
          userId,
          storeName:   app.storeName,
          storeNameAr: app.storeNameAr,
          isVerified:  true,
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { role: "VENDOR" } }),
      prisma.vendorApplication.update({ where: { userId }, data: { status: "APPROVED" } }),
    ])
    return c.json({ success: true, message: "تم قبول البائع" })
  }

  if (action === "reject") {
    await prisma.vendorApplication.update({ where: { userId }, data: { status: "REJECTED" } })
    return c.json({ success: true, message: "تم رفض الطلب" })
  }

  return c.json({ success: false, message: "action غير صحيح" }, 400)
})

// قائمة البائعين النشطين
adminVendorRoutes.get("/vendors", async (c) => {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: vendors })
})

// ضبط نسبة العمولة لبائع معين
adminVendorRoutes.patch("/vendors/:id/commission", async (c) => {
  const { id }   = c.req.param()
  const { rate } = await c.req.json()
  // يُخزن في Redis أو config لاحقاً — الآن نرجعه فقط
  return c.json({ success: true, message: `نسبة العمولة للبائع ${id} = ${rate * 100}%` })
})
