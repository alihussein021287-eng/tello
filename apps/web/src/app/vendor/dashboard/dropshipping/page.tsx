"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Package, Plus, Globe, Truck, DollarSign, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import toast from "react-hot-toast"
import Image from "next/image"

export default function DropshippingPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch]   = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [price, setPrice]     = useState("")
  const [importing, setImporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["dropship-products", search],
    queryFn:  () => api.get("/api/dropship/products", { params: { search } }).then(r => r.data),
  })

  const importMut = useMutation({
    mutationFn: () => api.post("/api/dropship/import", {
      dropshipProductId: selected.id,
      sellingPrice:      Number(price),
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      toast.success("تم استيراد المنتج لمتجرك! ✅")
      setSelected(null)
      setPrice("")
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "حدث خطأ"),
  })

  const products = data?.data || []

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          Dropshipping
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          استورد منتجات من موردين عالميين وبيعها بدون مخزون
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "🔍", title: "اختر منتجاً", desc: "تصفح آلاف المنتجات" },
          { icon: "💰", title: "حدد سعرك",   desc: "هامشك هو ربحك" },
          { icon: "📦", title: "الموردين يشحنون", desc: "بدون مخزون" },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card p-4 text-center">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-[var(--text-muted)]">{desc}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ابحث في منتجات الموردين..."
        className="input w-full"
      />

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading && Array.from({length: 6}).map((_,i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            <div className="aspect-square bg-[var(--border)]" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-[var(--border)] rounded w-3/4" />
              <div className="h-4 bg-[var(--border)] rounded w-1/2" />
            </div>
          </div>
        ))}

        {products.map((p: any) => {
          const minSell  = Math.ceil(p.basePrice * 1.3) // هامش 30% كحد أدنى
          return (
            <div
              key={p.id}
              className="card overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
              onClick={() => { setSelected(p); setPrice(String(minSell)) }}
            >
              <div className="aspect-square bg-[var(--bg-soft)] relative">
                {p.images?.[0]
                  ? <Image src={p.images[0]} alt={p.nameAr} fill className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                }
                <div className="absolute top-2 start-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Truck className="w-2.5 h-2.5" />
                  {p.supplier?.shippingDays} يوم
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-2 mb-2">{p.nameAr}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">تكلفة الموردين</p>
                    <p className="text-sm font-bold text-[var(--text)]">{p.basePrice.toLocaleString()} د.ع</p>
                  </div>
                  <button className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-500 px-2.5 py-1.5 rounded-lg font-medium hover:bg-primary-100 transition-colors">
                    استورد
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {!isLoading && !products.length && (
          <div className="col-span-3 py-16 text-center text-[var(--text-muted)]">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>لا توجد منتجات — أضاف المدير منتجات Dropshipping لاحقاً</p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold">استيراد المنتج لمتجرك</h2>
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-soft)] rounded-xl">
              <div className="w-12 h-12 bg-[var(--border)] rounded-lg overflow-hidden flex-shrink-0">
                {selected.images?.[0]
                  ? <Image src={selected.images[0]} alt="" width={48} height={48} className="object-cover w-full h-full" />
                  : <div className="w-full h-full flex items-center justify-center">📦</div>
                }
              </div>
              <div>
                <p className="text-sm font-medium">{selected.nameAr}</p>
                <p className="text-xs text-[var(--text-muted)]">تكلفة: {selected.basePrice.toLocaleString()} د.ع</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">سعر البيع (د.ع)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="input"
                placeholder={String(Math.ceil(selected.basePrice * 1.3))}
              />
              {Number(price) > 0 && (
                <p className="text-xs mt-1.5">
                  <span className="text-[var(--text-muted)]">ربحك: </span>
                  <span className={Number(price) - selected.basePrice > 0 ? "text-emerald-500 font-semibold" : "text-red-500"}>
                    {(Number(price) - selected.basePrice).toLocaleString()} د.ع
                    {" "}({(((Number(price) - selected.basePrice) / Number(price)) * 100).toFixed(0)}%)
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1 border border-[var(--border)]">إلغاء</button>
              <button
                onClick={() => importMut.mutate()}
                disabled={!price || Number(price) < selected.basePrice * 1.1 || importMut.isPending}
                className="btn-primary flex-1 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {importMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                استورد للمتجر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
