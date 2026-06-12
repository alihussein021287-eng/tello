#!/usr/bin/env node
/**
 * 🏺 Tello Product Seeder
 * يستخدم Claude لتوليد منتجات براندات حقيقية ويرفعها للـ API
 */

const https = require("https")
const http  = require("http")

const API_URL      = process.env.API_URL      || "https://api.fshsmart.com"
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || "admin@fshsmart.com"
const ADMIN_PASS   = process.env.ADMIN_PASS   || "TelloAdmin2025!"
const ANTHROPIC_KEY= process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_KEY) {
  console.error("❌ ANTHROPIC_API_KEY غير موجود")
  process.exit(1)
}

// ── Helper: HTTP request ──────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https")
    const lib     = isHttps ? https : http
    const parsed  = new URL(url)

    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   options.method || "GET",
      headers:  { "Content-Type": "application/json", ...options.headers },
    }, (res) => {
      let data = ""
      res.on("data", chunk => data += chunk)
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })

    req.on("error", reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// ── Helper: Claude API ────────────────────────────────────
async function askClaude(prompt) {
  const res = await request(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key":         ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type":      "application/json",
      },
    },
    {
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages:   [{ role: "user", content: prompt }],
    }
  )

  const text = res.data?.content?.[0]?.text || ""
  // استخرج JSON
  const match = text.match(/\[[\s\S]+\]/)
  if (!match) throw new Error("Claude ما رجع JSON: " + text.slice(0, 200))
  return JSON.parse(match[0])
}

// ── Step 1: Login ─────────────────────────────────────────
async function login() {
  console.log("🔐 تسجيل الدخول...")
  const res = await request(`${API_URL}/api/auth/login`, { method: "POST" }, {
    email: ADMIN_EMAIL, password: ADMIN_PASS,
  })
  if (!res.data?.data?.token) throw new Error("فشل تسجيل الدخول: " + JSON.stringify(res.data))
  console.log("✅ تم تسجيل الدخول")
  return res.data.data.token
}

// ── Step 2: Create categories ─────────────────────────────
async function createCategories(token) {
  console.log("\n📁 إنشاء الأقسام...")

  const CATEGORIES = [
    { name: "Fashion",     nameAr: "ملابس وأزياء",      icon: "👗" },
    { name: "Shoes",       nameAr: "أحذية",              icon: "👟" },
    { name: "Electronics", nameAr: "إلكترونيات",         icon: "📱" },
    { name: "Bags",        nameAr: "حقائب وإكسسوارات",  icon: "👜" },
    { name: "Watches",     nameAr: "ساعات",              icon: "⌚" },
    { name: "Perfumes",    nameAr: "عطور",               icon: "🌸" },
    { name: "Sports",      nameAr: "رياضة",              icon: "⚽" },
  ]

  const ids = {}
  const headers = { Authorization: `Bearer ${token}` }

  for (const cat of CATEGORIES) {
    const res = await request(`${API_URL}/api/categories`, { method: "POST", headers }, cat)
    if (res.data?.data?.id) {
      ids[cat.name] = res.data.data.id
      console.log(`  ✅ ${cat.nameAr}`)
    } else if (res.data?.data?.[0]?.id) {
      // already exists
      ids[cat.name] = res.data.data[0].id
      console.log(`  ⏭️  ${cat.nameAr} (موجود)`)
    } else {
      // جلب الموجودة
      const existing = await request(`${API_URL}/api/categories`, { headers })
      const found = existing.data?.data?.find(c => c.name === cat.name)
      if (found) ids[cat.name] = found.id
    }
    await sleep(200)
  }

  // تأكد من جلب أي أقسام موجودة
  if (Object.keys(ids).length === 0) {
    const res = await request(`${API_URL}/api/categories`)
    for (const cat of (res.data?.data || [])) {
      const match = CATEGORIES.find(c => c.name === cat.name || c.nameAr === cat.nameAr)
      if (match) ids[match.name] = cat.id
    }
  }

  return ids
}

// ── Step 3: Generate products with Claude ─────────────────
async function generateProducts(categoryIds) {
  console.log("\n🤖 Claude يولّد منتجات البراندات...")

  const prompt = `أنت خبير بيع براندات في العراق. ولّد قائمة JSON بـ 40 منتج براند حقيقي للبيع على موقع تيلو العراقي.

الأقسام المتاحة وـ IDs:
${Object.entries(categoryIds).map(([name, id]) => `- ${name}: "${id}"`).join("\n")}

القواعد:
1. براندات حقيقية فقط: Nike, Adidas, Apple, Samsung, Zara, H&M, Gucci, Louis Vuitton, Rolex, Chanel, etc.
2. الأسعار بالدينار العراقي IQD (واقعية للسوق العراقي)
3. كل منتج عنده 2-3 صور من Unsplash (استخدم URLs حقيقية من unsplash.com)
4. الوصف بالعربي والإنجليزي

أرجع JSON array فقط بهذا الشكل بالضبط:
[
  {
    "name": "Nike Air Max 270",
    "nameAr": "نايك اير ماكس 270",
    "description": "Iconic Nike running shoe with Max Air cushioning",
    "descriptionAr": "حذاء نايك الأيقوني مع تقنية Air Max للراحة القصوى",
    "price": 185000,
    "comparePrice": 220000,
    "stock": 15,
    "categoryId": "${categoryIds.Shoes || categoryIds.Fashion || Object.values(categoryIds)[0]}",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600"
    ]
  }
]

ولّد منتجات متنوعة من: ملابس، أحذية، إلكترونيات، حقائب، ساعات، عطور، رياضة.
40 منتج، أرجع JSON array فقط بدون أي نص آخر.`

  const products = await askClaude(prompt)
  console.log(`✅ Claude ولّد ${products.length} منتج`)
  return products
}

// ── Step 4: Create vendor (or use admin as vendor) ─────────
async function getOrCreateVendor(token) {
  const headers = { Authorization: `Bearer ${token}` }

  // تحقق هل الأدمن عنده vendor
  const meRes = await request(`${API_URL}/api/vendor/me`, { headers })
  if (meRes.data?.data?.id) {
    console.log("\n🏪 المتجر موجود:", meRes.data.data.storeName)
    return meRes.data.data.id
  }

  // إنشاء vendor للأدمن
  console.log("\n🏪 إنشاء متجر Tello الرسمي...")
  const applyRes = await request(
    `${API_URL}/api/vendor/apply`,
    { method: "POST", headers },
    {
      storeName:   "Tello Official Store",
      storeNameAr: "متجر تيلو الرسمي",
      phone:       "07700000000",
      category:    "متنوع",
      description: "المتجر الرسمي لـ Tello — براندات عالمية أصلية بأفضل الأسعار في العراق",
    }
  )

  // قبول الطلب مباشرة
  const userId = applyRes.data?.data?.userId
  if (userId) {
    await request(
      `${API_URL}/api/admin/vendor/applications/${userId}`,
      { method: "PATCH", headers },
      { action: "approve" }
    )
  }

  // جلب vendor ID
  const vendorRes = await request(`${API_URL}/api/vendor/me`, { headers })
  return vendorRes.data?.data?.id
}

// ── Step 5: Upload products ───────────────────────────────
async function uploadProducts(products, token, vendorId) {
  console.log("\n📦 رفع المنتجات للـ API...")
  const headers = { Authorization: `Bearer ${token}` }
  let success = 0, failed = 0

  for (const product of products) {
    try {
      const data = { ...product, vendorId }
      const res  = await request(`${API_URL}/api/vendor/products`, { method: "POST", headers }, data)

      if (res.data?.success || res.status === 201) {
        success++
        process.stdout.write(`\r  ✅ ${success}/${products.length} منتج`)
      } else {
        failed++
        if (failed <= 3) console.log(`\n  ⚠️  فشل: ${product.nameAr} — ${JSON.stringify(res.data?.message)}`)
      }
    } catch (e) {
      failed++
    }
    await sleep(300) // منع rate limiting
  }

  console.log(`\n\n✅ تم رفع ${success} منتج | ❌ فشل ${failed}`)
  return success
}

// ── Helper ────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("🏺 Tello Product Seeder — بدء التشغيل\n")
  console.log(`📡 API: ${API_URL}`)

  try {
    // 1. Login
    const token = await login()

    // 2. Categories
    const catIds = await createCategories(token)
    const catCount = Object.keys(catIds).length
    if (catCount === 0) {
      console.error("❌ ما قدرت إنشاء الأقسام")
      process.exit(1)
    }
    console.log(`\n✅ ${catCount} قسم جاهز`)

    // 3. Vendor
    const vendorId = await getOrCreateVendor(token)
    if (!vendorId) {
      console.log("⚠️  ما قدرت إنشاء متجر — سيتم رفع المنتجات بدون vendorId")
    }

    // 4. Generate
    const products = await generateProducts(catIds)

    // Fix categoryIds if needed
    const fixedProducts = products.map(p => ({
      ...p,
      categoryId: p.categoryId || Object.values(catIds)[0],
    }))

    // 5. Upload
    const uploaded = await uploadProducts(fixedProducts, token, vendorId)

    // 6. Summary
    console.log("\n" + "=".repeat(50))
    console.log("🎉 اكتمل!")
    console.log(`📦 ${uploaded} منتج على الموقع`)
    console.log(`🌐 https://fshsmart.com`)
    console.log(`🛡️  https://admin.fshsmart.com`)
    console.log("=".repeat(50))

  } catch (err) {
    console.error("\n❌ خطأ:", err.message)
    process.exit(1)
  }
}

main()
