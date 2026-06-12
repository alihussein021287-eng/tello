import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

export const couponRoutes = new Hono()

// ── تطبيق كوبون (للزبون) ────────────────────────────────
couponRoutes.post(
  "/apply",
  authMiddleware,
  zValidator("json", z.object({
    code:        z.string().min(1),
    orderTotal:  z.number().positive(),
  })),
  async (c) => {
    const userId     = c.get("userId")
    const { code, orderTotal } = c.req.valid("json")

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon)        return c.json({ success: false, message: "كود الخصم غير صحيح" }, 400)
    if (!coupon.isActive) return c.json({ success: false, message: "هذا الكود غير فعال" }, 400)
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return c.json({ success: false, message: "انتهت صلاحية الكود" }, 400)
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return c.json({ success: false, message: "تم استنفاد هذا الكود" }, 400)
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return c.json({
        success: false,
        message: `الحد الأدنى للطلب ${coupon.minOrderAmount.toLocaleString()} د.ع`,
      }, 400)
    }

    // تحقق لم يستخدمه قبلاً
    const used = await prisma.couponUsage.findFirst({
      where: { couponId: coupon.id, userId },
    })
    if (used) return c.json({ success: false, message: "استخدمت هذا الكود مسبقاً" }, 400)

    // احتساب الخصم
    let discount = 0
    if (coupon.type === "PERCENTAGE") {
      discount = Math.min(orderTotal * (coupon.value / 100), coupon.maxDiscount || Infinity)
    } else {
      discount = Math.min(coupon.value, orderTotal)
    }
    discount = Math.round(discount)

    return c.json({
      success: true,
      data: {
        couponId:    coupon.id,
        code:        coupon.code,
        type:        coupon.type,
        value:       coupon.value,
        discount,
        finalTotal:  orderTotal - discount,
        description: coupon.description,
      },
    })
  }
)

// ── إنشاء كوبون (أدمن) ──────────────────────────────────
couponRoutes.post(
  "/",
  authMiddleware, adminMiddleware,
  zValidator("json", z.object({
    code:           z.string().min(3).max(20),
    type:           z.enum(["PERCENTAGE", "FIXED"]),
    value:          z.number().positive(),
    description:    z.string().optional(),
    minOrderAmount: z.number().optional(),
    maxDiscount:    z.number().optional(),
    usageLimit:     z.number().int().optional(),
    expiresAt:      z.string().datetime().optional(),
  })),
  async (c) => {
    const body = c.req.valid("json")

    const coupon = await prisma.coupon.create({
      data: {
        ...body,
        code:      body.code.toUpperCase(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    return c.json({ success: true, data: coupon }, 201)
  }
)

// ── قائمة الكوبونات (أدمن) ───────────────────────────────
couponRoutes.get(
  "/",
  authMiddleware, adminMiddleware,
  async (c) => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
    return c.json({ success: true, data: coupons })
  }
)

// ── تفعيل / إيقاف كوبون ─────────────────────────────────
couponRoutes.patch(
  "/:id",
  authMiddleware, adminMiddleware,
  async (c) => {
    const { id }       = c.req.param()
    const { isActive } = await c.req.json()
    const coupon = await prisma.coupon.update({ where: { id }, data: { isActive } })
    return c.json({ success: true, data: coupon })
  }
)
