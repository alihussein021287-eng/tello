"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

export default function CommissionsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin","commissions"],
    queryFn:  () => api.get("/api/admin/commissions").then(r => r.data),
  })

  const payMut = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/commissions/${id}/pay`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin","commissions"] })
      toast.success("تم تسجيل الدفع")
    },
  })

  const commissions = data?.data  || []
  const summary     = data?.summary || {}

  return (
    <>
      <Topbar title="العمولات" />
      <div className="p-6 space-y-5">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي العمولات",  value: summary.total     || 0, icon: DollarSign,  color: "text-primary-500",  bg: "bg-primary-50 dark:bg-primary-900/20" },
            { label: "مدفوعة",           value: summary.paid      || 0, icon: CheckCircle, color: "text-emerald-500",  bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "معلقة",            value: summary.pending   || 0, icon: Clock,       color: "text-yellow-500",   bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold">{value.toLocaleString()} <span className="text-sm font-normal text-[var(--text-muted)]">د.ع</span></p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                {["البائع","الطلب","المبيعات","النسبة","العمولة","الحالة",""].map(h => (
                  <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({length:6}).map((_,i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {Array.from({length:7}).map((_,j) => (
                    <td key={j} className="px-5 py-3"><div className="h-3 bg-[var(--border)] rounded animate-pulse w-16" /></td>
                  ))}
                </tr>
              ))}
              {commissions.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                  <td className="px-5 py-3 font-medium">{c.vendor?.storeName || c.vendorId.slice(-6)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-muted)]">#{c.orderId.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3 text-xs">{c.amount.toLocaleString()} د.ع</td>
                  <td className="px-5 py-3 text-xs">{(c.rate * 100).toFixed(0)}%</td>
                  <td className="px-5 py-3 font-bold text-primary-500 text-xs">{c.fee.toLocaleString()} د.ع</td>
                  <td className="px-5 py-3">
                    <span className={c.status === "PAID" ? "badge-green" : "badge-yellow"}>
                      {c.status === "PAID" ? "مدفوعة" : "معلقة"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.status === "PENDING" && (
                      <button
                        onClick={() => payMut.mutate(c.id)}
                        disabled={payMut.isPending}
                        className="text-xs text-primary-500 hover:underline disabled:opacity-50"
                      >
                        تسجيل دفع
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !commissions.length && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">لا توجد عمولات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
