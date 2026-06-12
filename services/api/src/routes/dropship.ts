import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

export const dropshipRoutes = new Hono()

// ── Public: عرض المنتجات المتاحة للـ Dropshipping ────────
dropshipRoutes.get("/products", async (c) => {
  const { category, search, maxPrice, page = "1" } = c.req.query()
  const skip = (Number(page) - 1) * 20

  const where: any = { isActive: true, supplier: { isActive: true } }
  if (category) where.category = category
  if (search)   where.OR = [
    { name:   { contains: search, mode: "insensitive" } },
    { nameAr: { contains: search, mode: "insensitive" } },
  ]
  if (maxPrice) where.basePrice = { lte: Number(maxPrice) }

  const [products, total] = await Promise.all([
    prisma.dropshipProduct.findMany({
      where, skip, take: 20,
      include: { supplier: { select: { name: true, country: true, shippingDays: true } } },
    }),
    prisma.dropshipProduct.count({ where }),
  ])

  return c.json({ success: true, data: products, total, hasMore: skip + products.length < total })
})

// ── Vendor: استيراد منتج Dropship لمتجره ─────────────────
dropshipRoutes.post(
  "/import",
  authMiddleware,
  zValidator("json", z.object({
    dropshipProductId: z.string(),
    sellingPrice:      z.number().positive(),
    customNameAr:      z.string().optional(),
    customDescription: z.string().optional(),
  })),
  async (c) => {
    const userId = c.get("userId")
    const body   = c.req.valid("json")

    const vendor = await prisma.vendor.findUnique({ where: { userId } })
    if (!vendor) return c.json({ success: false, message: "ليس بائعاً" }, 403)

    const dropProduct = await prisma.dropshipProduct.findUnique({
      where: { id: body.dropshipProductId },
    })
    if (!dropProduct) return c.json({ success: false, message: "المنتج غير موجود" }, 404)

    // تحقق الهامش معقول (10% على الأقل)
    const margin = (body.sellingPrice - dropProduct.basePrice) / body.sellingPrice
    if (margin < 0.1) {
      return c.json({ success: false, message: "سعر البيع منخفض جداً — الهامش الأدنى 10%" }, 400)
    }

    // إنشاء المنتج في متجر البائع مع ربطه بالمورد
    const product = await prisma.product.create({
      data: {
        name:          dropProduct.name,
        nameAr:        body.customNameAr || dropProduct.nameAr,
        description:   dropProduct.description || "",
        descriptionAr: body.customDescription || dropProduct.descriptionAr || "",
        price:         body.sellingPrice,
        images:        dropProduct.images,
        stock:         9999, // Dropshipping — مخزون غير محدود
        isActive:      true,
        categoryId:    dropProduct.categoryId || "",
        vendorId:      vendor.id,
      },
    })

    // ربط المنتج بالمورد
    await prisma.dropshipLink.create({
      data: {
        productId:         product.id,
        dropshipProductId: body.dropshipProductId,
        vendorId:          vendor.id,
        sellingPrice:      body.sellingPrice,
        basePrice:         dropProduct.basePrice,
        margin:            body.sellingPrice - dropProduct.basePrice,
      },
    })

    return c.json({ success: true, data: product }, 201)
  }
)

// ── Admin: إدارة الموردين ─────────────────────────────────
dropshipRoutes.get("/suppliers", authMiddleware, adminMiddleware, async (c) => {
  const suppliers = await prisma.dropshipSupplier.findMany({
    include: { _count: { select: { products: true } } },
  })
  return c.json({ success: true, data: suppliers })
})

dropshipRoutes.post(
  "/suppliers",
  authMiddleware, adminMiddleware,
  zValidator("json", z.object({
    name:        z.string(),
    country:     z.string().default("China"),
    shippingDays:z.number().int().default(14),
    apiUrl:      z.string().optional(),
    apiKey:      z.string().optional(),
    commission:  z.number().default(0.05),
  })),
  async (c) => {
    const supplier = await prisma.dropshipSupplier.create({ data: c.req.valid("json") })
    return c.json({ success: true, data: supplier }, 201)
  }
)

// Admin: إضافة منتج Dropship
dropshipRoutes.post(
  "/products",
  authMiddleware, adminMiddleware,
  zValidator("json", z.object({
    supplierId:  z.string(),
    name:        z.string(),
    nameAr:      z.string(),
    description: z.string().optional(),
    descriptionAr:z.string().optional(),
    basePrice:   z.number().positive(),
    images:      z.array(z.string()).default([]),
    category:    z.string().optional(),
    categoryId:  z.string().optional(),
    weight:      z.number().optional(),
    origin:      z.string().default("China"),
  })),
  async (c) => {
    const product = await prisma.dropshipProduct.create({ data: c.req.valid("json") })
    return c.json({ success: true, data: product }, 201)
  }
)

// ── معالجة طلب Dropship — يُستدعى عند تأكيد الطلب ───────
export async function processDropshipOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where:   { orderId },
    include: { product: { include: { dropshipLink: { include: { supplier: true } } } } },
  })

  for (const item of items) {
    const link = (item.product as any).dropshipLink
    if (!link) continue

    // تسجيل طلب لدى المورد (simulation)
    await prisma.dropshipOrder.create({
      data: {
        orderId,
        productId:    item.productId,
        supplierId:   link.supplierId,
        quantity:     item.quantity,
        basePrice:    link.basePrice,
        sellingPrice: item.price,
        profit:       (item.price - link.basePrice) * item.quantity,
        status:       "PENDING",
      },
    })
  }
}
