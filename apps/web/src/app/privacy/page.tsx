import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "سياسة الخصوصية" }

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">🔒 سياسة الخصوصية</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">آخر تحديث: يونيو 2026</p>
        <div className="space-y-5 text-sm">
          {[
            { title: "البيانات التي نجمعها", content: "نجمع الاسم والبريد الإلكتروني ورقم الهاتف عند التسجيل، وبيانات الطلبات وسجل التصفح لتحسين تجربتك." },
            { title: "كيف نستخدم بياناتك", content: "معالجة الطلبات والمدفوعات، إرسال إشعارات الطلبات، تحسين توصيات الذكاء الاصطناعي، والتواصل معك بشأن خدماتنا." },
            { title: "حماية بياناتك", content: "نستخدم تشفير SSL لجميع الاتصالات. لا نبيع بياناتك لأطراف ثالثة ولا نشاركها إلا لإتمام عمليات التوصيل والدفع." },
            { title: "ملفات تعريف الارتباط", content: "نستخدم Cookies لحفظ تفضيلاتك وبيانات الجلسة. يمكنك تعطيلها من إعدادات المتصفح مع العلم أن بعض الميزات قد لا تعمل." },
            { title: "حقوقك", content: "يمكنك طلب الاطلاع على بياناتك أو تعديلها أو حذفها بالتواصل معنا. يتم تنفيذ طلبات الحذف خلال 30 يوماً." },
          ].map(({ title, content }) => (
            <div key={title} className="card p-5">
              <h2 className="font-bold mb-2">{title}</h2>
              <p className="text-[var(--text-muted)] leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
