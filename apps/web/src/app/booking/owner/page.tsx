"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { Building2, Plus, Store, Calendar, Trash2, Edit, Upload, Sparkles, X } from "lucide-react"

const TYPES = [
  { val: "HOTEL", label: "فندق" }, { val: "CHALET", label: "شاليه" },
  { val: "APARTMENT", label: "شقة" }, { val: "HOUSE", label: "بيت" },
  { val: "FARM", label: "مزرعة" }, { val: "HALL", label: "قاعة أعراس" },
]
const TYPE_AR: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.val, t.label]))
const STATUS_AR: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "بانتظار المراجعة", cls: "bg-yellow-500/15 text-yellow-600" },
  APPROVED: { label: "معتمد",            cls: "bg-green-500/15 text-green-600" },
  REJECTED: { label: "مرفوض",            cls: "bg-red-500/15 text-red-600" },
  INACTIVE: { label: "معطّل",            cls: "bg-gray-500/15 text-gray-500" },
}

const empty = {
  type: "APARTMENT", titleAr: "", title: "", descriptionAr: "", city: "", area: "",
  pricePerNight: "", maxGuests: "2", bedrooms: "1", bathrooms: "1",
  amenities: [] as string[], images: [] as string[],
}

export default function OwnerDashboard() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [amenityInput, setAmenityInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [genImg, setGenImg] = useState(false)
  const [regName, setRegName] = useState("")
  const [regPhone, setRegPhone] = useState("")

  // حالة المالك
  const { data: meData, isLoading: meLoading, error: meError } = useQuery({
    queryKey: ["owner-me"],
    queryFn: () => api.get("/api/property-owner/me").then(r => r.data),
    retry: false,
  })
  const isOwner = !!meData?.data

  // عقاراتي
  const { data: propsData } = useQuery({
    queryKey: ["owner-properties"],
    queryFn: () => api.get("/api/property-owner/properties").then(r => r.data),
    enabled: isOwner,
  })
  const properties = propsData?.data || []

  // تسجيل كمالك
  const registerMut = useMutation({
    mutationFn: () => api.post("/api/property-owner/register", { storeName: regName, phone: regPhone }).then(r => r.data),
    onSuccess: () => { toast.success("تم التسجيل كمالك عقار!"); qc.invalidateQueries({ queryKey: ["owner-me"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || "تعذّر التسجيل"),
  })

  // إضافة عقار
  const addMut = useMutation({
    mutationFn: () => api.post("/api/property-owner/properties", {
      ...form,
      title: form.title || form.titleAr,
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
    }).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إرسال العقار للمراجعة!")
      setShowForm(false); setForm({ ...empty })
      qc.invalidateQueries({ queryKey: ["owner-properties"] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "تعذّر الإضافة"),
  })

  // حذف عقار
  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/property-owner/properties/${id}`).then(r => r.data),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["owner-properties"] }) },
  })

  // رفع صورة
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await api.post("/api/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } })
        const url = res.data?.data?.url
        if (url) setForm(f => ({ ...f, images: [...f.images, url] }))
      }
      toast.success("تم رفع الصورة")
    } catch { toast.error("تعذّر الرفع") } finally { setUploading(false) }
  }

  // توليد صورة بالـ AI
  const handleGenImage = async () => {
    if (!form.titleAr) return toast.error("اكتب عنوان العقار أولاً")
    setGenImg(true)
    try {
      const gen = await api.post("/api/ai/admin/generate-image", {
        name: form.titleAr, category: TYPE_AR[form.type],
        descriptionAr: form.descriptionAr,
      }, { timeout: 120000 })
      const dataUrl = gen.data?.data?.imageUrl
      if (!dataUrl) throw new Error("no image")
      const up = await api.post("/api/upload/base64", { dataUrl }, { timeout: 60000 })
      const url = up.data?.data?.url
      if (url) { setForm(f => ({ ...f, images: [...f.images, url] })); toast.success("تم توليد الصورة 🎨") }
    } catch { toast.error("تعذّر توليد الصورة") } finally { setGenImg(false) }
  }

  const addAmenity = () => {
    if (amenityInput.trim()) { setForm(f => ({ ...f, amenities: [...f.amenities, amenityInput.trim()] })); setAmenityInput("") }
  }

  if (meLoading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">جاري التحميل...</div>

  // شاشة التسجيل (لو مو مالك)
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <Store className="w-14 h-14 mx-auto mb-4 text-primary-500" />
          <h1 className="text-xl font-bold text-[var(--text)] mb-2">سجّل كمالك عقار</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">أضف عقاراتك (فنادق، شاليهات، شقق...) واستقبل الحجوزات</p>
          <div className="space-y-3 text-start">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">اسم المكتب / الجهة</label>
              <input value={regName} onChange={e => setRegName(e.target.value)} className="input" placeholder="مثال: مكتب النور للعقارات" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">رقم الهاتف</label>
              <input value={regPhone} onChange={e => setRegPhone(e.target.value)} className="input" placeholder="07XXXXXXXXX" />
            </div>
          </div>
          <button onClick={() => { if (!regName) return toast.error("اكتب اسم المكتب"); registerMut.mutate() }}
            disabled={registerMut.isPending} className="btn-primary w-full mt-5 py-3 disabled:opacity-50">
            {registerMut.isPending ? "جاري التسجيل..." : "تسجيل"}
          </button>
          <p className="text-xs text-[var(--text-muted)] mt-3">تحتاج تسجيل دخول أولاً؟ <Link href="/auth/login" className="text-primary-500">سجّل دخول</Link></p>
        </div>
      </div>
    )
  }

  // لوحة المالك
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{meData.data.storeName}</h1>
            <p className="text-sm text-[var(--text-muted)]">لوحة إدارة العقارات</p>
          </div>
          <div className="flex gap-2">
            <Link href="/booking/owner/bookings" className="btn-ghost px-4 py-2 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4" /> الحجوزات
            </Link>
            <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> أضف عقار
            </button>
          </div>
        </div>

        {/* قائمة العقارات */}
        {properties.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-4">لا توجد عقارات بعد</p>
            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5">أضف أول عقار</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p: any) => {
              const st = STATUS_AR[p.status] || STATUS_AR.PENDING
              return (
                <div key={p.id} className="card overflow-hidden">
                  <div className="aspect-[4/3] bg-[var(--bg-soft)] relative">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-[var(--text-muted)] opacity-30" /></div>}
                    <span className={`absolute top-2 start-2 text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-[var(--text-muted)]">{TYPE_AR[p.type]}</span>
                    <h3 className="font-bold text-[var(--text)] line-clamp-1">{p.titleAr}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary-500 font-bold text-sm">{p.pricePerNight?.toLocaleString()} د.ع</span>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Calendar className="w-3.5 h-3.5" /> {p._count?.bookings || 0} حجز
                      </div>
                    </div>
                    <button onClick={() => delMut.mutate(p.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 mt-2">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* فورم إضافة عقار */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)]">
              <h2 className="font-bold text-lg">عقار جديد</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">نوع العقار *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
                  {TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">العنوان (عربي) *</label>
                  <input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} className="input" placeholder="شاليه فاخر..." />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">العنوان (إنجليزي)</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Luxury Chalet" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">المدينة *</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" placeholder="بغداد" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">المنطقة</label>
                  <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="input" placeholder="الحبانية" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">الوصف</label>
                <textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} className="input min-h-20" placeholder="وصف العقار..." />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">السعر/ليلة *</label>
                  <input type="number" value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} className="input" placeholder="150000" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">الأشخاص</label>
                  <input type="number" value={form.maxGuests} onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">الغرف</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">الحمامات</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} className="input" />
                </div>
              </div>
              {/* المرافق */}
              <div>
                <label className="text-xs font-medium block mb-1">المرافق</label>
                <div className="flex gap-2">
                  <input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAmenity())} className="input flex-1" placeholder="مسبح، واي فاي..." />
                  <button onClick={addAmenity} className="btn-ghost px-4">إضافة</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.amenities.map((a, i) => (
                    <span key={i} className="text-xs bg-[var(--bg-soft)] px-2 py-1 rounded-lg flex items-center gap-1">
                      {a} <button onClick={() => setForm(f => ({ ...f, amenities: f.amenities.filter((_, j) => j !== i) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              {/* الصور */}
              <div>
                <label className="text-xs font-medium block mb-2">صور العقار</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute -top-1 -end-1 bg-red-500 rounded-full p-0.5">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary-400 text-[var(--text-muted)]">
                    {uploading ? <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-xs">رفع</span></>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                  </label>
                  <button onClick={handleGenImage} disabled={genImg} className="w-20 h-20 border-2 border-dashed border-purple-400/50 rounded-lg flex flex-col items-center justify-center gap-1 text-purple-500 hover:border-purple-400 disabled:opacity-50">
                    {genImg ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-5 h-5" /><span className="text-xs">توليد AI</span></>}
                  </button>
                </div>
              </div>
              <button onClick={() => { if (!form.titleAr || !form.pricePerNight) return toast.error("العنوان والسعر مطلوبان"); addMut.mutate() }}
                disabled={addMut.isPending} className="btn-primary w-full py-3 disabled:opacity-50">
                {addMut.isPending ? "جاري الإضافة..." : "إضافة العقار"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
