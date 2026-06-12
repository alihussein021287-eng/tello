"use client"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle, Clock, Package, Truck,
  MapPin, ChevronLeft, Phone, Copy,
} from "lucide-react"
import { api } from "@/lib/api"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import toast from "react-hot-toast"

const STEPS = [
  { key: "PENDING",   label: "تم استلام الطلب",      icon: Clock,         desc: "طلبك وصل وقيد المراجعة" },
  { key: "CONFIRMED", label: "تم تأكيد الطلب",       icon: CheckCircle,   desc: "المتجر أكد طلبك" },
  { key: "PREPARING", label: "جاري تحضير الطلب",     icon: Package,       desc: "يتم تجهيز منتجاتك" },
  { key: "SHIPPING",  label: "في الطريق إليك",        icon: Truck,         desc: "طلبك خرج للتوصيل" },
  { key: "DELIVERED", label: "تم التسليم",            icon: MapPin,        desc: "وصل طلبك بنجاح" },
]

const STATUS_ORDER = ["PENDING","CONFIRMED","PREPARING","SHIPPING","DELIVERED"]

const PAYMENT_AR: Record<string, string> = {
  PENDING:  "بانتظار الدفع",
  PAID:     "مدفوع ✓",
  FAILED:   "فشل الدفع",
  REFUNDED: "مسترد",
}

export default function OrderTrackingPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn:  () => api.get(`/api/orders/${id}`).then(r => r.data),
    refetchInterval: 30_000, // تحديث كل 30 ثانية
  })

  const order = data?.data

  const copyOrderId = () => {
    navigator.clipboard.writeText(`#${id.slice(-6).toUpperCase()}`)
    toast.success("تم نسخ رقم الطلب")
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10 space-y-4">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-[var(--border)] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[var(--border)] rounded w-2/3" />
            </div>
          ))}
        </main>
        <Footer />
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-xl font-bold mb-2">الطلب غير موجود</h1>
          <Link href="/account/orders" className="btn-primary inline-flex mt-4">طلباتي</Link>
        </main>
        <Footer />
      </>
    )
  }

  const currentStep = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === "CANCELLED"

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          رجوع
        </button>

        {/* Header card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">رقم الطلب</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold font-mono text-primary-500">
                  #{id.slice(-6).toUpperCase()}
                </p>
                <button onClick={copyOrderId} className="p-1 hover:bg-[var(--bg-soft)] rounded-lg transition-colors">
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {new Date(order.createdAt).toLocaleDateString("ar-IQ", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-[var(--text-muted)] mb-1">الإجمالي</p>
              <p className="text-xl font-bold text-primary-500">{order.total?.toLocaleString()} <span className="text-sm font-normal text-[var(--text-muted)]">د.ع</span></p>
              <p className={`text-xs mt-1 font-medium ${order.paymentStatus === "PAID" ? "text-emerald-500" : "text-yellow-500"}`}>
                {PAYMENT_AR[order.paymentStatus] || order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-6">
          <h2 className="font-bold mb-6">تتبع الطلب</h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✕</span>
              </div>
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">تم إلغاء الطلب</p>
                <p className="text-sm text-red-500 dark:text-red-500 mt-0.5">تواصل مع الدعم لمزيد من المعلومات</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {STEPS.map((step, i) => {
                const Icon      = step.icon
                const isDone    = i <= currentStep
                const isActive  = i === currentStep
                const isLast    = i === STEPS.length - 1

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Icon + Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        isDone
                          ? isActive
                            ? "bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/30"
                            : "bg-emerald-500 border-emerald-500"
                          : "bg-[var(--bg)] border-[var(--border)]"
                      }`}>
                        <Icon className={`w-4 h-4 ${isDone ? "text-white" : "text-[var(--text-muted)]"}`} />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-10 mt-1 ${i < currentStep ? "bg-emerald-400" : "bg-[var(--border)]"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                      <p className={`font-semibold text-sm ${isDone ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
                        {step.label}
                        {isActive && (
                          <span className="ms-2 inline-flex items-center gap-1 text-xs font-medium text-primary-500">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                            الحالة الحالية
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDone ? "text-[var(--text-muted)]" : "text-[var(--border)]"}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Address */}
        {order.address && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-sm">عنوان التوصيل</h3>
            </div>
            <p className="text-sm font-medium">{order.address.label}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {order.address.city}، {order.address.district}، {order.address.street}
              {order.address.building && `، ${order.address.building}`}
            </p>
            {order.address.notes && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{order.address.notes}</p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">المنتجات ({order.items?.length})</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-soft)] flex-shrink-0 border border-[var(--border)]">
                  {item.product?.images?.[0]
                    ? <Image src={item.product.images[0]} alt={item.product.nameAr} width={56} height={56} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`} className="text-sm font-medium hover:text-primary-500 transition-colors line-clamp-1">
                    {item.product?.nameAr || item.product?.name}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)]">×{item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-primary-500 flex-shrink-0">
                  {(item.price * item.quantity).toLocaleString()} <span className="text-xs font-normal text-[var(--text-muted)]">د.ع</span>
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] mt-4 pt-4 flex justify-between font-bold">
            <span>الإجمالي</span>
            <span className="text-primary-500">{order.total?.toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* Support */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">تحتاج مساعدة؟</p>
            <p className="text-xs text-[var(--text-muted)]">تواصل مع الدعم بخصوص طلبك</p>
          </div>
          <a
            href="https://wa.me/9647808765888"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Phone className="w-4 h-4" />
            واتساب
          </a>
        </div>

      </main>
      <Footer />
    </>
  )
}
