import { Hono } from "hono"
import { prisma } from "../lib/db"

export const vendorPublicRoutes = new Hono()

// صفحة متجر البائع العامة
vendorPublicRoutes.get("/:vendorId", async (c) => {
  const { vendorId } = c.req.param()

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true, storeName: true, storeNameAr: true,
      logo: true, description: true, isVerified: true,
      _count: { select: { products: true } },
    },
  })

  if (!vendor) return c.json({ success: false, message: "المتجر غير موجود" }, 404)
  return c.json({ success: true, data: vendor })
})
