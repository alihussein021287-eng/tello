"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Topbar } from "@/components/layout/Topbar"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { TrendingUp, ShoppingCart, Users, DollarSign, Package, RefreshCw } from "lucide-react"

type Period = "week" | "month" | "year"

const COLORS = ["#1B4FD8","#D4A853","#10b981","#8b5cf6","#ef4444"]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month")

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin","analytics", period],
    queryFn:  () => api.get(`/api/admin/stats`).then(r => r.data),
    staleTime: 60_000,
  })

  const stats     = data?.data?.stats      || {}
  const chart     = data?.data?.salesChart  || []
  const topProds  = data?.data?.topProducts || []

  // Mock category distribution (يجي من API لاحقاً)
  const catData = [
    { name: "إلكترونيات", value: 35 },
    { name: "ملابس",      value: 25 },
    { name: "منزل",       value: 20 },
    { name: "طعام",       value: 12 },
    { name: "أخرى",       value: 8  },
  ]

  const KPIs = [
    { label: "إجمالي المبيعات",   value: stats.totalRevenue  || 0, suffix: " د.ع", icon: DollarSign,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", growth: stats.revenueGrowth },
    { label: "إجمالي الطلبات",    value: stats.totalOrders   || 0, suffix: "",      icon: ShoppingCart, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "المستخدمين النشطين",value: stats.totalUsers    || 0, suffix: "",      icon: Users,        color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "المنتجات النشطة",   value: stats.totalProducts || 0, suffix: "",      icon: Package,      color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-900/20" },
  ]

  return (
    <>
      <Topbar title="التحليلات والإحصائيات" />
      <div className="p-6 space-y-6">

        {/* Period + Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-1">
            {(["week","month","year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? "bg-primary-500 text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
              >
                {p === "week" ? "أسبوع" : p === "month" ? "شهر" : "سنة"}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIs.map(({ label, value, suffix, icon: Icon, color, bg, growth }) => (
            <div key={label} className="card p-5">
              <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-[var(--text)]">{value.toLocaleString()}{suffix}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
              {growth !== undefined && (
                <p className={`text-xs font-medium mt-1 ${growth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Sales Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            مبيعات آخر 7 أيام
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1B4FD8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"0.5rem", fontSize:"12px" }}
                formatter={(v:any) => [`${Number(v).toLocaleString()} د.ع`,"المبيعات"]} />
              <Area type="monotone" dataKey="sales" stroke="#1B4FD8" strokeWidth={2.5} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Top Products */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4">أكثر المنتجات مبيعاً</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({length:5}).map((_,i) => <div key={i} className="h-8 bg-[var(--border)] rounded animate-pulse" />)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProds.slice(0,5).map((p:any) => ({ name: (p.nameAr||p.name||"").slice(0,8), count: p.soldCount || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"0.5rem", fontSize:"12px" }} />
                  <Bar dataKey="count" fill="#1B4FD8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Distribution */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4">توزيع المبيعات حسب القسم</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {catData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {catData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[var(--text-muted)]">{name}</span>
                    </div>
                    <span className="font-semibold">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
