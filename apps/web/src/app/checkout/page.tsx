"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { MapPin, CreditCard, Banknote, Wallet, CheckCircle, Plus } from "lucide-react"
import { useCartStore, useAuthStore } from "@/store"
import { api } from "@/lib/api"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CouponInput } from "@/components/ui/CouponInput"
import toast from "react-hot-toast"
import { useMutation, useQuery } from "@tanstack/react-query"
import Link from "next/link"

type PayMethod = "CASH" | "ZAINCASH" | "CARD"
type Step = "address" | "payment" | "confirm" | "done"

interface CouponResult {
  couponId:    string
  code:        string
  discount:    number
  finalTotal:  number
  description: string
}

export default function CheckoutPage() {
  const router   = useRouter()
  const tc       = useTranslations("common")
  const { items, total, clearCart } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()
  const [step, setStep]           = useState<Step>("address")
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH")
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [orderId, setOrderId]     = useState<string>("")
  const [coupon, setCoupon]       = useState<CouponResult | null>(null)

  const finalTotal = coupon ? coupon.finalTotal : total()

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn:  () => api.get("/api/users/me").then(r => r.data),
    enabled:  isLoggedIn(),
  })
  const addresses = meData?.data?.addresses || []

  const [newAddress, setNewAddress] = useState({
    label: "البيت", city: "", district: "", street: "", building: "", notes: "",
  })
  const [addingNew, setAddingNew] = useState(false)

  const createOrder = useMutation({
    mutationFn: (data: any) => api.post("/api/orders", data).then(r => r.data),
    onSuccess: async (res) => {
      const order = res.data
      setOrderId(order.id)
      if (payMethod === "ZAINCASH") {
        try {
          const pay = await api.post("/api/payment/zaincash/init", { orderId: order.id })
          window.location.href = pay.data.data.redirectTo
        } catch {
          toast.error("حدث خطأ في بوابة الدفع")
        }
      } else {
        clearCart()
        setStep("done")
      }
    },
    onError: () => toast.error("حدث خطأ في إنشاء الطلب"),
  })

  const saveAddress = useMutation({
    mutationFn: (d: any) => api.post("/api/users/addresses", d).then(r => r.data),
    onSuccess: (res) => {
      setSelectedAddress(res.data.id)
      setAddingNew(false)
      toast.success("تم حفظ العنوان")
    },
  })

  if (!isLoggedIn()) return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold mb-4">سجّل دخولك أولاً</p>
        <Link href="/auth/login" className="btn-primary inline-flex">تسجيل الدخول</Link>
      </main>
      <Footer />
    </>
  )

  if (items.length === 0 && step !== "done") {
    router.replace("/cart")
    return null
  }

  const STEPS = [
    { id: "address", label: "العنوان" },
    { id: "payment", label: "الدفع" },
    { id: "confirm", label: "التأكيد" },
  ]

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => {
              const stepOrder = ["address","payment","confirm"]
              const current   = stepOrder.indexOf(step)
              const isDone    = i < current
              const isActive  = s.id === step
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${isActive ? "text-primary-500" : isDone ? "text-emerald-500" : "text-[var(--text-muted)]"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-primary-500 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-[var(--border)] text-[var(--text-muted)]"}`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${isDone ? "bg-emerald-500" : "bg-[var(--border)]"}`} />}
                </div>
              )
            })}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">

            {step === "address" && (
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  عنوان التوصيل
                </h2>
                {addresses.map((addr: any) => (
                  <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddress === addr.id ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-[var(--border)] hover:border-primary-300"}`}>
                    <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                    <div>
                      <p className="font-semibold text-sm">{addr.label}</p>
                      <p className="text-sm text-[var(--text-muted)]">{addr.city}، {addr.district}، {addr.street}</p>
                      {addr.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{addr.notes}</p>}
                    </div>
                  </label>
                ))}
                {addingNew ? (
                  <div className="border border-[var(--border)] rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-sm">عنوان جديد</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "label",    label: "التسمية",  placeholder: "البيت / العمل" },
                        { key: "city",     label: "المحافظة", placeholder: "بغداد" },
                        { key: "district", label: "الحي",     placeholder: "الكرادة" },
                        { key: "street",   label: "الشارع",   placeholder: "شارع 14 رمضان" },
                        { key: "building", label: "البناية",  placeholder: "بناية 5" },
                        { key: "notes",    label: "ملاحظات",  placeholder: "بجانب..." },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs font-medium block mb-1">{label}</label>
                          <input
                            value={(newAddress as any)[key]}
                            onChange={e => setNewAddress(a => ({...a, [key]: e.target.value}))}
                            placeholder={placeholder}
                            className="input text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddingNew(false)} className="btn-ghost flex-1 border border-[var(--border)] text-sm">إلغاء</button>
                      <button
                        onClick={() => saveAddress.mutate(newAddress)}
                        disabled={!newAddress.city || !newAddress.district || !newAddress.street}
                        className="btn-primary flex-1 text-sm disabled:opacity-50"
                      >
                        حفظ العنوان
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingNew(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--border)] hover:border-primary-400 rounded-xl text-sm text-[var(--text-muted)] hover:text-primary-500 transition-colors">
                    <Plus className="w-4 h-4" />
                    إضافة عنوان جديد
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!selectedAddress && addresses.length > 0) return toast.error("اختر عنواناً")
                    if (!selectedAddress && !addingNew) return toast.error("أضف عنواناً أولاً")
                    setStep("payment")
                  }}
                  className="btn-primary w-full"
                >
                  التالي — طريقة الدفع
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                  طريقة الدفع
                </h2>
                {[
                  { id: "CASH",     icon: <Banknote className="w-5 h-5" />,   label: "كاش عند الاستلام", desc: "ادفع نقداً عند وصول الطلب", available: true },
                  { id: "ZAINCASH", icon: <Wallet className="w-5 h-5" />,     label: "ZainCash",          desc: "دفع إلكتروني عبر ZainCash",  available: true },
                  { id: "CARD",     icon: <CreditCard className="w-5 h-5" />, label: "بطاقة ائتمان",      desc: "Visa / Mastercard",          available: false },
                ].map(({ id, icon, label, desc, available }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${!available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${payMethod === id && available ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-[var(--border)] hover:border-primary-300"}`}>
                    <input type="radio" name="payment" value={id} checked={payMethod === id} onChange={() => available && setPayMethod(id as PayMethod)} disabled={!available} />
                    <div className={`p-2 rounded-lg ${payMethod === id ? "bg-primary-100 dark:bg-primary-900/30 text-primary-500" : "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                    {!available && <span className="text-xs badge bg-[var(--border)] text-[var(--text-muted)]">قريباً</span>}
                  </label>
                ))}
                <div className="flex gap-3">
                  <button onClick={() => setStep("address")} className="btn-ghost flex-1 border border-[var(--border)]">← رجوع</button>
                  <button onClick={() => setStep("confirm")} className="btn-primary flex-1">التالي — تأكيد الطلب</button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg">مراجعة الطلب</h2>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-soft)] flex-shrink-0">
                        {item.product.images?.[0]
                          ? <Image src={item.product.images[0]} alt="" width={48} height={48} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.nameAr}</p>
                        <p className="text-xs text-[var(--text-muted)]">×{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-primary-500">
                        {(item.product.price * item.quantity).toLocaleString()} {tc("iqd")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* كوبون الخصم */}
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-sm font-semibold mb-2">🏷️ كوبون الخصم</p>
                  <CouponInput
                    orderTotal={total()}
                    applied={coupon}
                    onApply={(result) => setCoupon(result)}
                    onRemove={() => setCoupon(null)}
                  />
                </div>

                <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">طريقة الدفع</span>
                    <span className="font-medium">{payMethod === "CASH" ? "كاش عند الاستلام" : "ZainCash"}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>خصم ({coupon.code})</span>
                      <span>- {coupon.discount.toLocaleString()} {tc("iqd")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-[var(--border)]">
                    <span>الإجمالي</span>
                    <span className="text-primary-500">{finalTotal.toLocaleString()} {tc("iqd")}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("payment")} className="btn-ghost flex-1 border border-[var(--border)]">← رجوع</button>
                  <button
                    onClick={() => createOrder.mutate({
                      addressId:     selectedAddress,
                      paymentMethod: payMethod === "ZAINCASH" ? "CARD" : payMethod,
                      couponId:      coupon?.couponId,
                      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    })}
                    disabled={createOrder.isPending}
                    className="btn-primary flex-1 disabled:opacity-60"
                  >
                    {createOrder.isPending ? "جاري الإرسال..." : "تأكيد الطلب ✓"}
                  </button>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="card p-10 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">تم الطلب بنجاح! 🎉</h2>
                <p className="text-[var(--text-muted)] mb-2">رقم طلبك: <span className="font-mono font-bold text-primary-500">#{orderId.slice(-6).toUpperCase()}</span></p>
                <p className="text-sm text-[var(--text-muted)] mb-8">سيصلك تأكيد قريباً وسنبلغك عند الشحن</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/account/orders" className="btn-primary">تتبع طلبي</Link>
                  <Link href="/products" className="btn-ghost border border-[var(--border)]">مواصلة التسوق</Link>
                </div>
              </div>
            )}
          </div>

          {step !== "done" && (
            <div className="card p-5 self-start sticky top-20">
              <h3 className="font-bold mb-4">ملخص الطلب</h3>
              <div className="space-y-2 text-sm mb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-[var(--text-muted)] truncate max-w-[120px]">{item.product.nameAr} ×{item.quantity}</span>
                    <span>{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">المجموع</span>
                  <span>{total().toLocaleString()} {tc("iqd")}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>خصم ({coupon.code})</span>
                    <span>- {coupon.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-[var(--border)]">
                  <span>الإجمالي</span>
                  <span className="text-primary-500">{finalTotal.toLocaleString()} {tc("iqd")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
