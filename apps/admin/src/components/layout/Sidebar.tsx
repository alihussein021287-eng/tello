"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, ShoppingCart, Users, Bot,
  LogOut, ChevronLeft, Store, Tag, Sun, Moon,
  TrendingUp, Grid, DollarSign, Star, Settings,
} from "lucide-react"
import { useAdminAuth } from "@/store/auth"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

const NAV = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/dashboard/analytics",    icon: TrendingUp,      label: "التحليلات" },
  { href: "/dashboard/products",     icon: Package,         label: "المنتجات" },
  { href: "/dashboard/categories",   icon: Grid,            label: "الأقسام" },
  { href: "/dashboard/orders",       icon: ShoppingCart,    label: "الطلبات" },
  { href: "/dashboard/users",        icon: Users,           label: "المستخدمين" },
  { href: "/dashboard/vendors",      icon: Store,           label: "البائعين" },
  { href: "/dashboard/commissions",  icon: DollarSign,      label: "العمولات" },
  { href: "/dashboard/coupons",      icon: Tag,             label: "الكوبونات" },
  { href: "/dashboard/reviews",      icon: Star,            label: "التقييمات" },
  { href: "/dashboard/ai",           icon: Bot,             label: "مركز الذكاء" },
  { href: "/dashboard/loyalty",      icon: Star,            label: "نقاط الولاء" },
  { href: "/dashboard/settings",     icon: Settings,        label: "الإعدادات" },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname  = usePathname()
  const clearAuth = useAdminAuth(s => s.clearAuth)
  const user      = useAdminAuth(s => s.user)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <aside className="w-56 flex-shrink-0 bg-[var(--sidebar)] h-screen flex flex-col">
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Tello Admin</p>
            <p className="text-[var(--sidebar-text)] text-xs">لوحة التحكم</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link key={href} href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${active ? "bg-primary-500 text-white" : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"}`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
              {active && <ChevronLeft className="w-3 h-3 ms-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/5 space-y-0.5">
        {mounted && (
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white transition-all w-full">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          </button>
        )}
        <button onClick={clearAuth} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut className="w-3.5 h-3.5" />
          تسجيل الخروج
        </button>
        {user && (
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-400 text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-[var(--sidebar-text)] text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
