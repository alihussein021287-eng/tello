import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "من نحن",
  description: "Tello — منصة التسوق الإلكتروني الأولى في العراق مستوحاة من مدينة Tello السومرية",
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <h1 className="text-3xl font-black mb-3">
            <span className="text-primary-500">Tello</span> — تيلو
          </h1>
          <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-xl mx-auto">
            منصة التسوق الإلكتروني الأولى في العراق — مستوحاة من مدينة <strong>Tello</strong> السومرية العريقة
          </p>
        </div>

        {/* Story */}
        <div className="card p-7 mb-6">
          <h2 className="font-bold text-lg mb-3">🏺 قصتنا</h2>
          <p className="text-[var(--text-muted)] leading-relaxed mb-4">
            Tello مستوحى من مدينة <strong>تيلو (Tello)</strong> الأثرية السومرية في جنوب العراق — واحدة من أقدم مراكز التجارة في تاريخ البشرية. كما كانت تيلو مركزاً للتبادل التجاري قبل آلاف السنين، نسعى اليوم لنكون المنصة التجارية الرائدة في العراق.
          </p>
          <p className="text-[var(--text-muted)] leading-relaxed">
            هدفنا بسيط: ربط البائعين العراقيين بملايين المستهلكين في بيئة آمنة وموثوقة، مع توفير أفضل تجربة تسوق إلكتروني بالعربية.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: "🛍️",  label: "منتجات أصلية ومتنوّعة" },
            { value: "✓",   label: "بائعون موثوقون" },
            { value: "🚀",  label: "توصيل سريع لكل العراق" },
          ].map(({ value, label }) => (
            <div key={label} className="card p-5 text-center">
              <p className="text-2xl font-black text-primary-500">{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="card p-7 mb-6">
          <h2 className="font-bold text-lg mb-4">قيمنا</h2>
          <div className="space-y-3">
            {[
              { icon: "🛡️", title: "الثقة",   desc: "كل بائع موثق ومراجع قبل البدء" },
              { icon: "⚡", title: "السرعة",  desc: "توصيل سريع وخدمة فورية" },
              { icon: "🤝", title: "الشراكة", desc: "نجاحك كبائع هو نجاحنا" },
              { icon: "🇮🇶", title: "العراق",  desc: "صنعنا للعراقيين بأيدٍ عراقية" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-7 text-center bg-gradient-to-br from-primary-500 to-primary-700 border-0">
          <p className="text-white font-bold text-lg mb-2">تريد تنضم لعائلة Tello؟</p>
          <p className="text-primary-100 text-sm mb-5">سجّل كبائع وابدأ ببيع منتجاتك لآلاف العملاء</p>
          <a href="/vendor/register" className="inline-flex bg-white text-primary-600 font-bold px-6 py-2.5 rounded-xl hover:bg-primary-50 transition-colors text-sm">
            ابدأ البيع الآن 🏺
          </a>
        </div>

      </main>
      <Footer />
    </>
  )
}
