"use client"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

const STATUS_AR: Record<string, string> = {
  PENDING: "انتظار", CONFIRMED: "مؤكد", PREPARING: "جاري التحضير",
  SHIPPING: "في الطريق", DELIVERED: "مُسلَّم", CANCELLED: "ملغي",
}
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-blue-100 text-blue-700",   SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700",
}

export default function VendorOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn:  () => api.get("/api/vendor/orders").then(r => r.data),
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">الطلبات الواردة</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
              {["#الطلب", "العميل", "المنتجات", "المبلغ", "الحالة", "التاريخ"].map(h => (
                <th key={h} className="text-start px-4 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({length: 5}).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                {Array.from({length: 6}).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-16" /></td>
                ))}
              </tr>
            ))}
            {data?.data?.map((order: any) => (
              <tr key={order.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                  #{order.id.slice(-6).toUpperCase()}
                </td>
                <td className="px-4 py-3 font-medium">{order.user?.name}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {order.items?.map((i: any) => i.product?.nameAr).join("، ")}
                </td>
                <td className="px-4 py-3 font-bold text-primary-500 text-xs">
                  {order.items?.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toLocaleString()} د.ع
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[order.status]}`}>
                    {STATUS_AR[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {new Date(order.createdAt).toLocaleDateString("ar-IQ")}
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-[var(--text-muted)]">لا توجد طلبات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
