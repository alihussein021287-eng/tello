import { prisma } from "../lib/db"
import { Hono } from "hono"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

export const adminExtRoutes = new Hono()
adminExtRoutes.use("*", authMiddleware, adminMiddleware)

// ── Commissions ───────────────────────────────────────────
adminExtRoutes.get("/commissions", async (c) => {
  const commissions = await prisma.commission.findMany({
    include: { vendor: { select: { storeName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const total   = commissions.reduce((s, c) => s + c.fee, 0)
  const paid    = commissions.filter(c => c.status === "PAID").reduce((s, c) => s + c.fee, 0)
  const pending = commissions.filter(c => c.status === "PENDING").reduce((s, c) => s + c.fee, 0)

  return c.json({ success: true, data: commissions, summary: { total, paid, pending } })
})

adminExtRoutes.patch("/commissions/:id/pay", async (c) => {
  const { id } = c.req.param()
  const updated = await prisma.commission.update({ where: { id }, data: { status: "PAID" } })
  return c.json({ success: true, data: updated })
})

// ── Reviews ───────────────────────────────────────────────
adminExtRoutes.get("/reviews", async (c) => {
  const { search, page = "1" } = c.req.query()
  const skip = (Number(page) - 1) * 20
  const where: any = {}
  if (search) where.OR = [
    { user:    { name:   { contains: search, mode: "insensitive" } } },
    { product: { nameAr: { contains: search, mode: "insensitive" } } },
  ]

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip, take: 20,
      include: {
        user:    { select: { name: true } },
        product: { select: { nameAr: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where }),
  ])

  return c.json({ success: true, data: reviews, total })
})

adminExtRoutes.delete("/reviews/:id", async (c) => {
  const { id } = c.req.param()
  await prisma.review.delete({ where: { id } })
  return c.json({ success: true })
})
