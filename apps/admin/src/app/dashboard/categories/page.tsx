"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

const EMOJI_OPTIONS = ["🏺","📱","👗","🏠","🍎","✨","⚽","📚","🚗","💊","🔧","🎮","💻","📷","🎵","🌿"]

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm] = useState({ name: "", nameAr: "", icon: "🏺", parentId: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin","categories"],
    queryFn:  () => api.get("/api/categories").then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: () => editing
      ? api.patch(`/api/categories/${editing.id}`, form).then(r => r.data)
      : api.post("/api/categories", form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin","categories"] })
      qc.invalidateQueries({ queryKey: ["categories"] })
      toast.success(editing ? "تم تعديل القسم" : "تم إضافة القسم")
      setShowModal(false)
      setEditing(null)
      setForm({ name: "", nameAr: "", icon: "🏺", parentId: "" })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "حدث خطأ"),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin","categories"] })
      toast.success("تم حذف القسم")
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "يوجد منتجات في هذا القسم"),
  })

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, nameAr: cat.nameAr, icon: cat.icon, parentId: cat.parentId || "" })
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", nameAr: "", icon: "🏺", parentId: "" })
    setShowModal(true)
  }

  const cats = data?.data || []

  return (
    <>
      <Topbar title="إدارة الأقسام" />
      <div className="p-6 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">{cats.length} قسم</p>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            قسم جديد
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {isLoading && Array.from({length:10}).map((_,i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="w-10 h-10 bg-[var(--border)] rounded-xl mx-auto mb-2" />
              <div className="h-3 bg-[var(--border)] rounded w-3/4 mx-auto" />
            </div>
          ))}

          {cats.map((cat: any) => (
            <div key={cat.id} className="card p-4 group relative hover:border-primary-300 transition-colors">
              <div className="text-center mb-2">
                <span className="text-3xl">{cat.icon}</span>
              </div>
              <p className="text-sm font-semibold text-center text-[var(--text)]">{cat.nameAr}</p>
              <p className="text-xs text-center text-[var(--text-muted)]">{cat.name}</p>
              {cat._count?.products !== undefined && (
                <p className="text-xs text-center text-[var(--text-muted)] mt-1">{cat._count.products} منتج</p>
              )}
              {cat.children?.length > 0 && (
                <p className="text-xs text-center text-primary-500 mt-1 flex items-center justify-center gap-0.5">
                  <ChevronRight className="w-3 h-3" />{cat.children.length} فرعي
                </p>
              )}

              {/* Actions */}
              <div className="absolute top-2 end-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:border-primary-400 transition-colors">
                  <Edit className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
                <button
                  onClick={() => { if(confirm(`حذف "${cat.nameAr}"؟`)) deleteMut.mutate(cat.id) }}
                  className="p-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:border-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">{editing ? "تعديل القسم" : "قسم جديد"}</h2>
              <button onClick={() => setShowModal(false)} className="text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">الاسم بالعربي</label>
                  <input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} className="input text-sm" placeholder="إلكترونيات" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Name (EN)</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input text-sm" placeholder="Electronics" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-2">الأيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setForm({...form, icon: e})}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === e ? "border-primary-500" : "border-[var(--border)] hover:border-primary-300"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">قسم رئيسي (اختياري)</label>
                <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="input text-sm">
                  <option value="">قسم رئيسي</option>
                  {cats.filter((c: any) => !c.parentId && c.id !== editing?.id).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 border border-[var(--border)] text-sm">إلغاء</button>
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={!form.name || !form.nameAr || saveMut.isPending}
                  className="btn-primary flex-1 text-sm disabled:opacity-60"
                >
                  {saveMut.isPending ? "جاري..." : editing ? "حفظ" : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
