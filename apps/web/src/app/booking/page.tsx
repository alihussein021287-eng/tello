"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import { Search, MapPin, Users, Star, Building2, Home, Tent, Trees, Hotel, PartyPopper } from "lucide-react"

const TYPES = [
  { val: "",          label: "الكل",     icon: Building2 },
  { val: "HOTEL",     label: "فنادق",    icon: Hotel },
  { val: "CHALET",    label: "شاليهات",  icon: Tent },
  { val: "APARTMENT", label: "شقق",      icon: Building2 },
  { val: "HOUSE",     label: "بيوت",     icon: Home },
  { val: "FARM",      label: "مزارع",    icon: Trees },
  { val: "HALL",      label: "قاعات",    icon: PartyPopper },
]

const TYPE_AR: Record<string, string> = {
  HOTEL: "فندق", CHALET: "شاليه", APARTMENT: "شقة", HOUSE: "بيت", FARM: "مزرعة", HALL: "قاعة",
}

export default function BookingPage() {
  const [type, setType] = useState("")
  const [city, setCity] = useState("")
  const [search, setSearch] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [sort, setSort] = useState("newest")

  const { data, isLoading } = useQuery({
    queryKey: ["properties", type, city, search, minPrice, maxPrice, sort],
    queryFn: () => api.get("/api/properties", {
      params: { type, city, search, minPrice, maxPrice, sort, limit: 24 },
    }).then(r => r.data),
  })

  const properties = data?.data || []

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">احجز إقامتك المثالية</h1>
          <p className="text-white/80 mb-6">فنادق، شاليهات، شقق، بيوت ومزارع في كل العراق</p>
          {/* شريط بحث */}
          <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="المدينة أو المنطقة"
                className="w-full py-2.5 text-[var(--text)] bg-transparent outline-none text-sm"
              />
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 border-t md:border-t-0 md:border-s border-[var(--border)]">
              <Search className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن عقار..."
                className="w-full py-2.5 text-[var(--text)] bg-transparent outline-none text-sm"
              />
            </div>
            <button className="btn-primary px-8 py-2.5 rounded-xl">بحث</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* فلاتر النوع */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {TYPES.map(({ val, label, icon: Icon }) => (
            <button
              key={val}
              onClick={() => setType(val)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${type === val ? "bg-primary-500 text-white" : "bg-[var(--bg-soft)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* شريط الترتيب + فلتر السعر + عدد النتائج */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">السعر:</span>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="من" className="input h-9 w-24 text-sm" />
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="إلى" className="input h-9 w-24 text-sm" />
            {(minPrice || maxPrice || type || city || search) && (
              <button onClick={() => { setMinPrice(""); setMaxPrice(""); setType(""); setCity(""); setSearch("") }} className="text-xs text-red-500 hover:underline">مسح الفلاتر</button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && <span className="text-xs text-[var(--text-muted)]">{properties.length} عقار</span>}
            <select value={sort} onChange={e => setSort(e.target.value)} className="input h-9 text-sm cursor-pointer">
              <option value="newest">الأحدث</option>
              <option value="price_asc">الأرخص سعراً</option>
              <option value="price_desc">الأغلى سعراً</option>
            </select>
          </div>
        </div>

        {/* النتائج */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[var(--border)]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--border)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">لا توجد عقارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/booking/${p.id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] bg-[var(--bg-soft)] relative overflow-hidden">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-12 h-12 text-[var(--text-muted)] opacity-30" /></div>
                  }
                  <span className="absolute top-3 start-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full">
                    {TYPE_AR[p.type] || p.type}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-[var(--text)] line-clamp-1">{p.titleAr}</h3>
                    {p.reviewCount > 0 && (
                      <div className="flex items-center gap-1 text-xs flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{p.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {p.city}{p.area ? ` — ${p.area}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Users className="w-3.5 h-3.5" /> {p.maxGuests} أشخاص
                    </div>
                    <div className="text-primary-500 font-bold">
                      {p.pricePerNight?.toLocaleString()} <span className="text-xs font-normal text-[var(--text-muted)]">د.ع/ليلة</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
