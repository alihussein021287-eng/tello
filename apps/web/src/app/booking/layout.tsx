"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, Store, ClipboardList, LogOut, LogIn, User } from "lucide-react"
import { useAuthStore } from "@/store"
import { useRouter } from "next/navigation"

const NAV = [
  { href: "/booking",                icon: Home,          label: "تصفّح العقارات", exact: true },
  { href: "/booking/my-bookings",    icon: CalendarCheck, label: "حجوزاتي" },
  { href: "/booking/owner",          icon: Store,         label: "لوحة المالك", exact: true },
  { href: "/booking/owner/bookings", icon: ClipboardList, label: "حجوزات عقاراتي" },
]

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const handleLogout = () => { clearAuth(); router.push("/booking") }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* شريط تنقّل الحجوزات */}
      <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-primary-500 whitespace-nowrap">
              🏨 الحجوزات
            </Link>
            <div className="w-px h-6 bg-[var(--border)] mx-1" />
            {NAV.map(({ href, icon: Icon, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active ? "bg-primary-500 text-white" : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)]"}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            <div className="ms-auto flex items-center gap-2 ps-2 flex-shrink-0">
              {user ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] whitespace-nowrap">
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                    {user.role && <span className="text-[10px] bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">{user.role === "ADMIN" ? "أدمن" : user.role === "VENDOR" ? "بائع" : "زبون"}</span>}
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 whitespace-nowrap">
                    <LogOut className="w-3.5 h-3.5" /> خروج
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="flex items-center gap-1 text-xs btn-primary px-3 py-1.5 whitespace-nowrap">
                  <LogIn className="w-3.5 h-3.5" /> تسجيل دخول
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
