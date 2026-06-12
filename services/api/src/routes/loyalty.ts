import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const loyaltyRoutes = new Hono()
loyaltyRoutes.use("*", authMiddleware)

const POINTS_PER_IQD = 0.01
const IQD_PER_POINT  = 1
const MIN_REDEEM     = 500
const MAX_REDEEM_PCT = 0.20

// رصيد النقاط
loyaltyRoutes.get("/balance", async (c) => {
  const userId = c.get("userId")
  const wallet = await prisma.loyaltyWallet.findUnique({ where: { userId } })
  const history = await prisma.loyaltyTransaction.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 20,
  })
  return c.json({
    success: true,
    data: {
      points:   wallet?.points   || 0,
      lifetime: wallet?.lifetime || 0,
      tier:     getTier(wallet?.lifetime || 0),
      history,
    },
  })
})

loyaltyRoutes.post("/calculate", async (c) => {
  const { orderTotal } = await c.req.json()
  return c.json({ success: true, data: { pointsToEarn: Math.floor(orderTotal * POINTS_PER_IQD) } })
})

loyaltyRoutes.post("/redeem/calculate", async (c) => {
  const userId = c.get("userId")
  const { points: requestedPoints, orderTotal } = await c.req.json()
  const wallet    = await prisma.loyaltyWallet.findUnique({ where: { userId } })
  const available = wallet?.points || 0
  const usePoints = Math.min(requestedPoints, available)
  const maxDiscount = orderTotal * MAX_REDEEM_PCT
  const discount    = Math.round(Math.min(usePoints * IQD_PER_POINT, maxDiscount))
  return c.json({
    success: true,
    data: {
      pointsUsed: Math.ceil(discount / IQD_PER_POINT),
      discount,
      finalTotal: orderTotal - discount,
      remaining:  available - Math.ceil(discount / IQD_PER_POINT),
    },
  })
})

// منح نقاط بعد طلب
export async function awardPoints(userId: string, orderId: string, orderTotal: number) {
  const points = Math.floor(orderTotal * POINTS_PER_IQD)
  if (points <= 0) return

  const wallet = await prisma.loyaltyWallet.upsert({
    where:  { userId },
    update: { points: { increment: points }, lifetime: { increment: points } },
    create: { userId, points, lifetime: points },
  })

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      walletId:    wallet.id,
      type:        "EARN",
      points,
      description: `طلب #${orderId.slice(-6).toUpperCase()}`,
      orderId,
    },
  })
}

// استبدال نقاط
export async function redeemPoints(userId: string, pointsToUse: number, orderId: string) {
  const wallet = await prisma.loyaltyWallet.findUnique({ where: { userId } })
  if (!wallet || wallet.points < pointsToUse) throw new Error("نقاط غير كافية")

  await prisma.loyaltyWallet.update({
    where: { userId }, data: { points: { decrement: pointsToUse } },
  })

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      walletId:    wallet.id,
      type:        "REDEEM",
      points:      -pointsToUse,
      description: `استبدال في طلب #${orderId.slice(-6).toUpperCase()}`,
      orderId,
    },
  })

  return pointsToUse * IQD_PER_POINT
}

function getTier(lifetime: number) {
  if (lifetime >= 50000) return { name: "Diamond", nameAr: "ماس",    benefits: ["خصم 20%","شحن مجاني","أولوية دعم"] }
  if (lifetime >= 20000) return { name: "Gold",    nameAr: "ذهبي",   benefits: ["خصم 15%","شحن مجاني"] }
  if (lifetime >= 5000)  return { name: "Silver",  nameAr: "فضي",    benefits: ["خصم 10%"] }
  return                         { name: "Bronze",  nameAr: "برونزي", benefits: ["تجميع نقاط"] }
}

loyaltyRoutes.post("/admin/award", async (c) => {
  const { userId, points, description } = await c.req.json()
  if (!userId || !points) return c.json({ success: false, message: "بيانات ناقصة" }, 400)

  const wallet = await prisma.loyaltyWallet.upsert({
    where:  { userId },
    update: { points: { increment: points }, lifetime: { increment: points > 0 ? points : 0 } },
    create: { userId, points, lifetime: Math.max(0, points) },
  })

  await prisma.loyaltyTransaction.create({
    data: { userId, walletId: wallet.id, type: "ADMIN", points, description: description || "منح يدوي" },
  })

  return c.json({ success: true })
})
