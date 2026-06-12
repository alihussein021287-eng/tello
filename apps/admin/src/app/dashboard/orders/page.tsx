"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Download, Eye, Bell, BellOff } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-yellow", CONFIRMED: "badge-blue", PREPARING: "badge-blue",
  SHIPPING: "badge-blue", DELIVERED: "badge-green", CANCELLED: "badge-red",
}
const STATUS_AR: Record<string, string> = {
  PENDING: "انتظار", CONFIRMED: "مؤكد", PREPARING: "جاري التحضير",
  SHIPPING: "في الطريق", DELIVERED: "مُسلَّم", CANCELLED: "ملغي",
}
const ALL_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"]
const NEXT_STATUS: Record<string, string> = {
  PENDING: "CONFIRMED", CONFIRMED: "PREPARING",
  PREPARING: "SHIPPING", SHIPPING: "DELIVERED",
}

export default function OrdersPage() {
  const qc = useQueryClient()
  const [search, setSearch]         = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [selected, setSelected]     = useState<any>(null)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [prevCount, setPrevCount]   = useState(0)

  // طلب إذن الإشعارات
  const enableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("المتصفح لا يدعم الإشعارات")
    const perm = await Notification.requestPermission()
    if (perm === "granted") {
      setNotifEnabled(true)
      toast.success("تم تفعيل الإشعارات ✅")
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", search, filterStatus],
    queryFn: () => adminApi.orders.list({ search, status: filterStatus, limit: 50 }),
    refetchInterval: 30000, // تحديث كل 30 ثانية
  })

  // إشعار لما يجي طلب جديد
  useEffect(() => {
    const orders = data?.data || []
    const pendingCount = orders.filter((o: any) => o.status === "PENDING").length
    if (prevCount > 0 && pendingCount > prevCount && notifEnabled && Notification.permission === "granted") {
      new Notification("🛒 طلب جديد على Tello!", {
        body: `عندك ${pendingCount - prevCount} طلب جديد يحتاج موافقة`,
        icon: "/favicon.svg",
      })
      toast.success(`🛒 طلب جديد وصل!`)
    }
    if (pendingCount !== prevCount) setPrevCount(pendingCount)
  }, [data])

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.orders.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] })
      toast.success("تم تحديث حالة الطلب")
      if (selected) setSelected((prev: any) => ({ ...prev, status: NEXT_STATUS[prev.status] || prev.status }))
    },
  })

  // تصدير Excel
  const exportExcel = () => {
    const orders = data?.data || []
    if (!orders.length) return toast.error("لا توجد طلبات للتصدير")

    const rows = [
      ["رقم الطلب", "العميل", "المبلغ", "الطريقة", "الحالة", "التاريخ"],
      ...orders.map((o: any) => [
        o.id.slice(-6).toUpperCase(),
        o.user?.name || "",
        o.total,
        o.paymentMethod,
        STATUS_AR[o.status] || o.status,
        new Date(o.createdAt).toLocaleDateString("ar-IQ"),
      ])
    ]

    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tello-orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("تم تصدير الطلبات ✅")
  }

  const orders = data?.data || []
  const pendingCount = orders.filter((o: any) => o.status === "PENDING").length

  return (
    <>
      <Topbar title="إدارة الطلبات" />
      <div className="p-6 space-y-4">

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">{pendingCount} طلب ينتظر موافقتك</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">راجع الطلبات وأكدها للبائعين</p>
              </div>
            </div>
            <button
              onClick={enableNotifications}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${notifEnabled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}
            >
              {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {notifEnabled ? "الإشعارات مفعّلة" : "فعّل الإشعارات"}
            </button>
          </div>
        )}

        {/* Filters + Export */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث برقم الطلب أو اسم العميل..."
                className="input ps-9 w-72 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus("")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filterStatus ? "bg-primary-500 text-white" : "bg-[var(--bg-soft)] hover:bg-[var(--border)]"}`}
              >
                الكل ({orders.length})
              </button>
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? "bg-primary-500 text-white" : "bg-[var(--bg-soft)] hover:bg-[var(--border)]"}`}
                >
                  {STATUS_AR[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </button>
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="text-end p-4 font-medium">#</th>
                <th className="text-end p-4 font-medium">العميل</th>
                <th className="text-end p-4 font-medium">المبلغ</th>
                <th className="text-end p-4 font-medium">الطريقة</th>
                <th className="text-end p-4 font-medium">الحالة</th>
                <th className="text-end p-4 font-medium">التاريخ</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="p-4"><div className="h-4 bg-[var(--border)] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))}
              {orders.map((o: any) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`border-b border-[var(--border)] hover:bg-[var(--bg-soft)] cursor-pointer transition-colors ${o.status === "PENDING" ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}`}
                >
                  <td className="p-4 font-mono font-bold text-primary-500">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="p-4 font-medium">{o.user?.name || "—"}</td>
                  <td className="p-4 font-bold">{o.total.toLocaleString()} د.ع</td>
                  <td className="p-4">{o.paymentMethod === "CASH" ? "كاش" : o.paymentMethod}</td>
                  <td className="p-4"><span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_AR[o.status]}</span></td>
                  <td className="p-4 text-[var(--text-muted)]">{new Date(o.createdAt).toLocaleDateString("ar-IQ")}</td>
                  <td className="p-4">
                    <button className="p-1.5 hover:bg-[var(--border)] rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && orders.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">لا توجد طلبات</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Order Detail Panel */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" onClick={() => setSelected(null)}>
            <div className="bg-[var(--bg)] w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
                <h3 className="font-bold">طلب #{selected.id.slice(-6).toUpperCase()}</h3>
                <button onClick={() => setSelected(null)} className="text-xl text-[var(--text-muted)] hover:text-[var(--text)]">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[var(--text-muted)]">العميل</p><p className="font-medium">{selected.user?.name}</p></div>
                  <div><p className="text-[var(--text-muted)]">الإجمالي</p><p className="font-bold text-primary-500">{selected.total.toLocaleString()} د.ع</p></div>
                  <div><p className="text-[var(--text-muted)]">الدفع</p><p className="font-medium">{selected.paymentMethod === "CASH" ? "كاش عند الاستلام" : selected.paymentMethod}</p></div>
                  <div><p className="text-[var(--text-muted)]">الحالة</p><span className={`badge ${STATUS_BADGE[selected.status]}`}>{STATUS_AR[selected.status]}</span></div>
                </div>

                {selected.address && (
                  <div className="bg-[var(--bg-soft)] rounded-xl p-3 text-sm">
                    <p className="font-medium mb-1">📍 عنوان التوصيل</p>
                    <p className="text-[var(--text-muted)]">{selected.address.city}، {selected.address.district}، {selected.address.street}</p>
                  </div>
                )}

                {selected.items?.length > 0 && (
                  <div>
                    <p className="font-medium mb-2 text-sm">المنتجات</p>
                    <div className="space-y-2">
                      {selected.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          {item.product?.images?.[0] && (
                            <img src={item.product.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product?.nameAr || item.product?.name}</p>
                            <p className="text-[var(--text-muted)]">{item.quantity}x × {item.price.toLocaleString()} د.ع</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm">
                    <p className="font-medium mb-1">📝 ملاحظات</p>
                    <p className="text-[var(--text-muted)]">{selected.notes}</p>
                  </div>
                )}

                {NEXT_STATUS[selected.status] && (
                  <button
                    onClick={() => updateStatus.mutate({ id: selected.id, status: NEXT_STATUS[selected.status] })}
                    disabled={updateStatus.isPending}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {updateStatus.isPending ? "جاري التحديث..." : `تحديث إلى: ${STATUS_AR[NEXT_STATUS[selected.status]]}`}
                  </button>
                )}

                <button
                  onClick={() => updateStatus.mutate({ id: selected.id, status: "CANCELLED" })}
                  disabled={updateStatus.isPending || selected.status === "CANCELLED" || selected.status === "DELIVERED"}
                  className="w-full py-2.5 border border-red-300 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 text-sm"
                >
                  إلغاء الطلب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
