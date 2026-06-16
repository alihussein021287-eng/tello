"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { Building2, Check, X, MapPin, Phone, Users, BedDouble } from "lucide-react"

const TYPE_AR: Record<string, string> = {
  HOTEL: "فندق", CHALET: "شاليه", APARTMENT: "شقة", HOUSE: "بيت", FARM: "مزرعة", HALL: "قاعة",
}
const TABS = [
  { val: "PENDING",  label: "بانتظار المراجعة" },
  { val: "APPROVED", label: "معتمدة" },
  { val: "REJECTED", label: "مرفوضة" },
  { val: "",         label: "الكل" },
]

export default function AdminPropertiesPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState("PENDING")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", tab],
    queryFn: () => adminApi.properties.list(tab),
  })
  const properties = data?.data || []

  const approveMut = useMutation({
    mutationFn: (id: string) => adminApi.properties.approve(id),
    onSuccess: () => { toast.success("تمت الموافقة ✓"); qc.invalidateQueries({ queryKey: ["admin-properties"] }) },
    onError: () => toast.error("تعذّرت الموافقة"),
  })
  const rejectMut = useMutation({
    mutationFn: (id: string) => adminApi.properties.reject(id),
    onSuccess: () => { toast.success("تم الرفض"); qc.invalidateQueries({ queryKey: ["admin-properties"] }) },
    onError: () => toast.error("تعذّر الرفض"),
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">العقارات</h1>
      <p className="text-sm text-gray-400 mb-6">مراجعة والموافقة على عقارات منصة الحجوزات</p>

      {/* تبويبات */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {TABS.map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.val ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-64 animate-pulse" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>لا توجد عقارات في هذه الحالة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p: any) => (
            <div key={p.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="aspect-[4/3] bg-gray-900 relative">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-12 h-12 text-gray-600" /></div>}
                <span className="absolute top-2 start-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">{TYPE_AR[p.type]}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1">{p.titleAr}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.city}{p.area ? ` — ${p.area}` : ""}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.maxGuests}</span>
                  <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms}</span>
                  <span className="text-blue-400 font-bold">{p.pricePerNight?.toLocaleString()} د.ع</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {p.owner?.storeName} — {p.owner?.phone}
                </p>
                {p.status === "PENDING" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveMut.mutate(p.id)} disabled={approveMut.isPending}
                      className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 py-2 rounded-lg text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                      <Check className="w-4 h-4" /> موافقة
                    </button>
                    <button onClick={() => rejectMut.mutate(p.id)} disabled={rejectMut.isPending}
                      className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 py-2 rounded-lg text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                      <X className="w-4 h-4" /> رفض
                    </button>
                  </div>
                )}
                {p.status === "APPROVED" && <span className="inline-block mt-3 text-xs text-green-400">✓ معتمد وظاهر</span>}
                {p.status === "REJECTED" && (
                  <button onClick={() => approveMut.mutate(p.id)} className="mt-3 text-xs text-green-400 hover:underline">إعادة الموافقة</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
