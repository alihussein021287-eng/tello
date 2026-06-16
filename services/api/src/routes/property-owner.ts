import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import { sendNotification } from "./notifications"

export const propertyOwnerRoutes = new Hono()
propertyOwnerRoutes.use("*", authMiddleware)

// Middleware: مالك عقار فقط
const ownerOnly = async (c: any, next: any) => {
  const userId = c.get("userId")
  const owner = await prisma.propertyOwner.findUnique({ where: { userId } })
  if (!owner) return c.json({ success: false, message: "ليس لديك صلاحية مالك عقار" }, 403)
  c.set("ownerId", owner.id)
  c.set("owner", owner)
  await next()
}

// التسجيل كمالك عقار
propertyOwnerRoutes.post("/register", async (c) => {
  const userId = c.get("userId")
  const body = await c.req.json()
  const existing = await prisma.propertyOwner.findUnique({ where: { userId } })
  if (existing) return c.json({ success: false, message: "أنت مسجّل مسبقاً" }, 400)

  const owner = await prisma.propertyOwner.create({
    data: { userId, storeName: body.storeName || "مكتبي", phone: body.phone || "" },
  })
  // نرقّي المستخدم لدور OWNER (نستخدم نفس حقل role)
  return c.json({ success: true, data: owner }, 201)
})

// حالة التسجيل
propertyOwnerRoutes.get("/me", ownerOnly, async (c) => {
  return c.json({ success: true, data: c.get("owner") })
})

// عقاراتي
propertyOwnerRoutes.get("/properties", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const properties = await prisma.property.findMany({
    where: { ownerId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: properties })
})

// إضافة عقار (ينتظر موافقة الأدمن)
propertyOwnerRoutes.post("/properties", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const b = await c.req.json()
  if (!b.titleAr || !b.pricePerNight) {
    return c.json({ success: false, message: "العنوان والسعر مطلوبان" }, 400)
  }
  const property = await prisma.property.create({
    data: {
      type: b.type || "APARTMENT",
      title: b.title || b.titleAr,
      titleAr: b.titleAr,
      description: b.description || "",
      descriptionAr: b.descriptionAr || "",
      city: b.city || "",
      area: b.area || null,
      address: b.address || null,
      latitude: b.latitude || null,
      longitude: b.longitude || null,
      pricePerNight: Number(b.pricePerNight),
      maxGuests: Number(b.maxGuests) || 2,
      bedrooms: Number(b.bedrooms) || 1,
      bathrooms: Number(b.bathrooms) || 1,
      amenities: b.amenities || [],
      images: b.images || [],
      status: "PENDING",
      isActive: false,
      ownerId,
    },
  })
  return c.json({ success: true, data: property, message: "تم إرسال العقار للمراجعة" }, 201)
})

// تعديل عقار
propertyOwnerRoutes.patch("/properties/:id", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const id = c.req.param("id")
  const body = await c.req.json()
  const existing = await prisma.property.findFirst({ where: { id, ownerId } })
  if (!existing) return c.json({ success: false, message: "العقار غير موجود" }, 404)
  const updated = await prisma.property.update({ where: { id }, data: body })
  return c.json({ success: true, data: updated })
})

// حذف عقار
propertyOwnerRoutes.delete("/properties/:id", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const id = c.req.param("id")
  const existing = await prisma.property.findFirst({ where: { id, ownerId } })
  if (!existing) return c.json({ success: false, message: "العقار غير موجود" }, 404)
  await prisma.property.update({ where: { id }, data: { isActive: false } })
  return c.json({ success: true })
})

// حجوزات عقاراتي
propertyOwnerRoutes.get("/bookings", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const bookings = await prisma.booking.findMany({
    where: { property: { ownerId } },
    include: {
      property: { select: { titleAr: true } },
      user: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: bookings })
})

// المالك يغيّر حالة حجز
propertyOwnerRoutes.patch("/bookings/:id/status", ownerOnly, async (c) => {
  const ownerId = c.get("ownerId")
  const id = c.req.param("id")
  const { status } = await c.req.json()
  const allowed = ["CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"]
  if (!allowed.includes(status)) return c.json({ success: false, message: "حالة غير مسموحة" }, 400)
  const booking = await prisma.booking.findFirst({
    where: { id, property: { ownerId } },
    include: { property: { select: { titleAr: true } } },
  })
  if (!booking) return c.json({ success: false, message: "الحجز غير موجود" }, 404)
  const updated = await prisma.booking.update({ where: { id }, data: { status } })

  // إشعار الزبون بتغيّر حالة حجزه
  try {
    const msgs: Record<string, string> = {
      CONFIRMED: `تم تأكيد حجزك على "${booking.property.titleAr}" ✓`,
      CHECKED_IN: `تم تسجيل دخولك في "${booking.property.titleAr}"`,
      COMPLETED: `انتهى حجزك في "${booking.property.titleAr}". نتمنى أعجبك!`,
      CANCELLED: `تم إلغاء حجزك على "${booking.property.titleAr}"`,
    }
    if (msgs[status]) {
      await sendNotification({
        userId: booking.userId,
        type: "BOOKING_STATUS" as any,
        title: "تحديث الحجز",
        body: msgs[status],
        data: { link: "/booking/my-bookings" },
      })
    }
  } catch (e: any) { console.error("[booking status notif]", e.message) }

  return c.json({ success: true, data: updated })
})
