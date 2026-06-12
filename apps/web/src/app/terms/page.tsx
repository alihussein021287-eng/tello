import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "الشروط والأحكام" }

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">📋 الشروط والأحكام</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">آخر تحديث: يناير 2025</p>
        <div className="space-y-5 text-sm">
          {[
            { title: "القبول", content: "باستخدام منصة Tello، فإنك توافق على هذه الشروط. إذا كنت لا توافق، يرجى التوقف عن استخدام المنصة." },
            { title: "أهلية الاستخدام", content: "يجب أن يكون عمرك 18 سنة أو أكثر. تقديم معلومات صحيحة ودقيقة عند التسجيل والتسوق." },
            { title: "المدفوعات والأسعار", content: "جميع الأسعار بالدينار العراقي (د.ع). Tello غير مسؤولة عن أي رسوم بنكية إضافية. الأسعار قابلة للتغيير دون إشعار مسبق." },
            { title: "مسؤولية البائعين", content: "كل بائع مسؤول عن منتجاته وجودتها. Tello تعمل كوسيط وتسعى لضمان تجربة تسوق جيدة لكنها غير مسؤولة عن المنتجات المعيبة." },
            { title: "الملكية الفكرية", content: "جميع محتويات المنصة (شعار، تصاميم، كود) محمية بحقوق الملكية الفكرية لـ Tello." },
            { title: "التعديلات", content: "نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية." },
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
