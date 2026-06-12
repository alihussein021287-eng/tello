"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { User, Lock, MapPin, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { SingleImageUpload } from "@/components/ui/ImageUpload"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

type Tab = "profile" | "password" | "addresses"

export default function AccountSettingsPage() {
  const { isLoggedIn, user: storeUser, setAuth } = useAuthStore()
  const router = useRouter()
  const qc     = useQueryClient()
  const [tab,  setTab]  = useState<Tab>("profile")

  useEffect(() => { if (!isLoggedIn()) router.replace("/auth/login") }, [])

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn:  () => api.get("/api/users/me").then(r => r.data),
    enabled:  isLoggedIn(),
  })
  const me = data?.data

  // ── Profile ─────────────────────────────────
  const [profile, setProfile] = useState({ name: "", phone: "", avatar: "" })
  useEffect(() => {
    if (me) setProfile({ name: me.name || "", phone: me.phone || "", avatar: me.avatar || "" })
  }, [me])

  const profileMut = useMutation({
    mutationFn: () => api.patch("/api/users/me", profile).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["me"] })
      toast.success("تم تحديث الملف الشخصي")
    },
    onError: () => toast.error("حدث خطأ"),
  })

  // ── Password ─────────────────────────────────
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const pwMut = useMutation({
    mutationFn: () => api.patch("/api/users/me/password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword }).then(r => r.data),
    onSuccess: () => { toast.success("تم تغيير كلمة المرور"); setPw({ currentPassword: "", newPassword: "", confirm: "" }) },
    onError: (err: any) => toast.error(err.response?.data?.message || "حدث خطأ"),
  })

  // ── Addresses ─────────────────────────────────
  const addresses = me?.addresses || []
  const [addingAddr, setAddingAddr] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: "البيت", city: "", district: "", street: "", building: "", notes: "" })

  const addAddrMut = useMutation({
    mutationFn: () => api.post("/api/users/addresses", newAddr).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
      toast.success("تم إضافة العنوان")
      setAddingAddr(false)
      setNewAddr({ label: "البيت", city: "", district: "", street: "", building: "", notes: "" })
    },
  })

  const delAddrMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/addresses/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); toast.success("تم حذف العنوان") },
  })

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "profile",   label: "الملف الشخصي", icon: User },
    { id: "password",  label: "كلمة المرور",  icon: Lock },
    { id: "addresses", label: "عناويني",       icon: MapPin },
  ]

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">إعدادات الحساب</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-soft)] p-1 rounded-xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? "bg-[var(--bg)] shadow text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <div className="card p-6 space-y-5">
            <SingleImageUpload
              value={profile.avatar}
              onChange={url => setProfile(p => ({ ...p, avatar: url }))}
              label="الصورة الشخصية"
              isAvatar
            />
            <div>
              <label className="text-sm font-medium block mb-1.5">الاسم الكامل</label>
              <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">رقم الهاتف</label>
              <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} className="input" type="tel" placeholder="07808765888" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">البريد الإلكتروني</label>
              <input value={me?.email || ""} className="input opacity-60 cursor-not-allowed" disabled />
            </div>
            <button onClick={() => profileMut.mutate()} disabled={profileMut.isPending} className="btn-primary w-full disabled:opacity-60">
              {profileMut.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        )}

        {/* ── Password Tab ── */}
        {tab === "password" && (
          <div className="card p-6 space-y-4">
            {[
              { key: "currentPassword", label: "كلمة المرور الحالية" },
              { key: "newPassword",     label: "كلمة المرور الجديدة" },
              { key: "confirm",         label: "تأكيد كلمة المرور الجديدة" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-sm font-medium block mb-1.5">{label}</label>
                <input
                  type="password"
                  value={(pw as any)[key]}
                  onChange={e => setPw(p => ({...p, [key]: e.target.value}))}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
            ))}
            {pw.newPassword && pw.confirm && pw.newPassword !== pw.confirm && (
              <p className="text-red-500 text-xs">كلمتا المرور غير متطابقتين</p>
            )}
            <button
              onClick={() => pwMut.mutate()}
              disabled={pwMut.isPending || !pw.currentPassword || !pw.newPassword || pw.newPassword !== pw.confirm}
              className="btn-primary w-full disabled:opacity-60"
            >
              {pwMut.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </button>
          </div>
        )}

        {/* ── Addresses Tab ── */}
        {tab === "addresses" && (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="card p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{addr.label}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {addr.city}، {addr.district}، {addr.street}
                    {addr.building && `، ${addr.building}`}
                  </p>
                  {addr.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{addr.notes}</p>}
                </div>
                <button
                  onClick={() => { if(confirm("حذف العنوان؟")) delAddrMut.mutate(addr.id) }}
                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {addingAddr ? (
              <div className="card p-5 space-y-3">
                <p className="font-semibold text-sm">عنوان جديد</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "label",    placeholder: "البيت / العمل" },
                    { key: "city",     placeholder: "بغداد" },
                    { key: "district", placeholder: "الكرادة" },
                    { key: "street",   placeholder: "شارع 14 رمضان" },
                    { key: "building", placeholder: "بناية 5" },
                    { key: "notes",    placeholder: "ملاحظات..." },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      value={(newAddr as any)[key]}
                      onChange={e => setNewAddr(a => ({...a, [key]: e.target.value}))}
                      placeholder={placeholder}
                      className="input text-sm"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddingAddr(false)} className="btn-ghost flex-1 border border-[var(--border)] text-sm">إلغاء</button>
                  <button
                    onClick={() => addAddrMut.mutate()}
                    disabled={!newAddr.city || !newAddr.district || !newAddr.street}
                    className="btn-primary flex-1 text-sm disabled:opacity-60"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingAddr(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--border)] hover:border-primary-400 rounded-xl text-sm text-[var(--text-muted)] hover:text-primary-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                إضافة عنوان جديد
              </button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
