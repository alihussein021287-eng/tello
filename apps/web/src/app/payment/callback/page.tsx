"use client"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useCartStore } from "@/store"

type State = "loading" | "success" | "failed"

export default function PaymentCallbackPage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const clearCart = useCartStore(s => s.clearCart)
  const [state,   setState]   = useState<State>("loading")
  const [orderId, setOrderId] = useState("")

  useEffect(() => {
    const oid = params.get("orderId") || params.get("order_id") || ""
    setOrderId(oid)

    if (!oid) { setState("failed"); return }

    // تحقق من حالة الدفع
    api.get(`/api/payment/status/${oid}`)
      .then(res => {
        const { paymentStatus } = res.data.data
        if (paymentStatus === "PAID") {
          clearCart()
          setState("success")
          // انتقل تلقائياً بعد 3 ثوان
          setTimeout(() => router.push(`/account/orders/${oid}`), 3000)
        } else {
          setState("failed")
        }
      })
      .catch(() => setState("failed"))
  }, [])

  return (
    <main className="min-h-screen bg-[var(--bg-soft)] flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center">

        {state === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold mb-2">جاري التحقق من الدفع...</h1>
            <p className="text-[var(--text-muted)] text-sm">لحظة من فضلك</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-emerald-600 dark:text-emerald-400">
              تم الدفع بنجاح! 🎉
            </h1>
            <p className="text-[var(--text-muted)] mb-2">
              رقم طلبك: <span className="font-mono font-bold text-primary-500">#{orderId.slice(-6).toUpperCase()}</span>
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-8">
              سيتم توجيهك لتتبع طلبك تلقائياً...
            </p>
            <Link href={`/account/orders/${orderId}`} className="btn-primary inline-flex">
              تتبع طلبي
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
              فشل الدفع
            </h1>
            <p className="text-[var(--text-muted)] mb-8">
              لم يتم إتمام عملية الدفع. لم يُخصم أي مبلغ من حسابك.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.back()} className="btn-ghost border border-[var(--border)]">
                رجوع
              </button>
              <Link href="/cart" className="btn-primary">
                العودة للسلة
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
