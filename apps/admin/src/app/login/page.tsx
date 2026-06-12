"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/store/auth"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { Shield } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, token, isAdmin } = useAdminAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token && isAdmin()) router.replace("/dashboard")
  }, [token])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await api.post("/api/auth/login", form)
      const { user, token: tk } = res.data.data
      if (user.role !== "ADMIN") {
        toast.error("هذا الحساب ليس لديه صلاحية الأدمن")
        return
      }
      setAuth(user, tk)
      toast.success("أهلاً " + user.name)
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "بيانات غير صحيحة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--sidebar)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <p className="text-white font-bold text-lg">Tello Admin</p>
          <p className="text-slate-400 text-sm mt-1">لوحة التحكم</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">البريد الإلكتروني</label>
            <input
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="admin@fshsmart.com"
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">كلمة المرور</label>
            <input
              type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              className="input"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.password}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          للأدمن فقط — admin.fshsmart.com
        </p>
      </div>
    </main>
  )
}
