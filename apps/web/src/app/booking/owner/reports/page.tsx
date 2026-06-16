"use client"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import { ArrowRight, Building2, CalendarCheck, DollarSign, Clock, TrendingUp, Trophy } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const STATUS_AR: Record<string, string> = {
  PENDING: "بانتظار", CONFIRMED: "مؤكد", CHECKED_IN: "تم الدخول", COMPLETED: "مكتمل", CANCELLED: "ملغي",
}

export default function OwnerReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-stats"],
    queryFn: () => api.get("/api/property-owner/stats").then(r => r.data),
  })
  const s = data?.data

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">جاري التحميل...</div>

  const cards = [
    { label: "العقارات", value: s?.propertiesCount || 0, icon: Building2, color: "text-blue-500" },
    { label: "إجمالي الحجوزات", value: s?.totalBookings || 0, icon: CalendarCheck, color: "text-purple-500" },
    { label: "الأرباح المؤكدة", value: `${(s?.totalRevenue || 0).toLocaleString()} د.ع`, icon: DollarSign, color: "text-green-500" },
    { label: "ليالي محجوزة", value: s?.totalNights || 0, icon: Clock, color: "text-orange-500" },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/booking/owner" className="text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowRight className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">تقارير عقاراتي</h1>
        </div>

        {/* البطاقات */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c, i) => (
            <div key={i} className="card p-4">
              <c.icon className={`w-6 h-6 ${c.color} mb-2`} />
              <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
              <p className="text-lg font-bold text-[var(--text)]">{c.value}</p>
            </div>
          ))}
        </div>

        {/* أرباح معلّقة */}
        {s?.pendingRevenue > 0 && (
          <div className="card p-4 mb-6 bg-yellow-500/5 border-yellow-500/20">
            <p className="text-sm text-[var(--text-muted)]">أرباح معلّقة (حجوزات بانتظار التأكيد)</p>
            <p className="text-xl font-bold text-yellow-600">{s.pendingRevenue.toLocaleString()} د.ع</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* رسم بياني شهري */}
          <div className="card p-5">
            <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" /> الحجوزات آخر 6 أشهر</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="bookings" name="حجوزات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* حسب الحالة */}
          <div className="card p-5">
            <h2 className="font-bold text-[var(--text)] mb-4">الحجوزات حسب الحالة</h2>
            <div className="space-y-2">
              {Object.entries(s?.byStatus || {}).map(([st, count]: any) => (
                <div key={st} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{STATUS_AR[st] || st}</span>
                  <span className="font-bold text-[var(--text)]">{count}</span>
                </div>
              ))}
              {!s?.byStatus || Object.keys(s.byStatus).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">لا توجد حجوزات بعد</p>
              )}
            </div>
          </div>
        </div>

        {/* أكثر العقارات حجزاً */}
        {s?.topProperties?.length > 0 && (
          <div className="card p-5 mt-6">
            <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> أكثر العقارات حجزاً</h2>
            <div className="space-y-3">
              {s.topProperties.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--bg-soft)] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm font-medium text-[var(--text)]">{p.title}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{p.count} حجز · {p.revenue.toLocaleString()} د.ع</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
