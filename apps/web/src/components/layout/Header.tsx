"use client"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { useTheme } from "next-themes"
import { ShoppingCart, Sun, Moon, User, Menu, X } from "lucide-react"
import { useCartStore, useAuthStore } from "@/store"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setCookie } from "@/lib/cookies"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { AISearchBar } from "@/components/ai/AISearchBar"

export function Header() {
  const t  = useTranslations("nav")
  const locale = useLocale()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount  = useCartStore(s => s.count())
  const user       = useAuthStore(s => s.user)
  const clearAuth  = useAuthStore(s => s.clearAuth)
  const router     = useRouter()
  useEffect(() => setMounted(true), [])

  const toggleLocale = async () => {
    const next = locale === "ar" ? "en" : "ar"
    await setCookie("locale", next)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-[var(--text)] hidden sm:block">Tello</span>
          </Link>

          {/* AI Search */}
          <div className="flex-1 max-w-xl mx-auto hidden md:flex">
            <AISearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ms-auto">
            <Link href="/booking" className="btn-ghost px-3 py-2 text-sm font-medium hidden sm:flex items-center gap-1.5 hover:text-primary-500">
              🏨 الحجوزات
            </Link>
            <button onClick={toggleLocale} className="btn-ghost p-2 text-sm font-semibold">
              {locale === "ar" ? "EN" : "ع"}
            </button>

            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="btn-ghost p-2">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* Cart */}
            <Link href="/cart" className="btn-ghost p-2 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(o => !o)} className="btn-ghost px-2 py-1.5 flex items-center gap-1.5">
                  <User className="w-5 h-5" />
                  <span className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold">{user.name || user.email}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{user.role === "ADMIN" ? "أدمن" : user.role === "VENDOR" ? "بائع" : "زبون"}</span>
                  </span>
                </button>
                {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
                <div className={`absolute end-0 top-full mt-1 w-56 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-lg py-2 transition-all z-50 max-h-[80vh] overflow-y-auto ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setMenuOpen(false)}>
                  {/* رأس: الاسم والدور */}
                  <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-sm font-semibold truncate">{user.name || user.email}</p>
                    <p className="text-xs text-[var(--text-muted)]">{user.role === "ADMIN" ? "أدمن" : user.role === "VENDOR" ? "بائع" : "زبون"}</p>
                  </div>

                  {/* قسم التسوّق */}
                  <p className="px-4 pt-1 pb-0.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">🛒 التسوّق</p>
                  <Link href="/account"              className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">حسابي</Link>
                  <Link href="/account/orders"       className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">طلباتي</Link>
                  <Link href="/account/wishlist"     className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">المفضلة</Link>

                  {/* قسم المتجر (للبائع) */}
                  {(user.role === "VENDOR" || user.role === "ADMIN") && (
                    <>
                      <hr className="my-1 border-[var(--border)]" />
                      <p className="px-4 pt-1 pb-0.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">🏪 متجري</p>
                      <Link href="/vendor/dashboard" className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">لوحة البائع</Link>
                    </>
                  )}

                  {/* قسم الحجوزات */}
                  <hr className="my-1 border-[var(--border)]" />
                  <p className="px-4 pt-1 pb-0.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">🏨 الحجوزات</p>
                  <Link href="/booking"              className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">تصفّح العقارات</Link>
                  <Link href="/booking/my-bookings"  className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">حجوزاتي</Link>
                  <Link href="/booking/owner"        className="block px-4 py-2 text-sm hover:bg-[var(--bg-soft)] transition-colors">عقاراتي للإيجار</Link>

                  {/* خروج */}
                  <hr className="my-1 border-[var(--border)]" />
                  <button onClick={clearAuth} className="block w-full text-start px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-soft)] transition-colors">
                    🚪 {t("logout")}
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary text-sm hidden sm:flex">{t("login")}</Link>
            )}

            <button className="btn-ghost p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <AISearchBar />
        </div>
      </div>
    </header>
  )
}
