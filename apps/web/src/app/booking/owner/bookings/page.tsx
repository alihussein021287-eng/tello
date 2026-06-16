"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { Calendar, Users, Phone, ArrowRight, Check, X, Building2 } from "lucide-react"

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "بانتظار التأكيد", cls: "bg-yellow-500/15 text-yellow-600" },
  CONFIRMED:  { label: "مؤكد",            cls: "bg-green-500/15 text-green-600" },
  CHECKED_IN: { label: "تم الدخول",       cls: "bg-blue-500/15 text-blue-600" },
  COMPLETED:  { label: "مكتمل",           cls: "bg-gray-500/15 text-gray-500" },
  CANCELLED:  { label: "ملغي",            cls: "bg-red-500/15 text-red-600" },
}

export default function OwnerBookingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => api.get("/api/property-owner/bookings").then(r => r.data),
  })
  const bookings = data?.data || []

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/property-owner/bookings/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => { toast.success("تم تحديث الحجز"); qc.invalidateQueries({ queryKey: ["owner-bookings"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || "تعذّر التحديث"),
  })

  const fmt = (d: string) => new Date(d).toLocaleDateString("ar-IQ", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/booking/owner" className="text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowRight className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">حجوزات عقاراتي</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">لا توجد حجوزات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b: any) => {
              const st = STATUS[b.status] || STATUS.PENDING
              return (
                <div key={b.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-[var(--text)]">{b.property?.titleAr}</h3>
                      <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-1">
                        <Users className="w-3.5 h-3.5" /> {b.user?.name || "زبون"}
                        {b.user?.phone && <><Phone className="w-3.5 h-3.5 ms-2" /> {b.user.phone}</>}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmt(b.checkIn)} ← {fmt(b.checkOut)}</span>
                    <span>{b.nights} ليالي</span>
                    <span>{b.guests} أشخاص</span>
                    <span className="font-bold text-primary-500">{b.totalPrice?.toLocaleString()} د.ع</span>
                  </div>
                  {/* أزرار الإجراء */}
                  {b.status === "PENDING" && (
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                      <button onClick={() => statusMut.mutate({ id: b.id, status: "CONFIRMED" })} disabled={statusMut.isPending}
                        className="flex-1 bg-green-500/15 text-green-600 hover:bg-green-500/25 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                        <Check className="w-4 h-4" /> تأكيد الحجز
                      </button>
                      <button onClick={() => statusMut.mutate({ id: b.id, status: "CANCELLED" })} disabled={statusMut.isPending}
                        className="flex-1 bg-red-500/15 text-red-600 hover:bg-red-500/25 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
                        <X className="w-4 h-4" /> رفض
                      </button>
                    </div>
                  )}
                  {b.status === "CONFIRMED" && (
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                      <button onClick={() => statusMut.mutate({ id: b.id, status: "CHECKED_IN" })} disabled={statusMut.isPending}
                        className="flex-1 bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        تسجيل الدخول
                      </button>
                    </div>
                  )}
                  {b.status === "CHECKED_IN" && (
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                      <button onClick={() => statusMut.mutate({ id: b.id, status: "COMPLETED" })} disabled={statusMut.isPending}
                        className="flex-1 bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        إنهاء الحجز
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
