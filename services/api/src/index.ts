import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { authRoutes }         from "./routes/auth"
import { productRoutes }      from "./routes/products"
import { orderRoutes }        from "./routes/orders"
import { categoryRoutes }     from "./routes/categories"
import { userRoutes }         from "./routes/users"
import { vendorRoutes }       from "./routes/vendor"
import { vendorPublicRoutes } from "./routes/vendor-public"
import { adminVendorRoutes }  from "./routes/admin-vendor"
import { adminStatsRoutes }   from "./routes/admin-stats"
import { adminExtRoutes }     from "./routes/admin-ext"
import { uploadRoutes }       from "./routes/upload"
import { paymentRoutes }      from "./routes/payment"
import { notifRoutes }        from "./routes/notifications"
import { couponRoutes }       from "./routes/coupons"
import { reviewRoutes }       from "./routes/reviews"
import { wishlistRoutes }     from "./routes/wishlist"
import { reportsRoutes }      from "./routes/reports"
import { pushRoutes }         from "./routes/push"
import { chatRoutes }         from "./routes/chat"
import { loyaltyRoutes }      from "./routes/loyalty"
import { dropshipRoutes }     from "./routes/dropship"
import { currencyRoutes }     from "./routes/currency"

const app = new Hono().basePath("/api")

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({
  origin: ["https://fshsmart.com","https://admin.fshsmart.com","http://localhost:3000","http://localhost:3001"],
  credentials: true,
}))

app.get("/health", (c) => c.json({ status: "ok", service: "tello-api", version: "1.0.0" }))

// ── Auth & Users ──────────────────────────────────────────
app.route("/auth",          authRoutes)
app.route("/users",         userRoutes)
app.route("/users",         pushRoutes)

// ── Catalog ───────────────────────────────────────────────
app.route("/products",      productRoutes)
app.route("/categories",    categoryRoutes)
app.route("/reviews",       reviewRoutes)
app.route("/wishlist",      wishlistRoutes)

// ── Commerce ──────────────────────────────────────────────
app.route("/orders",        orderRoutes)
app.route("/payment",       paymentRoutes)
app.route("/coupons",       couponRoutes)
app.route("/loyalty",       loyaltyRoutes)
app.route("/currency",      currencyRoutes)

// ── Vendor ────────────────────────────────────────────────
app.route("/vendor/public", vendorPublicRoutes)
app.route("/vendor",        vendorRoutes)

// ── Admin ─────────────────────────────────────────────────

// AI Product Creation - internal key only
app.post("/admin/ai-products", async (c) => {
  const internalKey = c.req.header("x-internal-key")
  if (internalKey !== (process.env.INTERNAL_SERVICE_KEY || "6a33560048ac03491a0aace7efa26754")) {
    return c.json({ success: false, message: "Unauthorized" }, 401)
  }
  try {
    const body = await c.req.json()
    const { prisma } = await import("./lib/db")
    const vendor = await prisma.vendor.findFirst()
    if (!vendor) return c.json({ success: false, message: "No vendor found" }, 400)
    const category = await prisma.category.findFirst()
    const product = await prisma.product.create({
      data: {
        name: body.nameEn || body.name || "New Product",
        nameAr: body.nameAr || body.name || "منتج جديد",
        description: body.description || "",
        descriptionAr: body.descriptionAr || body.description || "",
        price: Number(body.price) || 50000,
        comparePrice: Math.round(Number(body.price) * 1.2) || 60000,
        stock: Number(body.stock) || 20,
        categoryId: body.categoryId || category?.id,
        vendorId: vendor.id,
        images: (body.images || []).filter(Boolean),
        isActive: true,
      }
    })
    return c.json({ success: true, data: product }, 201)
  } catch(e: any) {
    console.error("[AI Products Error]", e.message)
    return c.json({ success: false, message: e.message }, 500)
  }
})

app.route("/admin/vendor",  adminVendorRoutes)
app.route("/admin",         adminStatsRoutes)
app.route("/admin",         adminExtRoutes)

// ── Features ──────────────────────────────────────────────
app.route("/chat",          chatRoutes)
app.route("/dropship",      dropshipRoutes)

// ── Utils ─────────────────────────────────────────────────
app.route("/upload",        uploadRoutes)
app.route("/notifications", notifRoutes)
app.route("/reports",       reportsRoutes)

// AI Proxy Route
app.post("/ai/:path{.*}", async (c) => {
  const aiPath = c.req.path.replace("/api/ai", "/ai")
  const body = await c.req.json().catch(() => ({}))
  const AI_URL = process.env.AI_SERVICE_URL || "http://tello-ai:4001"
  const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || ""
  try {
    const res = await fetch(`${AI_URL}${aiPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_KEY,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return c.json(data, res.status as any)
  } catch (e) {
    return c.json({ success: false, message: "AI service error: " + (e as any).message }, 500)
  }
})

app.notFound((c) => c.json({ success: false, message: "Route not found" }, 404))
app.onError((err, c) => {
  console.error("[API Error]", err)
  return c.json({ success: false, message: "Internal server error" }, 500)
})

const port = Number(process.env.PORT) || 4000
console.log(`🚀 Tello API v1.0 — ${port}`)
export default { port, fetch: app.fetch }


