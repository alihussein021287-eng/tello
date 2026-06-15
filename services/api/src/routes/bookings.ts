import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const bookingRoutes = new Hono()
bookingRoutes.use("*", authMiddleware)

// إنشاء حجز
bookingRoutes.post("/", async (c) => {
  const userId = c.get("userId")
  const b = await c.req.json()
  const { propertyId, checkIn, checkOut, guests } = b

  if (!propertyId || !checkIn || !checkOut) {
    return c.json({ success: false, message: "البيانات ناقصة" }, 400)
  }

  const inDate  = new Date(checkIn)
  const outDate = new Date(checkOut)
  if (outDate <= inDate) {
    return c.json({ success: false, message: "تاريخ الخروج يجب أن يكون بعد الدخول" }, 400)
  }

  // نجيب العقار
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "APPROVED", isActive: true },
  })
  if (!property) return c.json({ success: false, message: "العقار غير متاح" }, 404)

  // نتحقق من عدد الأشخاص
  if (guests && Number(guests) > property.maxGuests) {
    return c.json({ success: false, message: `الحد الأقصى ${property.maxGuests} أشخاص` }, 400)
  }

  // نتحقق من عدم التعارض (الأهم!)
  const conflict = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      AND: [
        { checkIn:  { lt: outDate } },
        { checkOut: { gt: inDate } },
      ],
    },
  })
  if (conflict) {
    return c.json({ success: false, message: "العقار محجوز في هذه التواريخ" }, 409)
  }

  // نحسب الليالي والسعر
  const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalPrice = nights * property.pricePerNight

  const booking = await prisma.booking.create({
    data: {
      propertyId, userId,
      checkIn: inDate, checkOut: outDate,
      guests: Number(guests) || 1,
      nights, totalPrice,
      status: "PENDING",
      notes: b.notes || null,
    },
  })

  return c.json({ success: true, data: booking, message: "تم إنشاء الحجز، بانتظار تأكيد المالك" }, 201)
})

// حجوزاتي (الزبون)
bookingRoutes.get("/my", async (c) => {
  const userId = c.get("userId")
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      property: {
        select: { titleAr: true, city: true, images: true, type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return c.json({ success: true, data: bookings })
})

// تفاصيل حجز
bookingRoutes.get("/:id", async (c) => {
  const userId = c.get("userId")
  const booking = await prisma.booking.findFirst({
    where: { id: c.req.param("id"), userId },
    include: { property: true },
  })
  if (!booking) return c.json({ success: false, message: "الحجز غير موجود" }, 404)
  return c.json({ success: true, data: booking })
})

// إلغاء حجز (الزبون)
bookingRoutes.patch("/:id/cancel", async (c) => {
  const userId = c.get("userId")
  const id = c.req.param("id")
  const booking = await prisma.booking.findFirst({ where: { id, userId } })
  if (!booking) return c.json({ success: false, message: "الحجز غير موجود" }, 404)
  if (["COMPLETED", "CANCELLED"].includes(booking.status)) {
    return c.json({ success: false, message: "لا يمكن إلغاء هذا الحجز" }, 400)
  }
  const updated = await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } })
  return c.json({ success: true, data: updated })
})
