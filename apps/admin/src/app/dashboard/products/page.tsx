"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, Trash2, Sparkles, Package, ToggleLeft, ToggleRight } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function ProductsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [aiReview, setAiReview] = useState<Record<string, any>>({})
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [aiGenerating, setAiGenerating] = useState(false)

  const [form, setForm] = useState({
    name: "", nameAr: "", description: "", descriptionAr: "",
    price: "", comparePrice: "", stock: "", categoryId: "",
  })

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", search, statusFilter],
    queryFn: () => adminApi.products.list({ search, status: statusFilter, limit: 50 }),
  })
  const approveMut = useMutation({
    mutationFn: (id: string) => adminApi.products.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); toast.success("تمت الموافقة على المنتج ✓") },
  })
  const rejectMut = useMutation({
    mutationFn: (id: string) => adminApi.products.reject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); toast.success("تم رفض المنتج") },
  })
  async function handleAIReview(p: any) {
    setReviewing(p.id)
    try {
      const res = await adminApi.ai.reviewProduct({
        nameAr: p.nameAr, name: p.name, description: p.descriptionAr || p.description,
        price: p.price, comparePrice: p.comparePrice, images: p.images, category: p.category?.nameAr,
      })
      setAiReview(prev => ({ ...prev, [p.id]: res.data }))
    } catch {
      toast.error("تعذّرت المراجعة الذكية")
    } finally {
      setReviewing(null)
    }
  }

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] })
      toast.success("تم حذف المنتج")
    },
  })

  const handleAIDescription = async () => {
    if (!form.name) return toast.error("أدخل اسم المنتج أولاً")
    setAiGenerating(true)
    try {
      const res = await adminApi.ai.generateDesc({
        name: form.name,
        category: form.categoryId,
        price: Number(form.price),
      })
      setForm((f) => ({
        ...f,
        description: res.description?.en || f.description,
        descriptionAr: res.description?.ar || f.descriptionAr,
      }))
      toast.success("تم توليد الوصف بالذكاء الاصطناعي ✨")
    } catch {
      toast.error("حدث خطأ في توليد الوصف")
    } finally {
      setAiGenerating(false)
    }
  }

  const openEdit = (p: any) => {
    setEditProduct(p)
    setForm({
      name: p.name, nameAr: p.nameAr,
      description: p.description, descriptionAr: p.descriptionAr,
      price: String(p.price), comparePrice: String(p.comparePrice || ""),
      stock: String(p.stock), categoryId: p.categoryId,
    })
    setShowModal(true)
  }

  const openNew = () => {
    setEditProduct(null)
    setForm({ name: "", nameAr: "", description: "", descriptionAr: "", price: "", comparePrice: "", stock: "", categoryId: "" })
    setShowModal(true)
  }

  return (
    <>
      <Topbar title="إدارة المنتجات" />
      <div className="p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المنتجات..."
              className="input ps-8 h-9 w-64 text-sm"
            />
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            منتج جديد
          </button>
        </div>

        {/* فلتر الحالة */}
        <div className="flex gap-2 flex-wrap">
          {[["","الكل"],["PENDING","بانتظار المراجعة"],["APPROVED","موافق عليها"],["REJECTED","مرفوضة"]].map(([val,label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter===val ? "bg-primary-500 text-white" : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
              {label}
            </button>
          ))}
        </div>
        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  {["المنتج", "السعر", "المخزون", "الحالة", "القسم", ""].map((h) => (
                    <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[var(--border)] rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))}
                {data?.data?.map((p: any) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[var(--bg)] rounded-lg flex items-center justify-center flex-shrink-0">
                          {p.images?.[0]
                            ? <img src={p.images[0]} className="w-full h-full object-cover rounded-lg" alt="" />
                            : <Package className="w-4 h-4 text-[var(--text-muted)]" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text)]">{p.nameAr}</p>
                          <p className="text-xs text-[var(--text-muted)]">{p.name}</p>
                          {aiReview[p.id] && (
                            <div className={`mt-1 text-xs rounded-lg px-2 py-1 ${aiReview[p.id].recommendation === "approve" ? "bg-green-500/10 text-green-600" : aiReview[p.id].recommendation === "reject" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-600"}`}>
                              <span className="font-semibold">✨ AI: {aiReview[p.id].recommendation === "approve" ? "موافقة" : aiReview[p.id].recommendation === "reject" ? "رفض" : "مراجعة"} ({aiReview[p.id].score}/100)</span>
                              <p className="mt-0.5 opacity-90">{aiReview[p.id].summary}</p>
                              {aiReview[p.id].issues?.length > 0 && (
                                <ul className="mt-0.5 list-disc list-inside opacity-80">
                                  {aiReview[p.id].issues.slice(0,3).map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-primary-500">
                      {p.price?.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">د.ع</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={p.stock < 5 ? "text-red-500 font-semibold" : p.stock < 20 ? "text-yellow-500" : "text-[var(--text)]"}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "PENDING" ? (
                        <span className="badge bg-yellow-500/15 text-yellow-600 text-xs">بانتظار المراجعة</span>
                      ) : p.status === "REJECTED" ? (
                        <span className="badge bg-red-500/15 text-red-500 text-xs">مرفوض</span>
                      ) : (
                        <span className={p.isActive ? "badge-green" : "badge-red"}>{p.isActive ? "نشط" : "مخفي"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{p.category?.nameAr}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {p.status === "PENDING" && (
                          <>
                            <button onClick={() => handleAIReview(p)} disabled={reviewing === p.id} title="مراجعة بالذكاء الاصطناعي" className="px-2 py-1 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
                              {reviewing === p.id ? "..." : "AI ✨"}
                            </button>
                            <button onClick={() => approveMut.mutate(p.id)} title="موافقة" className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600">
                              موافقة
                            </button>
                            <button onClick={() => { if (confirm("رفض المنتج؟")) rejectMut.mutate(p.id) }} title="رفض" className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">
                              رفض
                            </button>
                          </>
                        )}
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-[var(--bg)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-primary-500">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("حذف المنتج؟")) deleteMut.mutate(p.id) }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && !data?.data?.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[var(--text-muted)] text-sm">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      لا توجد منتجات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">{editProduct ? "تعديل المنتج" : "منتج جديد"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">الاسم بالعربي</label>
                  <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="input" placeholder="اسم المنتج" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">الاسم بالإنجليزي</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Product name" />
                </div>
              </div>

              {/* AI Description Button */}
              <button
                onClick={handleAIDescription}
                disabled={aiGenerating || !form.name}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gold-500/40 hover:border-gold-500 text-gold-500 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                {aiGenerating ? "جاري توليد الوصف..." : "توليد الوصف بالذكاء الاصطناعي ✨"}
              </button>

              <div>
                <label className="text-xs font-medium block mb-1">الوصف بالعربي</label>
                <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} className="input min-h-[80px] resize-none" placeholder="وصف المنتج..." />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">الوصف بالإنجليزي</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px] resize-none" placeholder="Product description..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">السعر (د.ع)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">السعر قبل الخصم</label>
                  <input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">المخزون</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" placeholder="0" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 border border-[var(--border)]">إلغاء</button>
                <button className="btn-primary flex-1">
                  {editProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
