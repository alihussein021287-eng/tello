"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/api"
import { useAuthStore } from "@/store"
import toast from "react-hot-toast"

export default function LoginPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await auth.login(form)
      setAuth(res.data.user, res.data.token)
      toast.success("أهلاً بك!")
      router.push("/")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "بيانات غير صحيحة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-soft)] p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl">Tello</span>
          </Link>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold mb-5">{t("login_title")}</h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t("email")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                className="input"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">{t("password")}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !form.email || !form.password}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جاري الدخول..." : t("login_btn")}
            </button>
          </div>

          <p className="text-sm text-center text-[var(--text-muted)] mt-4">
            {t("no_account")}{" "}
            <Link href="/auth/register" className="text-primary-500 hover:underline font-medium">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
