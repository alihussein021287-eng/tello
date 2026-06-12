import { Hono } from "hono"
import { prisma } from "../lib/db"

export const productRoutes = new Hono()

productRoutes.get("/", async (c) => {
  const {
    page = "1", limit = "20",
    category, search, minPrice, maxPrice,
    inStock, sort = "newest", vendorId,
  } = c.req.query()

  const skip = (Number(page) - 1) * Number(limit)
  const where: any = { isActive: true }

  if (vendorId)  where.vendorId  = vendorId
  if (category)  where.categoryId = category
  if (inStock === "true") where.stock = { gt: 0 }

  if (search) where.OR = [
    { name:   { contains: search, mode: "insensitive" } },
    { nameAr: { contains: search, mode: "insensitive" } },
    { descriptionAr: { contains: search, mode: "insensitive" } },
  ]

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && { gte: Number(minPrice) }),
      ...(maxPrice && { lte: Number(maxPrice) }),
    }
  }

  const orderBy: any =
    sort === "price_asc"  ? { price: "asc" }  :
    sort === "price_desc" ? { price: "desc" } :
    sort === "popular"    ? { createdAt: "desc" } :
    { createdAt: "desc" }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip,
      take: Math.min(Number(limit), 100),
      include: {
        category: true,
        vendor:   { select: { id: true, storeName: true, storeNameAr: true, logo: true } },
      },
      orderBy,
    }),
    prisma.product.count({ where }),
  ])

  return c.json({
    success: true,
    data:    products,
    total,
    page:    Number(page),
    hasMore: skip + products.length < total,
  })
})

productRoutes.get("/:id", async (c) => {
  const product = await prisma.product.findUnique({
    where: { id: c.req.param("id") },
    include: {
      category: true,
      vendor:   { select: { id: true, storeName: true, storeNameAr: true, logo: true, isVerified: true } },
      reviews:  {
        take:    10,
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!product) return c.json({ success: false, message: "Product not found" }, 404)
  return c.json({ success: true, data: product })
})
