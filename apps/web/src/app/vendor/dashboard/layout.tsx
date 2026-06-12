"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, ShoppingCart, Settings, Store, BarChart2, Menu, X } from "lucide-react"
import { useAuthStore } from "@/store"

const NAV = [
  { href: "/vendor/dashboard",          icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/vendor/dashboard/products", icon: Package,         label: "منتجاتي" },
  { href: "/vendor/dashboard/orders",   icon: ShoppingCart,    label: "الطلبات" },
  { href: "/vendor/dashboard/reports",  icon: BarChart2,       label: "التقارير" },
  { href: "/vendor/dashboard/settings", icon: Settings,        label: "الإعدادات" },
]

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/auth/login")
  }, [user])

  if (!isLoggedIn()) return null

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-56 bg-[var(--bg)] border-e border-[var(--border)] flex flex-col transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">داشبورد البائع</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.name}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-[var(--bg-soft)] rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-primary-500 text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-[var(--bg-soft)] overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-30">
          <span className="font-bold text-sm text-[var(--text)]">داشبورد البائع</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[var(--bg-soft)] rounded-lg">
            <Menu className="w-5 h-5 text-[var(--text)]" />
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}
