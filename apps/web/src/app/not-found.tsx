import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "الصفحة غير موجودة — 404" }

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Sumerian-inspired 404 */}
          <div className="relative inline-block mb-6">
            <div className="text-[120px] font-black text-[var(--bg-soft)] select-none leading-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">🏺</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3 text-[var(--text)]">
            هذه الصفحة غير موجودة
          </h1>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            الصفحة اللي تبحث عنها انتقلت أو حذفت أو لم تكن موجودة من الأساس
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              الرئيسية
            </Link>
            <Link href="/products" className="btn-ghost border border-[var(--border)]">
              تصفح المنتجات
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-10 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)] mb-3">روابط مفيدة</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { href: "/account/orders", label: "طلباتي" },
                { href: "/cart",           label: "السلة" },
                { href: "/auth/login",     label: "تسجيل الدخول" },
                { href: "/vendor/register",label: "كن بائعاً" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-full hover:border-primary-400 hover:text-primary-500 transition-colors text-[var(--text-muted)]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
