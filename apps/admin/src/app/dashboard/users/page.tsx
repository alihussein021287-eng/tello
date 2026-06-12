"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Users, ShieldCheck } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { adminApi } from "@/lib/api"

export default function UsersPage() {
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => adminApi.users.list({ search, limit: 50 }),
  })

  return (
    <>
      <Topbar title="إدارة المستخدمين" />
      <div className="p-6 space-y-4">

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الإيميل..."
              className="input ps-8 h-9 w-64 text-sm"
            />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {data?.total || 0} مستخدم
          </p>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  {["المستخدم", "الإيميل", "الهاتف", "الدور", "تاريخ التسجيل", "الطلبات"].map((h) => (
                    <th key={h} className="text-start px-5 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))}
                {data?.data?.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-500 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{u.email}</td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{u.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={u.role === "ADMIN" ? "badge-red" : u.role === "VENDOR" ? "badge-blue" : "badge-green"}>
                        {u.role === "ADMIN" ? "أدمن" : u.role === "VENDOR" ? "بائع" : "عميل"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString("ar-IQ")}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium">
                      {u._count?.orders || 0} طلب
                    </td>
                  </tr>
                ))}
                {!isLoading && !data?.data?.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[var(--text-muted)] text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      لا يوجد مستخدمون
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
