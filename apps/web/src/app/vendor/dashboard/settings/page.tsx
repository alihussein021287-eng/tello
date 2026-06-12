"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Store, Save } from "lucide-react"
import { api } from "@/lib/api"
import { SingleImageUpload } from "@/components/ui/ImageUpload"
import toast from "react-hot-toast"

export default function VendorSettingsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    storeName: "", storeNameAr: "", logo: "", description: "",
  })

  const { data } = useQuery({
    queryKey: ["vendor-me"],
    queryFn:  () => api.get("/api/vendor/me").then(r => r.data),
  })

  useEffect(() => {
    if (data?.data) {
      const v = data.data
      setForm({
        storeName:   v.storeName   || "",
        storeNameAr: v.storeNameAr || "",
        logo:        v.logo        || "",
        description: v.description || "",
      })
    }
  }, [data])

  const updateMut = useMutation({
    mutationFn: () => api.patch("/api/vendor/me", form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-me"] })
      toast.success("تم حفظ إعدادات المتجر")
    },
    onError: () => toast.error("حدث خطأ"),
  })

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-primary-500" />
        <h1 className="text-xl font-bold">إعدادات المتجر</h1>
      </div>

      <div className="card p-6 space-y-5">
        <SingleImageUpload
          value={form.logo}
          onChange={url => setForm(f => ({ ...f, logo: url }))}
          label="شعار المتجر"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">اسم المتجر بالعربي</label>
            <input
              value={form.storeNameAr}
              onChange={e => setForm(f => ({...f, storeNameAr: e.target.value}))}
              className="input"
              placeholder="متجر النور"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Store Name (English)</label>
            <input
              value={form.storeName}
              onChange={e => setForm(f => ({...f, storeName: e.target.value}))}
              className="input"
              placeholder="Al-Noor Store"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">وصف المتجر</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({...f, description: e.target.value}))}
            className="input min-h-[100px] resize-none"
            placeholder="أخبر العملاء عن متجرك..."
          />
        </div>

        <div className="bg-[var(--bg-soft)] rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-[var(--text-muted)]">معلومات العمولة</p>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">نسبة العمولة</span>
            <span className="font-bold text-primary-500">10%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">حالة المتجر</span>
            <span className="badge-green">مفعّل ✓</span>
          </div>
        </div>

        <button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {updateMut.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  )
}
