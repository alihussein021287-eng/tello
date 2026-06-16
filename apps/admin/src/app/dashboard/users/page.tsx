"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Eye, Shield, Ban, CheckCircle, Trash2, X, Key, Save } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const ROLE_AR: Record<string, string> = { ADMIN: "أدمن", VENDOR: "بائع", CUSTOMER: "عميل" }

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => adminApi.users.list({ search, limit: 50 }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] })

  const roleMut = useMutation({
    mutationFn: ({ id, role }: any) => adminApi.users.setRole(id, role),
    onSuccess: () => { toast.success("تم تغيير الدور"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "خطأ"),
  })
  const toggleMut = useMutation({
    mutationFn: (id: string) => adminApi.users.toggle(id),
    onSuccess: (r: any) => { toast.success(r?.data?.isActive ? "تم التفعيل" : "تم التعطيل"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "خطأ"),
  })

  return (
    <>
      <Topbar title="إدارة المستخدمين" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الإيميل..." className="input ps-8 h-9 w-64 text-sm" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">{data?.total || 0} مستخدم</p>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  {["المستخدم", "الإيميل", "الدور", "الحالة", "الطلبات", "إجراءات"].map((h) => (
                    <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))}
                {data?.data?.map((u: any) => (
                  <tr key={u.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors ${!u.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-500 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={u.role === "ADMIN" ? "badge-red" : u.role === "VENDOR" ? "badge-blue" : "badge-green"}>{ROLE_AR[u.role]}</span>
                        {u.hasVendor && <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">🏪</span>}
                        {u.hasPropertyOwner && <span className="text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">🏨</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isActive
                        ? <span className="text-xs text-green-500">● نشط</span>
                        : <span className="text-xs text-red-500">● معطّل</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs">{u._count?.orders || 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(u)} title="تفاصيل وتعديل"
                          className="p-1.5 hover:bg-[var(--bg-soft)] rounded-lg text-[var(--text-muted)] hover:text-primary-500"><Eye className="w-4 h-4" /></button>
                        <select value={u.role} onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                          className="text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg px-1.5 py-1 cursor-pointer" title="تغيير الدور">
                          <option value="CUSTOMER">عميل</option>
                          <option value="VENDOR">بائع</option>
                          <option value="ADMIN">أدمن</option>
                        </select>
                        <button onClick={() => toggleMut.mutate(u.id)} title={u.isActive ? "تعطيل" : "تفعيل"}
                          className={`p-1.5 hover:bg-[var(--bg-soft)] rounded-lg ${u.isActive ? "text-red-400" : "text-green-400"}`}>
                          {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && !data?.data?.length && (
                  <tr><td colSpan={6} className="text-center py-10 text-[var(--text-muted)]">لا يوجد مستخدمون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && <UserModal user={selected} onClose={() => setSelected(null)} onSaved={invalidate} />}
    </>
  )
}

function UserModal({ user, onClose, onSaved }: any) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ["admin", "user", user.id],
    queryFn: () => adminApi.users.get(user.id),
  })
  const u = data?.data || user
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [newPass, setNewPass] = useState("")

  const updateMut = useMutation({
    mutationFn: () => adminApi.users.update(user.id, { name, email, phone }),
    onSuccess: () => { toast.success("تم حفظ البيانات"); onSaved(); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "خطأ"),
  })
  const passMut = useMutation({
    mutationFn: () => adminApi.users.setPassword(user.id, newPass),
    onSuccess: () => { toast.success("تم تغيير كلمة السر"); setNewPass("") },
    onError: (e: any) => toast.error(e?.response?.data?.message || "خطأ"),
  })

  const fmt = (d: string) => new Date(d).toLocaleDateString("ar-IQ")

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)]">
          <h2 className="font-bold text-lg">تفاصيل المستخدم</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* تعديل البيانات */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">الاسم</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">الإيميل</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">الهاتف</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
            <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
              className="btn-primary w-full py-2 flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Save className="w-4 h-4" /> حفظ البيانات
            </button>
          </div>

          {/* إعادة تعيين كلمة السر */}
          <div className="pt-3 border-t border-[var(--border)]">
            <label className="text-xs text-[var(--text-muted)] block mb-1">إعادة تعيين كلمة السر</label>
            <div className="flex gap-2">
              <input value={newPass} onChange={(e) => setNewPass(e.target.value)} type="text" placeholder="كلمة سر جديدة (6+ أحرف)" className="input flex-1" />
              <button onClick={() => passMut.mutate()} disabled={passMut.isPending || newPass.length < 6}
                className="btn-ghost px-3 flex items-center gap-1 disabled:opacity-50"><Key className="w-4 h-4" /> تعيين</button>
            </div>
          </div>

          {/* معلومات */}
          <div className="pt-3 border-t border-[var(--border)] text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">الدور</span><span>{ROLE_AR[u.role]}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">تاريخ التسجيل</span><span>{fmt(u.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">الطلبات</span><span>{u._count?.orders || 0}</span></div>
            {u.vendor && <div className="flex justify-between"><span className="text-[var(--text-muted)]">🏪 المتجر</span><span>{u.vendor.storeName}</span></div>}
            {u.propertyOwner && <div className="flex justify-between"><span className="text-[var(--text-muted)]">🏨 العقارات</span><span>{u.propertyOwner.storeName} ({u.propertyOwner._count?.properties || 0})</span></div>}
          </div>

          {/* آخر الطلبات */}
          {u.orders?.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--text-muted)] mb-2">آخر الطلبات</p>
              <div className="space-y-1">
                {u.orders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{fmt(o.createdAt)}</span>
                    <span>{o.total?.toLocaleString()} د.ع — {o.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* آخر الحجوزات */}
          {u.bookings?.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--text-muted)] mb-2">آخر الحجوزات</p>
              <div className="space-y-1">
                {u.bookings.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{fmt(b.checkIn)}</span>
                    <span>{b.totalPrice?.toLocaleString()} د.ع — {b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
