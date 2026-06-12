"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, CheckCircle, Clock, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import toast from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"

const STEPS = ["معلومات المتجر", "تفاصيل النشاط", "المراجعة"]

const CATEGORIES = [
  "إلكترونيات", "ملابس وأزياء", "منزل وأثاث", "طعام ومشروبات",
  "صحة وجمال", "رياضة", "كتب وقرطاسية", "سيارات", "أخرى",
]

export default function VendorRegisterPage() {
  const router  = useRouter()
  const { user, isLoggedIn } = useAuthStore()
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    storeName: "", storeNameAr: "", phone: "",
    category: "", description: "",
  })

  // تحقق من حالة الطلب الحالي
  const { data: statusData } = useQuery({
    queryKey: ["vendor-apply-status"],
    queryFn:  () => api.get("/api/vendor/apply/status").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  const appStatus = statusData?.data?.status

  // الحساب غير مسجّل
  if (!isLoggedIn()) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-soft)] p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <Store className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">سجّل دخولك أولاً</h1>
          <p className="text-[var(--text-muted)] mb-6">تحتاج حساب للتقديم كبائع</p>
          <Link href="/auth/login" className="btn-primary inline-flex">تسجيل الدخول</Link>
        </div>
      </main>
    )
  }

  // طلب موجود مسبقاً
  if (appStatus) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-soft)] p-4">
        <div className="card p-8 max-w-md w-full text-center">
          {appStatus === "PENDING" && (
            <>
              <Clock className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">طلبك قيد المراجعة</h1>
              <p className="text-[var(--text-muted)]">سنراجع طلبك خلال 24-48 ساعة وسنبلغك بالنتيجة</p>
            </>
          )}
          {appStatus === "APPROVED" && (
            <>
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">تم قبولك كبائع! 🎉</h1>
              <p className="text-[var(--text-muted)] mb-6">يمكنك الآن إدارة متجرك وإضافة منتجاتك</p>
              <Link href="/vendor/dashboard" className="btn-primary inline-flex">الذهاب للداشبورد</Link>
            </>
          )}
          {appStatus === "REJECTED" && (
            <>
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">تم رفض الطلب</h1>
              <p className="text-[var(--text-muted)]">تواصل مع الدعم لمعرفة السبب</p>
            </>
          )}
        </div>
      </main>
    )
  }

  const handleSubmit = async () => {
    if (!form.storeName || !form.storeNameAr || !form.phone || !form.category || !form.description) {
      return toast.error("أكمل جميع الحقول")
    }
    setLoading(true)
    try {
      await api.post("/api/vendor/apply", form)
      toast.success("تم إرسال طلبك!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-soft)] py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">افتح متجرك على Tello</h1>
          <p className="text-[var(--text-muted)] mt-1">انضم لآلاف البائعين وابدأ البيع اليوم</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= step ? "bg-primary-500 text-white" : "bg-[var(--border)] text-[var(--text-muted)]"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-10 h-0.5 ${i < step ? "bg-primary-500" : "bg-[var(--border)]"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">

          {/* Step 0 — معلومات المتجر */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">معلومات المتجر</h2>
              <div>
                <label className="text-sm font-medium block mb-1.5">اسم المتجر بالعربي</label>
                <input value={form.storeNameAr} onChange={e => setForm({...form, storeNameAr: e.target.value})} className="input" placeholder="متجر النور" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Store Name (English)</label>
                <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="input" placeholder="Al-Noor Store" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">رقم الهاتف (ZainCash/سداد)</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="07808765888" type="tel" />
              </div>
              <button onClick={() => {
                if (!form.storeName || !form.storeNameAr || !form.phone) return toast.error("أكمل الحقول")
                setStep(1)
              }} className="btn-primary w-full">التالي →</button>
            </div>
          )}

          {/* Step 1 — تفاصيل النشاط */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">تفاصيل نشاطك التجاري</h2>
              <div>
                <label className="text-sm font-medium block mb-1.5">قسم المنتجات الرئيسي</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm({...form, category: cat})}
                      className={`p-2 rounded-xl text-xs border transition-all ${
                        form.category === cat
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                          : "border-[var(--border)] hover:border-primary-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">وصف متجرك (20 حرف على الأقل)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="input min-h-[100px] resize-none"
                  placeholder="نبيع أفضل المنتجات بأسعار تنافسية مع توصيل سريع..."
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">{form.description.length}/20 حرف كحد أدنى</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1 border border-[var(--border)]">← رجوع</button>
                <button onClick={() => {
                  if (!form.category || form.description.length < 20) return toast.error("أكمل الحقول")
                  setStep(2)
                }} className="btn-primary flex-1">التالي →</button>
              </div>
            </div>
          )}

          {/* Step 2 — مراجعة وتأكيد */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">مراجعة الطلب</h2>
              <div className="bg-[var(--bg-soft)] rounded-xl p-4 space-y-3 text-sm">
                {[
                  ["اسم المتجر", `${form.storeNameAr} / ${form.storeName}`],
                  ["رقم الهاتف", form.phone],
                  ["القسم", form.category],
                  ["الوصف", form.description],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-[var(--text-muted)]">{label}</span>
                    <span className="font-medium text-end">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold mb-1">شروط البيع على Tello:</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>عمولة 10% على كل عملية بيع</li>
                  <li>الالتزام بجودة المنتجات والتوصيل في الوقت المحدد</li>
                  <li>الامتثال لسياسة الإرجاع والاستبدال</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 border border-[var(--border)]">← رجوع</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? "جاري الإرسال..." : "أوافق وأرسل الطلب ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
