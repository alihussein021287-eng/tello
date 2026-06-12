"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileDown, TrendingUp, DollarSign, ShoppingCart, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export default function VendorReportsPage() {
  const [month, setMonth] = useState(currentMonth)
  const [year,  setYear]  = useState(currentYear)
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-report", month, year],
    queryFn:  () => api.get(`/api/reports/vendor/data?month=${month}&year=${year}`).then(r => r.data),
  })

  const report = data?.data

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/vendor/html?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("tello_token")}` } }
      )
      const html = await res.text()

      // فتح نافذة طباعة → حفظ كـ PDF
      const win = window.open("", "_blank")
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
      toast.success("جاري فتح التقرير — اختر 'حفظ كـ PDF' من الطباعة")
    } catch {
      toast.error("حدث خطأ في تحميل التقرير")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">التقارير المالية</h1>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input text-sm h-9 w-auto">
            {MONTHS_AR.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input text-sm h-9 w-auto">
            {[currentYear, currentYear - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={downloadPDF}
            disabled={downloading || isLoading}
            className="btn-primary flex items-center gap-2 text-sm h-9 px-4 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            تحميل PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-8 bg-[var(--border)] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[var(--border)] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : report && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "إجمالي المبيعات", value: report.summary.totalRevenue, icon: DollarSign, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
            { label: "عمولة Tello (10%)", value: report.summary.totalFees, icon: TrendingUp, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { label: "صافي الأرباح", value: report.summary.netEarnings, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-[var(--text)]">{value.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label} (د.ع)</p>
            </div>
          ))}
        </div>
      )}

      {/* Top Products */}
      {report?.topProducts?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">أكثر المنتجات مبيعاً — {MONTHS_AR[month - 1]} {year}</h3>
          <div className="space-y-3">
            {report.topProducts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-bold text-[var(--text-muted)]">#{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.nameAr}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.soldCount} قطعة مباعة</p>
                </div>
                <p className="text-sm font-bold text-primary-500">{(p.revenue || 0).toLocaleString()} د.ع</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data */}
      {!isLoading && report?.summary?.totalOrders === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>لا توجد مبيعات في {MONTHS_AR[month - 1]} {year}</p>
        </div>
      )}
    </div>
  )
}
