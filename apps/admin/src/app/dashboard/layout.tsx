"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAdminAuth } from "@/store/auth"
import { Menu, X } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, isAdmin } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!token || !isAdmin()) router.replace("/login")
  }, [token])

  if (!token) return null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-56 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-30">
          <span className="font-bold text-[var(--text)]">لوحة التحكم</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[var(--bg)] rounded-lg">
            <Menu className="w-5 h-5 text-[var(--text)]" />
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}
