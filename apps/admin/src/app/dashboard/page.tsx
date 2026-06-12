"use client"
import { useQuery } from "@tanstack/react-query"
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Topbar } from "@/components/layout/Topbar"
import { StatCard } from "@/components/ui/StatCard"
import { api } from "@/lib/api"
import Link from "next/link"

const STATUS_BADGE: Record<string,string> = { PENDING:"badge-yellow",CONFIRMED:"badge-blue",PREPARING:"badge-blue",SHIPPING:"badge-blue",DELIVERED:"badge-green",CANCELLED:"badge-red" }
const STATUS_AR: Record<string,string> = { PENDING:"انتظار",CONFIRMED:"مؤكد",PREPARING:"جاري التحضير",SHIPPING:"في الطريق",DELIVERED:"مُسلَّم",CANCELLED:"ملغي" }

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin","stats"],
    queryFn:  () => api.get("/api/admin/stats").then(r => r.data),
    staleTime: 60_000,
  })

  const stats   = data?.data?.stats      || {}
  const orders  = data?.data?.recentOrders|| []
  const chart   = data?.data?.salesChart  || []
  const topProds= data?.data?.topProducts || []

  return (
    <>
      <Topbar title="لوحة التحكم" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="إجمالي المبيعات"  value={stats.totalRevenue   || 0} prefix="د.ع" change={stats.revenueGrowth} icon={DollarSign}   iconColor="text-emerald-500" />
          <StatCard title="طلبات اليوم"       value={stats.ordersToday    || 0} change={0}                               icon={ShoppingCart} />
          <StatCard title="المستخدمين"         value={stats.totalUsers     || 0} change={0}                               icon={Users}        iconColor="text-purple-500" />
          <StatCard title="المنتجات النشطة"    value={stats.totalProducts  || 0} change={0}                               icon={Package}      iconColor="text-orange-500" />
        </div>

        {/* Pending alerts */}
        {stats.pendingVendors > 0 && (
          <div className="card p-4 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              ⚠️ يوجد {stats.pendingVendors} طلب بائع ينتظر المراجعة
            </p>
            <Link href="/dashboard/vendors" className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold hover:underline">
              مراجعة →
            </Link>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-sm mb-4">المبيعات — آخر 7 أيام</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1B4FD8" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"0.5rem", fontSize:"12px" }} formatter={(v:any) => [`${Number(v).toLocaleString()} د.ع`,"المبيعات"]} />
                <Area type="monotone" dataKey="sales" stroke="#1B4FD8" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4">أكثر المنتجات مبيعاً</h3>
            {topProds.length === 0
              ? <p className="text-sm text-[var(--text-muted)] text-center py-10">لا توجد بيانات بعد</p>
              : (
                <div className="space-y-3">
                  {topProds.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center text-[var(--text-muted)] font-bold text-xs">#{i+1}</span>
                      <p className="flex-1 truncate">{p.nameAr || p.name}</p>
                      <span className="text-xs font-semibold text-primary-500">{p.soldCount}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-sm">آخر الطلبات</h3>
            <Link href="/dashboard/orders" className="text-xs text-primary-500 hover:underline">عرض الكل</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["رقم الطلب","العميل","المبلغ","الحالة","التاريخ",""].map(h => (
                    <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({length:6}).map((_,j) => <td key={j} className="px-5 py-3"><div className="h-3 bg-[var(--border)] rounded animate-pulse w-16"/></td>)}
                  </tr>
                ))}
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text-muted)]">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-3 font-medium">{o.user?.name || "—"}</td>
                    <td className="px-5 py-3 font-bold text-primary-500 text-xs">{o.total?.toLocaleString()} د.ع</td>
                    <td className="px-5 py-3"><span className={STATUS_BADGE[o.status]}>{STATUS_AR[o.status]}</span></td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{new Date(o.createdAt).toLocaleDateString("ar-IQ")}</td>
                    <td className="px-5 py-3"><Link href={`/dashboard/orders`} className="text-xs text-primary-500 hover:underline">تفاصيل</Link></td>
                  </tr>
                ))}
                {!isLoading && !orders.length && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[var(--text-muted)] text-sm">لا توجد طلبات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
