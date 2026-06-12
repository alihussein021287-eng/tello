import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"
import { createHmac } from "crypto"

export const paymentRoutes = new Hono()

const ZAINCASH_MSISDN   = process.env.ZAINCASH_MSISDN   || ""  // رقم ZainCash
const ZAINCASH_SECRET   = process.env.ZAINCASH_SECRET   || ""  // المفتاح السري
const ZAINCASH_MERCHANT = process.env.ZAINCASH_MERCHANT || ""  // Merchant ID
const ZAINCASH_URL      = process.env.ZAINCASH_TEST === "true"
  ? "https://test.zaincash.iq/transaction/init"
  : "https://api.zaincash.iq/transaction/init"
const ZAINCASH_REDIRECT = process.env.NEXT_PUBLIC_APP_URL + "/payment/callback"

// ── توليد token لـ ZainCash ──────────────────────────────
function generateZainToken(amount: number, orderId: string, note: string) {
  const data = {
    amount,
    serviceType: "Tello Order",
    msisdn:      ZAINCASH_MSISDN,
    orderId,
    redirectUrl: ZAINCASH_REDIRECT,
    note,
    timestamp:   Math.floor(Date.now() / 1000),
    merchantId:  ZAINCASH_MERCHANT,
  }

  const token = Buffer.from(JSON.stringify(data)).toString("base64")
  const signature = createHmac("sha256", ZAINCASH_SECRET)
    .update(token)
    .digest("hex")

  return { token, signature, data }
}

// ── بدء عملية الدفع ─────────────────────────────────────
paymentRoutes.post(
  "/zaincash/init",
  authMiddleware,
  zValidator("json", z.object({ orderId: z.string() })),
  async (c) => {
    const { orderId } = c.req.valid("json")
    const userId      = c.get("userId")

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    })

    if (!order) return c.json({ success: false, message: "الطلب غير موجود" }, 404)
    if (order.paymentStatus === "PAID") {
      return c.json({ success: false, message: "الطلب مدفوع مسبقاً" }, 400)
    }

    const { token, signature } = generateZainToken(
      order.total,
      orderId,
      `Tello Order #${orderId.slice(-6).toUpperCase()}`
    )

    // حفظ token مؤقتاً
    await prisma.order.update({
      where: { id: orderId },
      data:  { paymentStatus: "PENDING" },
    })

    return c.json({
      success: true,
      data: {
        url:       ZAINCASH_URL,
        token,
        signature,
        merchantId: ZAINCASH_MERCHANT,
        // الـ Frontend يفتح هذا الـ URL
        redirectTo: `${ZAINCASH_URL}?token=${token}&merchantId=${ZAINCASH_MERCHANT}`,
      },
    })
  }
)

// ── Callback من ZainCash بعد الدفع ──────────────────────
paymentRoutes.post("/zaincash/callback", async (c) => {
  const body = await c.req.json()
  const { token, status, orderId, amount } = body

  // تحقق من التوقيع
  const expectedSig = createHmac("sha256", ZAINCASH_SECRET)
    .update(token)
    .digest("hex")

  if (expectedSig !== body.signature) {
    return c.json({ success: false, message: "Invalid signature" }, 400)
  }

  if (status === "success") {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return c.json({ success: false }, 404)

    // تحديث حالة الدفع
    await prisma.order.update({
      where: { id: orderId },
      data:  {
        paymentStatus: "PAID",
        status:        "CONFIRMED",
      },
    })

    // احتساب العمولات لكل بائع في الطلب
    const items = await prisma.orderItem.findMany({
      where:   { orderId },
      include: { product: { include: { vendor: true } } },
    })

    const vendorTotals: Record<string, number> = {}
    for (const item of items) {
      const vid = item.product.vendorId
      vendorTotals[vid] = (vendorTotals[vid] || 0) + item.price * item.quantity
    }

    const COMMISSION_RATE = 0.10
    for (const [vendorId, amount] of Object.entries(vendorTotals)) {
      await prisma.commission.create({
        data: {
          vendorId,
          orderId,
          amount,
          rate: COMMISSION_RATE,
          fee:  amount * COMMISSION_RATE,
        },
      })
    }

    return c.json({ success: true, message: "تم تأكيد الدفع" })
  }

  if (status === "failed") {
    await prisma.order.update({
      where: { id: orderId },
      data:  { paymentStatus: "FAILED" },
    })
    return c.json({ success: true, message: "تم تسجيل فشل الدفع" })
  }

  return c.json({ success: false, message: "حالة غير معروفة" }, 400)
})

// ── استعلام عن حالة دفع ─────────────────────────────────
paymentRoutes.get("/status/:orderId", authMiddleware, async (c) => {
  const { orderId } = c.req.param()
  const userId      = c.get("userId")

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, paymentStatus: true, status: true, total: true },
  })

  if (!order) return c.json({ success: false, message: "الطلب غير موجود" }, 404)
  return c.json({ success: true, data: order })
})
