"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { SlidersHorizontal, X, Search } from "lucide-react"
import { api } from "@/lib/api"
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

const SORT_OPTIONS = [
  { value: "newest",     label: "الأحدث" },
  { value: "price_asc",  label: "السعر: الأقل" },
  { value: "price_desc", label: "السعر: الأعلى" },
  { value: "popular",    label: "الأكثر مبيعاً" },
]

export default function ProductsPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search:   params.get("q")        || "",
    category: params.get("category") || "",
    minPrice: params.get("min")      || "",
    maxPrice: params.get("max")      || "",
    sort:     params.get("sort")     || "newest",
    inStock:  params.get("inStock")  === "true",
  })

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn:  () => api.get("/api/categories").then(r => r.data),
  })

  const qp: Record<string, string> = {
    page: String(page), limit: "20",
    ...(filters.search   && { search:   filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.inStock  && { inStock: "true" }),
    sort: filters.sort,
  }

  const { data, isLoading } = useQuery({
    queryKey: ["products", "search", qp],
    queryFn:  () => api.get("/api/products", { params: qp }).then(r => r.data),
  })

  useEffect(() => {
    const p = new URLSearchParams()
    if (filters.search)   p.set("q",        filters.search)
    if (filters.category) p.set("category", filters.category)
    if (filters.minPrice) p.set("min",      filters.minPrice)
    if (filters.maxPrice) p.set("max",      filters.maxPrice)
    if (filters.inStock)  p.set("inStock",  "true")
    if (filters.sort !== "newest") p.set("sort", filters.sort)
    router.replace(`/products?${p.toString()}`, { scroll: false })
  }, [filters])

  const activeCount = [filters.category, filters.minPrice, filters.maxPrice, filters.inStock ? "1" : ""].filter(Boolean).length
  const clearFilters = () => setFilters(f => ({ ...f, category: "", minPrice: "", maxPrice: "", inStock: false }))

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="search" value={filters.search}
              onChange={e => { setFilters(f => ({...f, search: e.target.value})); setPage(1) }}
              placeholder="ابحث عن أي منتج..." className="input ps-9 h-10 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${activeCount > 0 ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "border-[var(--border)] text-[var(--text)]"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلاتر {activeCount > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">{activeCount}</span>}
          </button>
          <select value={filters.sort} onChange={e => setFilters(f => ({...f, sort: e.target.value}))} className="input h-10 text-sm w-auto ps-3">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-5 mb-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">تصفية النتائج</h3>
              <div className="flex gap-2">
                {activeCount > 0 && <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">مسح الكل</button>}
                <button onClick={() => setShowFilters(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5 text-[var(--text-muted)]">القسم</label>
                <select value={filters.category} onChange={e => { setFilters(f => ({...f, category: e.target.value})); setPage(1) }} className="input text-sm">
                  <option value="">كل الأقسام</option>
                  {cats?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5 text-[var(--text-muted)]">السعر من (د.ع)</label>
                <input type="number" value={filters.minPrice} onChange={e => { setFilters(f => ({...f, minPrice: e.target.value})); setPage(1) }} className="input text-sm" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5 text-[var(--text-muted)]">السعر إلى (د.ع)</label>
                <input type="number" value={filters.maxPrice} onChange={e => { setFilters(f => ({...f, maxPrice: e.target.value})); setPage(1) }} className="input text-sm" placeholder="بلا حد" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5 text-[var(--text-muted)]">المخزون</label>
                <label className="flex items-center gap-2 cursor-pointer mt-2.5">
                  <input type="checkbox" checked={filters.inStock} onChange={e => setFilters(f => ({...f, inStock: e.target.checked}))} className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm">متوفر فقط</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {isLoading ? "..." : `${data?.total || 0} نتيجة`}{filters.search && ` لـ "${filters.search}"`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {isLoading
            ? Array.from({length: 20}).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.data?.map((p: any) => <ProductCard key={p.id} product={p} />)
          }
        </div>

        {!isLoading && !data?.data?.length && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-lg font-medium mb-4">لا توجد نتائج</p>
            <button onClick={clearFilters} className="btn-primary">مسح الفلاتر</button>
          </div>
        )}

        {data?.hasMore && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => setPage(p => p + 1)} className="btn-primary px-8">
              تحميل المزيد
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
