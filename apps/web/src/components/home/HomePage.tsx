"use client"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Zap, Shield, Truck, ShoppingCart, Heart } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { products as productsApi, categories as categoriesApi } from "@/lib/api"
import { useLocale } from "next-intl"
import { useCartStore } from "@/store"
import toast from "react-hot-toast"

const CATEGORY_EMOJI: Record<string, string> = {
  default:     "🏺",
  electronics: "📱",
  fashion:     "👗",
  shoes:       "👟",
  bags:        "👜",
  watches:     "⌚",
  perfumes:    "🌸",
  sports:      "⚽",
  home:        "🏠",
  food:        "🍎",
  beauty:      "✨",
  books:       "📚",
}

// صور افتراضية لكل براند بدل picsum العشوائية
const BRAND_IMAGES: Record<string, string> = {
  "nike":          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  "adidas":        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80",
  "apple":         "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
  "samsung":       "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80",
  "iphone":        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80",
  "rolex":         "https://images.unsplash.com/photo-1548171916-c8fd5d4e0bab?w=400&q=80",
  "gucci":         "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  "louis vuitton": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  "chanel":        "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80",
  "jordan":        "https://images.unsplash.com/photo-1556048219-bb6978360b84?w=400&q=80",
  "zara":          "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
  "omega":         "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80",
  "sony":          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  "dior":          "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80",
  "playstation":   "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
  "tommy":        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80",
  "burberry":      "https://images.unsplash.com/photo-1548778052-311f4bc2b502?w=400&q=80",
  "lacoste":       "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80",
  "prada":         "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  "h&m":           "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
  "new balance":   "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  "airpods":       "https://images.unsplash.com/photo-1588423771073-b8903fead770?w=400&q=80",
  "default":       "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
}

function getProductImage(product: any): string {
  // لو الصورة من picsum — ابحث عن صورة أفضل
  const img = product.images?.[0] || ""
  if (img.includes("picsum.photos")) {
    const name = (product.name || product.nameAr || "").toLowerCase()
    for (const [brand, url] of Object.entries(BRAND_IMAGES)) {
      if (name.includes(brand)) return url
    }
    return BRAND_IMAGES.default
  }
  return img || BRAND_IMAGES.default
}

function ProductCard({ product }: { product: any }) {
  const tc = useTranslations("common")
  const addItem = useCartStore(s => s.addItem)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null
  const imgSrc = getProductImage(product)

  return (
    <Link href={`/products/${product.id}`} className="group card hover:shadow-md transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-soft)]">
        <img
          src={imgSrc}
          alt={product.nameAr || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = BRAND_IMAGES.default }}
        />
        {discount && (
          <span className="badge bg-red-500 text-white absolute top-2 start-2 text-xs">
            -{discount}%
          </span>
        )}
        <button className="absolute top-2 end-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-[var(--text-muted)] mb-1 truncate">
          {product.vendor?.storeNameAr || product.vendor?.storeName}
        </p>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.nameAr || product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-bold text-primary-500">{product.price.toLocaleString()} {tc("iqd")}</span>
            {product.comparePrice && (
              <span className="text-xs text-[var(--text-muted)] line-through ms-1">
                {product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={e => { e.preventDefault(); addItem(product); toast.success("أضيف للسلة ✓") }}
            disabled={product.stock === 0}
            className="w-8 h-8 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-lg flex items-center justify-center"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const t  = useTranslations("home")
  const tc = useTranslations("common")
  const locale  = useLocale()
  const isRtl   = locale === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productsApi.list({ limit: "12" }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  })

  // إزالة المنتجات المكررة بناءً على الاسم
  const uniqueProducts = productsData?.data
    ? productsData.data.filter((p: any, idx: number, arr: any[]) =>
        arr.findIndex((x: any) => x.name === p.name) === idx
      )
    : []

  const cats = categoriesData?.data || categoriesData || []

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-700 dark:to-primary-900">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #D4A853 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 40%)`,
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-xl">
            <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/30 mb-4">
              🏺 Tello — تيلو
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
              {t("hero_title")}
            </h1>
            <p className="text-primary-100 text-lg mb-8">{t("hero_subtitle")}</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
              {t("hero_cta")}
              <ArrowIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 end-0 w-1/2 h-full opacity-5 hidden lg:block">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path d="M200,400 L200,200 Q200,50 350,50 L400,50 L400,400 Z" fill="white" />
            <path d="M0,400 L0,200 Q0,50 150,50 L200,50 Q50,50 50,200 L50,400 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== TRUST BADGES ===== */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary-500" /><span>توصيل سريع</span></div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary-500" /><span>دفع آمن</span></div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-gold-500" /><span>براندات أصلية</span></div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES STRIP ===== */}
      {cats.length > 0 && (
        <section className="bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">تسوّق حسب القسم</h2>
              <Link href="/products" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                عرض الكل <ArrowIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {cats.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:border-primary-400 hover:bg-primary-50/30 transition-all text-center group"
                >
                  <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                    {cat.icon || CATEGORY_EMOJI[cat.name?.toLowerCase()] || CATEGORY_EMOJI.default}
                  </span>
                  <span className="text-xs font-medium leading-tight text-[var(--text)] line-clamp-1">
                    {locale === "ar" ? cat.nameAr : cat.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {cat._count?.products || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{t("featured_title")}</h2>
          <Link href="/products" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 font-medium">
            {tc("see_all")} <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {productsLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : uniqueProducts.slice(0, 8).map((p: any) => <ProductCard key={p.id} product={p} />)
          }
        </div>

        {!productsLoading && uniqueProducts.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-5xl mb-3">🏺</p>
            <p>لا توجد منتجات حالياً</p>
          </div>
        )}
      </section>
    </main>
  )
}
