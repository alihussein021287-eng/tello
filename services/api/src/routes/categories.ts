import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

export const categoryRoutes = new Hono()

// Public — جلب الأقسام
categoryRoutes.get("/", async (c) => {
  const categories = await prisma.category.findMany({
    where:   { parentId: null },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return c.json({ success: true, data: categories })
})

categoryRoutes.get("/:id", async (c) => {
  const cat = await prisma.category.findUnique({
    where:   { id: c.req.param("id") },
    include: { children: true, products: { where: { isActive: true }, take: 20 } },
  })
  if (!cat) return c.json({ success: false, message: "القسم غير موجود" }, 404)
  return c.json({ success: true, data: cat })
})

// Admin — إنشاء قسم
categoryRoutes.post(
  "/",
  authMiddleware, adminMiddleware,
  zValidator("json", z.object({
    name:     z.string().min(1),
    nameAr:   z.string().min(1),
    icon:     z.string().default("🏺"),
    parentId: z.string().optional(),
  })),
  async (c) => {
    const cat = await prisma.category.create({ data: c.req.valid("json") })
    return c.json({ success: true, data: cat }, 201)
  }
)

// Admin — تعديل قسم
categoryRoutes.patch(
  "/:id",
  authMiddleware, adminMiddleware,
  async (c) => {
    const body = await c.req.json()
    const cat  = await prisma.category.update({ where: { id: c.req.param("id") }, data: body })
    return c.json({ success: true, data: cat })
  }
)

// Admin — حذف قسم
categoryRoutes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const count = await prisma.product.count({ where: { categoryId: c.req.param("id") } })
  if (count > 0) return c.json({ success: false, message: `يوجد ${count} منتج في هذا القسم` }, 400)
  await prisma.category.delete({ where: { id: c.req.param("id") } })
  return c.json({ success: true })
})
