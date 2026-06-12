import type Anthropic from "@anthropic-ai/sdk"
import { prisma } from "../lib/db"

// All tools Claude can use to query real Tello data
export const TELLO_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description: "البحث عن منتجات في قاعدة بيانات Tello. يدعم البحث بالعربي والإنجليزي واللهجة العراقية.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "كلمة البحث" },
        category: { type: "string", description: "اسم القسم (اختياري)" },
        max_price: { type: "number", description: "أعلى سعر (اختياري)" },
        min_price: { type: "number", description: "أقل سعر (اختياري)" },
        limit: { type: "number", description: "عدد النتائج (افتراضي 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_details",
    description: "جلب تفاصيل كاملة لمنتج معين",
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "ID المنتج" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_categories",
    description: "جلب قائمة الأقسام المتاحة في المتجر",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_order_history",
    description: "جلب تاريخ طلبات مستخدم معين لتقديم توصيات شخصية",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        limit: { type: "number" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_sales_analytics",
    description: "جلب إحصائيات المبيعات للأدمن",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "week", "month", "year"],
          description: "الفترة الزمنية",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_low_stock_products",
    description: "جلب المنتجات التي تقترب من النفاد",
    input_schema: {
      type: "object",
      properties: {
        threshold: { type: "number", description: "حد الكمية (افتراضي 10)" },
      },
    },
  },
]

// Execute tool calls made by Claude
export async function executeTool(
  name: string,
  input: Record<string, any>
): Promise<unknown> {
  switch (name) {

    case "search_products": {
      const where: any = { isActive: true }
      if (input.query) {
        where.OR = [
          { name: { contains: input.query, mode: "insensitive" } },
          { nameAr: { contains: input.query, mode: "insensitive" } },
          { description: { contains: input.query, mode: "insensitive" } },
          { descriptionAr: { contains: input.query, mode: "insensitive" } },
        ]
      }
      if (input.category) {
        where.category = {
          OR: [
            { name: { contains: input.category, mode: "insensitive" } },
            { nameAr: { contains: input.category, mode: "insensitive" } },
          ],
        }
      }
      if (input.max_price) where.price = { ...where.price, lte: input.max_price }
      if (input.min_price) where.price = { ...where.price, gte: input.min_price }

      return prisma.product.findMany({
        where,
        take: input.limit || 5,
        select: {
          id: true, name: true, nameAr: true,
          price: true, comparePrice: true,
          images: true, stock: true,
          category: { select: { nameAr: true, name: true } },
          vendor: { select: { storeName: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    case "get_product_details": {
      return prisma.product.findUnique({
        where: { id: input.product_id },
        include: {
          category: true,
          vendor: { select: { storeName: true, storeNameAr: true } },
          reviews: {
            take: 5,
            include: { user: { select: { name: true } } },
          },
        },
      })
    }

    case "get_categories": {
      return prisma.category.findMany({
        select: { id: true, name: true, nameAr: true, icon: true },
      })
    }

    case "get_user_order_history": {
      return prisma.order.findMany({
        where: { userId: input.user_id },
        take: input.limit || 10,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, nameAr: true, categoryId: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    case "get_sales_analytics": {
      const now = new Date()
      const from = new Date()
      if (input.period === "today") from.setHours(0, 0, 0, 0)
      else if (input.period === "week") from.setDate(now.getDate() - 7)
      else if (input.period === "month") from.setMonth(now.getMonth() - 1)
      else if (input.period === "year") from.setFullYear(now.getFullYear() - 1)

      const [orders, topProducts, revenue] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: from } } }),
        prisma.orderItem.groupBy({
          by: ["productId"],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 5,
          where: { order: { createdAt: { gte: from } } },
        }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: from },
            paymentStatus: "PAID",
          },
        }),
      ])

      return {
        period: input.period,
        total_orders: orders,
        total_revenue: revenue._sum.total || 0,
        top_product_ids: topProducts.map((p) => p.productId),
      }
    }

    case "get_low_stock_products": {
      return prisma.product.findMany({
        where: {
          stock: { lte: input.threshold || 10 },
          isActive: true,
        },
        select: {
          id: true, name: true, nameAr: true,
          stock: true, price: true,
          vendor: { select: { storeName: true } },
        },
        orderBy: { stock: "asc" },
      })
    }

    default:
      return { error: "Unknown tool" }
  }
}
