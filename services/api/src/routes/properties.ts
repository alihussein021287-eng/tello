import { Hono } from "hono"
import { prisma } from "../lib/db"

export const propertyRoutes = new Hono()

// قائمة العقارات (عامة) — بحث وفلترة
propertyRoutes.get("/", async (c) => {
  const { type, city, minPrice, maxPrice, guests, search, page = "1", limit = "20" } = c.req.query()
  const skip = (Number(page) - 1) * Number(limit)

  const where: any = { status: "APPROVED", isActive: true }
  if (type)   where.type = type
  if (city)   where.city = { contains: city, mode: "insensitive" }
  if (guests) where.maxGuests = { gte: Number(guests) }
  if (minPrice || maxPrice) {
    where.pricePerNight = {}
    if (minPrice) where.pricePerNight.gte = Number(minPrice)
    if (maxPrice) where.pricePerNight.lte = Number(maxPrice)
  }
  if (search) where.OR = [
    { titleAr: { contains: search, mode: "insensitive" } },
    { title:   { contains: search, mode: "insensitive" } },
    { area:    { contains: search, mode: "insensitive" } },
  ]

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where, skip, take: Number(limit),
      include: {
        owner: { select: { storeName: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where }),
  ])

  // نحسب متوسط التقييم
  const data = properties.map((p) => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
    reviewCount: p.reviews.length,
    reviews: undefined,
  }))

  return c.json({ success: true, data, total, page: Number(page) })
})

// تفاصيل عقار واحد
propertyRoutes.get("/:id", async (c) => {
  const property = await prisma.property.findUnique({
    where: { id: c.req.param("id") },
    include: {
      owner: { select: { storeName: true, phone: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
  if (!property) return c.json({ success: false, message: "العقار غير موجود" }, 404)

  const avgRating = property.reviews.length
    ? property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length : 0

  return c.json({ success: true, data: { ...property, avgRating, reviewCount: property.reviews.length } })
})

// التحقق من توفّر عقار بتواريخ معينة
propertyRoutes.get("/:id/availability", async (c) => {
  const propertyId = c.req.param("id")
  const { checkIn, checkOut } = c.req.query()
  if (!checkIn || !checkOut) return c.json({ success: false, message: "التواريخ مطلوبة" }, 400)

  // نشوف إذا في حجز متعارض
  const conflict = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      AND: [
        { checkIn:  { lt: new Date(checkOut) } },
        { checkOut: { gt: new Date(checkIn) } },
      ],
    },
  })

  return c.json({ success: true, data: { available: !conflict } })
})
