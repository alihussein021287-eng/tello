"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { MapPin, Calendar, Users, Building2, X } from "lucide-react"

const TYPE_AR: Record<string, string> = {
  HOTEL: "فندق", CHALET: "شاليه", APARTMENT: "شقة", HOUSE: "بيت", FARM: "مزرعة", HALL: "قاعة",
}
const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "بانتظار التأكيد", cls: "bg-yellow-500/15 text-yellow-600" },
  CONFIRMED:  { label: "مؤكد",            cls: "bg-green-500/15 text-green-600" },
  CHECKED_IN: { label: "تم الدخول",       cls: "bg-blue-500/15 text-blue-600" },
  COMPLETED:  { label: "مكتمل",           cls: "bg-gray-500/15 text-gray-500" },
  CANCELLED:  { label: "ملغي",            cls: "bg-red-500/15 text-red-600" },
}

export default function MyBookingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my").then(r => r.data),
  })
  const bookings = data?.data || []

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`).then(r => r.data),
    onSuccess: () => { toast.success("تم إلغاء الحجز"); qc.invalidateQueries({ queryKey: ["my-bookings"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || "تعذّر الإلغاء"),
  })

  const fmt = (d: string) => new Date(d).toLocaleDateString("ar-IQ", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">حجوزاتي</h1>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-4">لا توجد حجوزات بعد</p>
            <Link href="/booking" className="btn-primary inline-block px-6 py-2.5">تصفّح العقارات</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b: any) => {
              const st = STATUS[b.status] || STATUS.PENDING
              const canCancel = !["COMPLETED", "CANCELLED"].includes(b.status)
              return (
                <div key={b.id} className="card p-4 flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-24 bg-[var(--bg-soft)] rounded-xl overflow-hidden flex-shrink-0">
                    {b.property?.images?.[0]
                      ? <img src={b.property.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-[var(--text-muted)] opacity-30" /></div>
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">{TYPE_AR[b.property?.type]}</span>
                        <h3 className="font-bold text-[var(--text)]">{b.property?.titleAr}</h3>
                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {b.property?.city}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmt(b.checkIn)} ← {fmt(b.checkOut)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.guests} أشخاص</span>
                      <span>{b.nights} ليالي</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                      <span className="font-bold text-primary-500">{b.totalPrice?.toLocaleString()} د.ع</span>
                      {canCancel && (
                        <button onClick={() => cancelMut.mutate(b.id)} disabled={cancelMut.isPending}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-50">
                          <X className="w-3.5 h-3.5" /> إلغاء الحجز
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
