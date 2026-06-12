import { Hono } from "hono"
import { prisma } from "../lib/db"
import { authMiddleware } from "../middleware/auth"

export const reportsRoutes = new Hono()
reportsRoutes.use("*", authMiddleware)

// ── Vendor middleware ────────────────────────────────────
const vendorOnly = async (c: any, next: any) => {
  const userId = c.get("userId")
  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) return c.json({ success: false, message: "ليس بائعاً" }, 403)
  c.set("vendorId", vendor.id)
  c.set("vendor",   vendor)
  await next()
}

// ── بيانات التقرير ───────────────────────────────────────
reportsRoutes.get("/vendor/data", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const vendor   = c.get("vendor")
  const { month, year } = c.req.query()

  const targetYear  = Number(year)  || new Date().getFullYear()
  const targetMonth = Number(month) || new Date().getMonth() + 1

  const from = new Date(targetYear, targetMonth - 1, 1)
  const to   = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  const [items, commissions, topProducts] = await Promise.all([
    // كل منتجات البائع المباعة في الفترة
    prisma.orderItem.findMany({
      where: {
        product:  { vendorId },
        order:    { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" },
      },
      include: {
        product: { select: { nameAr: true, price: true } },
        order:   { select: { createdAt: true, paymentStatus: true } },
      },
    }),

    // العمولات
    prisma.commission.findMany({
      where:   { vendorId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
    }),

    // أكثر 5 منتجات مبيعاً
    prisma.orderItem.groupBy({
      by:      ["productId"],
      _sum:    { quantity: true, price: true },
      where:   { product: { vendorId }, order: { paymentStatus: "PAID", createdAt: { gte: from, lte: to } } },
      orderBy: { _sum: { quantity: "desc" } },
      take:    5,
    }),
  ])

  const totalRevenue  = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalFees     = commissions.reduce((s, c) => s + c.fee, 0)
  const netEarnings   = totalRevenue - totalFees

  const topProductIds = topProducts.map(p => p.productId)
  const topDetails    = await prisma.product.findMany({
    where:  { id: { in: topProductIds } },
    select: { id: true, nameAr: true, price: true, images: true },
  })

  const topMerged = topProducts.map(p => ({
    ...topDetails.find(d => d.id === p.productId),
    soldCount: p._sum.quantity || 0,
    revenue:   p._sum.price    || 0,
  }))

  // مبيعات يومية
  const dailySales: Record<string, number> = {}
  items.forEach(item => {
    const day = item.order.createdAt.toLocaleDateString("ar-IQ")
    dailySales[day] = (dailySales[day] || 0) + item.price * item.quantity
  })

  return c.json({
    success: true,
    data: {
      vendor:      { name: vendor.storeNameAr, id: vendor.id },
      period:      { month: targetMonth, year: targetYear },
      summary:     { totalRevenue, totalFees, netEarnings, totalOrders: items.length },
      topProducts: topMerged,
      dailySales,
      commissions: commissions.slice(0, 10),
    },
  })
})

// ── HTML تقرير — يُحوَّل لـ PDF في الـ Frontend ──────────
reportsRoutes.get("/vendor/html", vendorOnly, async (c) => {
  const vendorId = c.get("vendorId")
  const vendor   = c.get("vendor")
  const { month, year } = c.req.query()

  const targetYear  = Number(year)  || new Date().getFullYear()
  const targetMonth = Number(month) || new Date().getMonth() + 1
  const from = new Date(targetYear, targetMonth - 1, 1)
  const to   = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  const items = await prisma.orderItem.findMany({
    where: { product: { vendorId }, order: { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" } },
    include: {
      product: { select: { nameAr: true } },
      order:   { select: { createdAt: true } },
    },
  })

  const totalRevenue = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const fees         = totalRevenue * 0.10
  const net          = totalRevenue - fees

  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; direction: rtl; }
    .header { background: #1B4FD8; color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header p  { opacity: 0.8; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat  { background: #f7f7f8; padding: 16px; border-radius: 10px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; color: #1B4FD8; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; }
    th { background: #f7f7f8; font-weight: 600; color: #374151; }
    .footer { margin-top: 32px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏺 Tello — تقرير المبيعات</h1>
    <p>${vendor.storeNameAr} | ${MONTHS_AR[targetMonth - 1]} ${targetYear}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${totalRevenue.toLocaleString()}</div>
      <div class="stat-label">إجمالي المبيعات (د.ع)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${fees.toLocaleString()}</div>
      <div class="stat-label">عمولة Tello 10%</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color:#10b981">${net.toLocaleString()}</div>
      <div class="stat-label">صافي الأرباح (د.ع)</div>
    </div>
  </div>

  <h3 style="margin-bottom:12px;font-size:15px">تفاصيل المبيعات</h3>
  <table>
    <thead>
      <tr>
        <th>المنتج</th>
        <th>الكمية</th>
        <th>سعر الوحدة</th>
        <th>الإجمالي</th>
        <th>التاريخ</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td>${i.product.nameAr}</td>
          <td>${i.quantity}</td>
          <td>${i.price.toLocaleString()} د.ع</td>
          <td>${(i.price * i.quantity).toLocaleString()} د.ع</td>
          <td>${i.order.createdAt.toLocaleDateString("ar-IQ")}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>Tello — fshsmart.com | تقرير مُولَّد بتاريخ ${new Date().toLocaleDateString("ar-IQ")}</p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      "Content-Type":        "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="tello-report-${targetMonth}-${targetYear}.html"`,
    },
  })
})
