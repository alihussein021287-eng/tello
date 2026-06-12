import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { MessageCircle, Phone, Mail, Clock, HelpCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "المساعدة والدعم",
  description: "تواصل مع فريق دعم Tello — نحن هنا لمساعدتك",
}

const FAQS = [
  { q: "كيف أتابع طلبي؟", a: "بعد الطلب ستجد رقم الطلب في صفحة 'طلباتي' مع تفاصيل التتبع الكاملة." },
  { q: "كيف أرجع منتج؟", a: "تواصل معنا خلال 7 أيام من الاستلام عبر واتساب مع صورة المنتج ورقم الطلب." },
  { q: "ما هي طرق الدفع المتاحة؟", a: "نقبل الكاش عند الاستلام وZainCash. قريباً البطاقات البنكية." },
  { q: "كم يستغرق التوصيل؟", a: "داخل بغداد: 1-2 يوم. المحافظات: 2-4 أيام." },
  { q: "كيف أصبح بائعاً على Tello؟", a: "اذهب لصفحة 'كن بائعاً' وأكمل طلب التسجيل. سنراجعه خلال 24-48 ساعة." },
  { q: "هل أستطيع تعديل طلبي؟", a: "يمكن التعديل أو الإلغاء قبل تأكيد الطلب. بعد التأكيد تواصل معنا مباشرة." },
]

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-7 h-7 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">كيف نقدر نساعدك؟</h1>
          <p className="text-[var(--text-muted)]">فريق دعم Tello متاح 7 أيام في الأسبوع</p>
        </div>

        {/* Contact Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon:  <MessageCircle className="w-6 h-6" />,
              label: "واتساب",
              desc:  "أسرع طريقة للتواصل",
              href:  "https://wa.me/9647808765888",
              color: "text-emerald-500",
              bg:    "bg-emerald-50 dark:bg-emerald-900/20",
              cta:   "تواصل الآن",
            },
            {
              icon:  <Phone className="w-6 h-6" />,
              label: "الهاتف",
              desc:  "9 ص — 9 م",
              href:  "tel:+9647808765888",
              color: "text-blue-500",
              bg:    "bg-blue-50 dark:bg-blue-900/20",
              cta:   "اتصل بنا",
            },
            {
              icon:  <Mail className="w-6 h-6" />,
              label: "البريد الإلكتروني",
              desc:  "رد خلال 24 ساعة",
              href:  "mailto:support@fshsmart.com",
              color: "text-purple-500",
              bg:    "bg-purple-50 dark:bg-purple-900/20",
              cta:   "أرسل رسالة",
            },
          ].map(({ icon, label, desc, href, color, bg, cta }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 flex flex-col items-center text-center hover:shadow-md hover:border-primary-300 transition-all gap-3"
            >
              <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center`}>
                {icon}
              </div>
              <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
              <span className={`text-xs font-semibold ${color}`}>{cta} ←</span>
            </a>
          ))}
        </div>

        {/* Working Hours */}
        <div className="card p-5 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-semibold text-sm">ساعات العمل</p>
            <p className="text-xs text-[var(--text-muted)]">السبت — الخميس: 9 صباحاً — 9 مساءً | الجمعة: 2 ظهراً — 9 مساءً</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="font-bold text-lg mb-4">الأسئلة الشائعة</h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="card overflow-hidden group">
              <summary className="p-4 cursor-pointer font-semibold text-sm flex items-center justify-between select-none hover:bg-[var(--bg-soft)] transition-colors list-none">
                {q}
                <span className="text-[var(--text-muted)] text-lg group-open:rotate-45 transition-transform inline-block leading-none">+</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-3">
                {a}
              </div>
            </details>
          ))}
        </div>

      </main>
      <Footer />
    </>
  )
}
