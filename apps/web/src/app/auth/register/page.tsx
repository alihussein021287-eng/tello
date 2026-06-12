"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/api"
import { useAuthStore } from "@/store"
import toast from "react-hot-toast"

export default function RegisterPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await auth.register(form)
      setAuth(res.data.user, res.data.token)
      toast.success("تم إنشاء الحساب!")
      router.push("/")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-soft)] p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl">Tello</span>
          </Link>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold mb-5">{t("register_title")}</h1>

          <div className="space-y-4">
            {[
              { key: "name", type: "text", label: t("name"), placeholder: "محمد علي" },
              { key: "email", type: "email", label: t("email"), placeholder: "example@email.com" },
              { key: "phone", type: "tel", label: t("phone"), placeholder: "07808765888" },
              { key: "password", type: "password", label: t("password"), placeholder: "••••••••" },
            ].map(({ key, type, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="input"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email || !form.password}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جاري الإنشاء..." : t("register_btn")}
            </button>
          </div>

          <p className="text-sm text-center text-[var(--text-muted)] mt-4">
            {t("have_account")}{" "}
            <Link href="/auth/login" className="text-primary-500 hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
