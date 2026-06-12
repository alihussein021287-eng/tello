"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { adminApi, api } from "@/lib/api"
import { Topbar } from "@/components/layout/Topbar"
import toast from "react-hot-toast"

export default function AdminVendorsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vendor-applications"],
    queryFn:  () => api.get("/api/admin/vendor/applications?status=PENDING").then(r => r.data),
  })

  const actionMut = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.patch(`/api/admin/vendor/applications/${userId}`, { action }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "vendor-applications"] })
      toast.success(vars.action === "approve" ? "تم قبول البائع ✅" : "تم رفض الطلب")
    },
  })

  return (
    <>
      <Topbar title="طلبات البائعين" />
      <div className="p-6 space-y-4">

        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold">طلبات قيد المراجعة</h2>
          {data?.data?.length > 0 && (
            <span className="badge bg-yellow-100 text-yellow-700">{data.data.length}</span>
          )}
        </div>

        <div className="space-y-3">
          {isLoading && Array.from({length: 3}).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-[var(--border)] rounded w-1/3 mb-2" />
              <div className="h-3 bg-[var(--border)] rounded w-1/2" />
            </div>
          ))}

          {data?.data?.map((app: any) => (
            <div key={app.userId} className="card p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold">{app.storeNameAr}</p>
                  <span className="text-xs text-[var(--text-muted)]">/ {app.storeName}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-1">
                  {app.user?.name} — {app.user?.email}
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  📞 {app.phone} &nbsp;|&nbsp; 🏪 {app.category}
                </p>
                <p className="text-sm border-r-2 border-primary-400 pr-3 text-[var(--text-muted)]">
                  {app.description}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {new Date(app.createdAt).toLocaleDateString("ar-IQ")}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => actionMut.mutate({ userId: app.userId, action: "approve" })}
                  disabled={actionMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  قبول
                </button>
                <button
                  onClick={() => actionMut.mutate({ userId: app.userId, action: "reject" })}
                  disabled={actionMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  رفض
                </button>
              </div>
            </div>
          ))}

          {!isLoading && !data?.data?.length && (
            <div className="card p-12 text-center text-[var(--text-muted)]">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              لا توجد طلبات معلقة
            </div>
          )}
        </div>
      </div>
    </>
  )
}
