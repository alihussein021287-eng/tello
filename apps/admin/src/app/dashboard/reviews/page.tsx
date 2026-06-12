"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Star, Trash2, Search, Eye } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

export default function ReviewsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin","reviews", search],
    queryFn:  () => api.get("/api/admin/reviews", { params: { search } }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/reviews/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin","reviews"] })
      toast.success("تم حذف التقييم")
    },
  })

  const reviews = data?.data || []

  return (
    <>
      <Topbar title="إدارة التقييمات" />
      <div className="p-6 space-y-4">

        <div className="relative w-64">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالمنتج أو المستخدم..." className="input ps-8 h-9 text-sm" />
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                {["المستخدم","المنتج","التقييم","التعليق","التاريخ",""].map(h => (
                  <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({length:8}).map((_,i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {Array.from({length:6}).map((_,j) => (
                    <td key={j} className="px-5 py-3"><div className="h-3 bg-[var(--border)] rounded animate-pulse w-16" /></td>
                  ))}
                </tr>
              ))}
              {reviews.map((r: any) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                  <td className="px-5 py-3 font-medium">{r.user?.name}</td>
                  <td className="px-5 py-3 text-xs text-[var(--text-muted)] max-w-[150px] truncate">{r.product?.nameAr}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)]"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-[var(--text-muted)] max-w-[200px] truncate">{r.comment || "—"}</td>
                  <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString("ar-IQ")}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => { if(confirm("حذف التقييم؟")) deleteMut.mutate(r.id) }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !reviews.length && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)]">لا توجد تقييمات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
