import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "سياسة الإرجاع والاستبدال" }

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">🔄 سياسة الإرجاع والاستبدال</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">آخر تحديث: يونيو 2026</p>
        <div className="space-y-5">
          {[
            { title: "شروط الإرجاع", items: ["الإرجاع خلال 7 أيام من الاستلام","المنتج بحالته الأصلية وغير مستخدم","الاحتفاظ بالفاتورة والعلبة الأصلية"] },
            { title: "غير قابل للإرجاع", items: ["المنتجات الغذائية والمستهلكة","الإلكترونيات المفتوحة","المنتجات المخصصة (Custom)","العروض والتصفيات"] },
          ].map(({ title, items }) => (
            <div key={title} className="card p-5">
              <h2 className="font-bold mb-3">{title}</h2>
              <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
                {items.map(i => <li key={i} className="flex gap-2"><span>•</span>{i}</li>)}
              </ul>
            </div>
          ))}
          <div className="card p-5">
            <h2 className="font-bold mb-3">كيفية الإرجاع</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">
              تواصل معنا عبر واتساب خلال 7 أيام من الاستلام مع:
            </p>
            <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
              <p>📸 صورة واضحة للمنتج</p>
              <p>🔢 رقم الطلب</p>
              <p>📝 سبب الإرجاع</p>
            </div>
            <a href="https://wa.me/9647808765888" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex mt-4 text-sm">
              تواصل عبر واتساب
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
