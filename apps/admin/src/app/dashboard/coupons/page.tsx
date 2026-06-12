"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Tag, ToggleLeft, ToggleRight } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

export default function CouponsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE", value: "",
    description: "", minOrderAmount: "",
    maxDiscount: "", usageLimit: "", expiresAt: "",
  })

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn:  () => api.get("/api/coupons").then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/api/coupons", d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] })
      toast.success("تم إنشاء الكوبون")
      setShowModal(false)
    },
    onError: () => toast.error("حدث خطأ"),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: any) => api.patch(`/api/coupons/${id}`, { isActive }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  })

  const handleSave = () => {
    if (!form.code || !form.value) return toast.error("أكمل الحقول المطلوبة")
    createMut.mutate({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      description: form.description || undefined,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount:    form.maxDiscount    ? Number(form.maxDiscount)    : undefined,
      usageLimit:     form.usageLimit     ? Number(form.usageLimit)     : undefined,
      expiresAt:      form.expiresAt      ? new Date(form.expiresAt).toISOString() : undefined,
    })
  }

  return (
    <>
      <Topbar title="الكوبونات والخصومات" />
      <div className="p-6 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">{data?.data?.length || 0} كوبون</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            كوبون جديد
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                {["الكود", "النوع", "القيمة", "الاستخدامات", "الانتهاء", "الحالة", ""].map(h => (
                  <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-primary-500" />
                      <span className="font-mono font-bold">{c.code}</span>
                    </div>
                    {c.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${c.type === "PERCENTAGE" ? "badge-blue" : "badge-green"}`}>
                      {c.type === "PERCENTAGE" ? "نسبة %" : "مبلغ ثابت"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-primary-500">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : `${c.value.toLocaleString()} د.ع`}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">
                    {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}
                  </td>
                  <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ar-IQ") : "بلا انتهاء"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={c.isActive ? "badge-green" : "badge-red"}>
                      {c.isActive ? "فعال" : "موقوف"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleMut.mutate({ id: c.id, isActive: !c.isActive })}
                      className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                      {c.isActive
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.data?.length && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-[var(--text-muted)]">لا توجد كوبونات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">كوبون جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">كود الخصم *</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input font-mono" placeholder="SAVE20" maxLength={20} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">النوع *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                    <option value="PERCENTAGE">نسبة مئوية %</option>
                    <option value="FIXED">مبلغ ثابت (د.ع)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">القيمة *</label>
                  <input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="input" placeholder={form.type === "PERCENTAGE" ? "20" : "5000"} />
                </div>
                {form.type === "PERCENTAGE" && (
                  <div>
                    <label className="text-xs font-medium block mb-1">أقصى خصم (د.ع)</label>
                    <input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} className="input" placeholder="50000" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">وصف الكوبون</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" placeholder="خصم رمضان 20%" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">الحد الأدنى للطلب</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} className="input" placeholder="10000" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">عدد الاستخدامات</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="input" placeholder="100" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">تاريخ الانتهاء</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="input" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 border border-[var(--border)]">إلغاء</button>
                <button onClick={handleSave} disabled={createMut.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {createMut.isPending ? "جاري..." : "إنشاء الكوبون"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
