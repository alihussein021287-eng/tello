"use client"
import { useQuery } from "@tanstack/react-query"
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function VendorDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn:  () => api.get("/api/vendor/stats").then(r => r.data),
  })
  const stats = data?.data
  const dailySales = stats?.dailySales || []

  const CARDS = [
    { label: "منتجاتي",        value: stats?.totalProducts, icon: Package,      color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "طلبات اليوم",    value: stats?.totalOrders,   icon: ShoppingCart, color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "إجمالي المبيعات",value: stats?.totalRevenue,  icon: DollarSign,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", suffix: " د.ع" },
    { label: "أرباحي الصافية", value: stats?.myEarnings,    icon: TrendingUp,   color: "text-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-900/20",  suffix: " د.ع" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك في متجرك 🏪</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            نسبة العمولة: <span className="text-primary-500 font-semibold">{((stats?.commissionRate || 0.1) * 100)}%</span> من كل بيع
          </p>
        </div>
        <Link href="/vendor/dashboard/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          منتج جديد
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color, bg, suffix }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[var(--text-muted)] text-xs mb-1">{label}</p>
            <p className="text-xl font-bold text-[var(--text)]">
              {isLoading ? "—" : (typeof value === "number" ? value.toLocaleString() : "0")}{suffix || ""}
            </p>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="card p-6">
        <h2 className="font-bold text-base mb-4 text-[var(--text)]">📈 مبيعات آخر 7 أيام</h2>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-muted)]">جاري التحميل...</div>
        ) : dailySales.every((d: any) => d.revenue === 0) ? (
          <div className="h-48 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">لا توجد مبيعات مدفوعة بعد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailySales} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any) => [`${value.toLocaleString()} د.ع`, "المبيعات"]}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/vendor/dashboard/products", label: "إدارة المنتجات", icon: "📦", desc: "أضف وعدّل منتجاتك" },
          { href: "/vendor/dashboard/orders",   label: "الطلبات الواردة", icon: "🛍️", desc: "تتبع طلبات عملائك" },
          { href: "/vendor/dashboard/settings", label: "إعدادات المتجر", icon: "⚙️", desc: "عدّل معلومات متجرك" },
        ].map(({ href, label, icon, desc }) => (
          <Link key={href} href={href} className="card p-4 hover:border-primary-500 transition-colors group">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="font-semibold text-sm group-hover:text-primary-500 transition-colors">{label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
