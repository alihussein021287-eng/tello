"use client"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ShoppingBag, ChevronLeft, Package } from "lucide-react"
import { api } from "@/lib/api"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useAuthStore } from "@/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PREPARING: "badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPING:  "badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}
const STATUS_AR: Record<string, string> = {
  PENDING: "انتظار", CONFIRMED: "مؤكد", PREPARING: "جاري التحضير",
  SHIPPING: "في الطريق", DELIVERED: "مُسلَّم", CANCELLED: "ملغي",
}

export default function OrdersPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/auth/login")
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn:  () => api.get("/api/orders").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-5 h-5 text-primary-500" />
          <h1 className="text-xl font-bold">طلباتي</h1>
        </div>

        <div className="space-y-3">
          {isLoading && Array.from({length: 4}).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-14 h-14 bg-[var(--border)] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--border)] rounded w-1/3" />
                <div className="h-3 bg-[var(--border)] rounded w-1/2" />
              </div>
            </div>
          ))}

          {data?.data?.map((order: any) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="card p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-primary-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold font-mono text-sm">#{order.id.slice(-6).toUpperCase()}</p>
                  <span className={STATUS_BADGE[order.status]}>
                    {STATUS_AR[order.status]}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {order.items?.length} منتج •{" "}
                  {new Date(order.createdAt).toLocaleDateString("ar-IQ")}
                </p>
              </div>

              {/* Price + Arrow */}
              <div className="text-end flex-shrink-0">
                <p className="font-bold text-primary-500 text-sm">{order.total?.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)]">د.ع</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
            </Link>
          ))}

          {!isLoading && !data?.data?.length && (
            <div className="text-center py-20">
              <ShoppingBag className="w-14 h-14 mx-auto mb-3 text-[var(--border)]" />
              <p className="font-semibold text-lg mb-1">ما عندك طلبات بعد</p>
              <p className="text-[var(--text-muted)] text-sm mb-6">ابدأ التسوق وطلباتك تظهر هنا</p>
              <Link href="/products" className="btn-primary inline-flex">تسوق الآن</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
