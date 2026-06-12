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
              <div className="relative group">
                <button className="btn-ghost p-2">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute end-0 top-full mt-1 w-48 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-lg py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                  <Link href="/account"              className="block px-4 py-2.5 text-sm hover:bg-[var(--bg-soft)] transition-colors">{t("account")}</Link>
                  <Link href="/account/orders"       className="block px-4 py-2.5 text-sm hover:bg-[var(--bg-soft)] transition-colors">{t("orders")}</Link>
                  <Link href="/account/wishlist"     className="block px-4 py-2.5 text-sm hover:bg-[var(--bg-soft)] transition-colors">المفضلة</Link>
                  {(user.role === "VENDOR" || user.role === "ADMIN") && (
                    <Link href="/vendor/dashboard"   className="block px-4 py-2.5 text-sm hover:bg-[var(--bg-soft)] transition-colors">🏪 متجري</Link>
                  )}
                  <hr className="my-1 border-[var(--border)]" />
                  <button onClick={clearAuth} className="block w-full text-start px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--bg-soft)] transition-colors">
                    {t("logout")}
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
