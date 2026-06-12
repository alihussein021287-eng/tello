import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "سياسة التوصيل" }

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">🚚 سياسة التوصيل</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">آخر تحديث: يناير 2025</p>

        <div className="space-y-6 text-[var(--text)]">
          <section className="card p-5">
            <h2 className="font-bold mb-3">مناطق التوصيل والمدة</h2>
            <div className="space-y-2 text-sm">
              {[["بغداد","1-2 يوم عمل"],["المحافظات الرئيسية","2-4 أيام عمل"],["المناطق النائية","4-7 أيام عمل"]].map(([area, time]) => (
                <div key={area} className="flex justify-between p-3 bg-[var(--bg-soft)] rounded-xl">
                  <span className="font-medium">{area}</span>
                  <span className="text-[var(--text-muted)]">{time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-bold mb-3">تكلفة التوصيل</h2>
            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              <p>✅ مجاني للطلبات فوق <strong className="text-[var(--text)]">50,000 د.ع</strong></p>
              <p>📍 بغداد: <strong className="text-[var(--text)]">5,000 د.ع</strong></p>
              <p>📍 المحافظات: <strong className="text-[var(--text)]">8,000 د.ع</strong></p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-bold mb-3">تتبع الطلب</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              ستصلك رسالة عند شحن طلبك. يمكنك متابعة حالة طلبك من صفحة "طلباتي" في أي وقت.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
