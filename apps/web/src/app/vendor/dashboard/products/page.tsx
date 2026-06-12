"use client"
import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Sparkles, Package, Upload, X, Image as ImageIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

const EMPTY_FORM = {
  name: "", nameAr: "", description: "", descriptionAr: "",
  price: "", comparePrice: "", stock: "", categoryId: "", images: [] as string[],
}

export default function VendorProductsPage() {
  const qc           = useQueryClient()
  const searchParams = useSearchParams()
  const fileRef      = useRef<HTMLInputElement>(null)

  const [showModal, setShowModal]   = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [aiLoading, setAiLoading]   = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockValue, setStockValue]     = useState<string>("")

  async function saveStock(productId: string) {
    const newStock = Number(stockValue)
    if (isNaN(newStock) || newStock < 0) { setEditingStock(null); return }
    try {
      await api.patch(`/api/vendor/products/${productId}`, { stock: newStock })
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      toast.success("✅ تم تحديث المخزون!")
    } catch {
      toast.error("خطأ في التحديث")
    }
    setEditingStock(null)
  }

  // فتح الـ modal تلقائياً لو new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") openNew()
  }, [searchParams])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn:  () => api.get("/api/vendor/products").then(r => r.data),
  })

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn:  () => api.get("/api/categories").then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/api/vendor/products", d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      toast.success("✅ تم إضافة المنتج!")
      closeModal()
    },
    onError: () => toast.error("حدث خطأ"),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/api/vendor/products/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      toast.success("✅ تم تحديث المنتج!")
      closeModal()
    },
    onError: () => toast.error("حدث خطأ في التحديث"),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/vendor/products/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      toast.success("تم حذف المنتج")
    },
  })

  function openNew() {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(p: any) {
    setEditProduct(p)
    setForm({
      name:          p.name || "",
      nameAr:        p.nameAr || "",
      description:   p.description || "",
      descriptionAr: p.descriptionAr || "",
      price:         String(p.price || ""),
      comparePrice:  String(p.comparePrice || ""),
      stock:         String(p.stock || ""),
      categoryId:    p.categoryId || "",
      images:        p.images || [],
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditProduct(null)
    setForm(EMPTY_FORM)
  }

  // رفع صورة
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append("files", f))
      const res = await api.post("/api/upload/images", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const urls = res.data?.data?.urls || []
      setForm(f => ({ ...f, images: [...f.images, ...urls] }))
      toast.success(`تم رفع ${urls.length} صورة ✅`)
    } catch {
      toast.error("فشل رفع الصورة")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  const generateDesc = async () => {
    if (!form.name) return toast.error("أدخل اسم المنتج أولاً")
    setAiLoading(true)
    try {
      const cat = cats?.data?.find((c: any) => c.id === form.categoryId)
      const res = await api.post("/api/ai/admin/generate-description", {
        name: form.name, category: cat?.nameAr || "", price: Number(form.price),
      })
      setForm(f => ({
        ...f,
        description:   res.data.description?.en || f.description,
        descriptionAr: res.data.description?.ar || f.descriptionAr,
      }))
      toast.success("تم توليد الوصف ✨")
    } catch {
      toast.error("حدث خطأ في AI")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = () => {
    if (!form.nameAr || !form.name || !form.price || !form.stock || !form.categoryId) {
      return toast.error("أكمل الحقول المطلوبة")
    }
    const payload = {
      ...form,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock:        Number(form.stock),
    }
    if (editProduct) {
      updateMut.mutate({ id: editProduct.id, data: payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const products = data?.data || []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">منتجاتي</h1>
          <p className="text-sm text-[var(--text-muted)]">{products.length} منتج</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          منتج جديد
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading && Array.from({length: 8}).map((_, i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            <div className="aspect-square bg-[var(--border)]" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-[var(--border)] rounded w-3/4" />
              <div className="h-4 bg-[var(--border)] rounded w-1/2" />
            </div>
          </div>
        ))}
        {products.map((p: any) => (
          <div key={p.id} className="card overflow-hidden group">
            <div className="aspect-square bg-[var(--bg-soft)] flex items-center justify-center relative">
              {p.images?.[0]
                ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                : <Package className="w-8 h-8 text-[var(--text-muted)]" />
              }
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => openEdit(p)} className="p-2 bg-white rounded-lg hover:bg-gray-100">
                  <Edit className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => { if(confirm("حذف المنتج؟")) deleteMut.mutate(p.id) }}
                  className="p-2 bg-red-500 rounded-lg hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* Stock badge */}
              {p.stock < 5 && (
                <span className="absolute top-2 start-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {p.stock === 0 ? "نفذ" : `${p.stock} فقط`}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-medium text-sm truncate">{p.nameAr}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-primary-500 font-bold text-sm">{p.price.toLocaleString()} د.ع</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {p.isActive ? "نشط" : "مخفي"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 border-t border-[var(--border)] pt-2">
                <span className="text-xs text-[var(--text-muted)]">المخزون:</span>
                {editingStock === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={stockValue}
                      onChange={e => setStockValue(e.target.value)}
                      onKeyDown={e => { if(e.key === "Enter") saveStock(p.id); if(e.key === "Escape") setEditingStock(null) }}
                      className="w-16 text-xs border border-[var(--border)] rounded px-1 py-0.5 bg-[var(--bg)] text-[var(--text)]"
                      autoFocus
                    />
                    <button onClick={() => saveStock(p.id)} className="text-xs text-green-500 font-bold">✓</button>
                    <button onClick={() => setEditingStock(null)} className="text-xs text-red-400">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStock(p.id); setStockValue(String(p.stock)) }}
                    className="text-xs font-semibold text-[var(--text)] hover:text-primary-500 transition-colors cursor-pointer"
                    title="اضغط لتعديل المخزون"
                  >
                    {p.stock} قطعة ✏️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isLoading && products.length === 0 && (
          <div className="col-span-4 text-center py-16 text-[var(--text-muted)]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">لا توجد منتجات بعد</p>
            <button onClick={openNew} className="btn-primary mt-4">+ أضف أول منتج</button>
          </div>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)] z-10">
              <h2 className="font-bold text-lg">{editProduct ? "تعديل المنتج" : "منتج جديد"}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-[var(--bg-soft)] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* الأسماء */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">الاسم بالعربي *</label>
                  <input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} className="input" placeholder="اسم المنتج" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Name (English) *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Product name" />
                </div>
              </div>

              {/* القسم */}
              <div>
                <label className="text-xs font-medium block mb-1">القسم *</label>
                <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="input">
                  <option value="">اختر قسم...</option>
                  {cats?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* رفع الصور */}
              <div>
                <label className="text-xs font-medium block mb-2">صور المنتج</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 end-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary-400 transition-colors text-[var(--text-muted)] hover:text-primary-500"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">رفع</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-[var(--text-muted)]">أو أدخل رابط الصورة:</p>
                <input
                  className="input mt-1 text-sm"
                  placeholder="https://..."
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val) {
                        setForm(f => ({ ...f, images: [...f.images, val] }))
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                />
              </div>

              {/* AI Button */}
              <button
                onClick={generateDesc}
                disabled={aiLoading || !form.name}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-yellow-400/50 hover:border-yellow-400 text-yellow-600 dark:text-yellow-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? "جاري التوليد..." : "✨ توليد الوصف بالذكاء الاصطناعي"}
              </button>

              {/* الوصف */}
              <div>
                <label className="text-xs font-medium block mb-1">الوصف بالعربي</label>
                <textarea value={form.descriptionAr} onChange={e => setForm({...form, descriptionAr: e.target.value})} className="input min-h-[80px] resize-none" placeholder="وصف المنتج..." />
              </div>

              {/* السعر */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">السعر (د.ع) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">سعر قبل الخصم</label>
                  <input type="number" value={form.comparePrice} onChange={e => setForm({...form, comparePrice: e.target.value})} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">المخزون *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input" placeholder="0" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={closeModal} className="btn-ghost flex-1 border border-[var(--border)]">إلغاء</button>
                <button
                  onClick={handleSave}
                  disabled={createMut.isPending || updateMut.isPending}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
                  {(createMut.isPending || updateMut.isPending) ? "جاري الحفظ..." : editProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
