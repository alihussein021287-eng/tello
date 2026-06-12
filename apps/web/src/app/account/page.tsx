import Link from "next/link"
import { LoyaltyWidget } from "@/components/ui/LoyaltyWidget"
import { redirect } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import {
  ShoppingBag, Heart, MapPin, Settings,
  User, ChevronLeft, Star, Bell,
} from "lucide-react"

const MENU = [
  { href: "/account/orders",    icon: ShoppingBag, label: "طلباتي",          desc: "تتبع وإدارة طلباتك",           badge: null },
  { href: "/account/wishlist",  icon: Heart,       label: "المفضلة",          desc: "المنتجات اللي أعجبتك",         badge: null },
  { href: "/account/settings",  icon: Settings,    label: "إعدادات الحساب",   desc: "الملف الشخصي وكلمة المرور",   badge: null },
  { href: "/vendor/register",   icon: User,        label: "كن بائعاً",         desc: "افتح متجرك على Tello",         badge: "جديد" },
]

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="card p-6 mb-5 bg-gradient-to-br from-primary-500 to-primary-700 border-0 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-bold text-lg">حسابي</p>
              <p className="text-primary-100 text-sm">إدارة حسابك وطلباتك</p>
            </div>
          </div>
        </div>

        {/* Loyalty Widget */}
        <div className="mb-5">
          <LoyaltyWidget />
        </div>

        {/* Menu Grid */}
        <div className="space-y-2">
          {MENU.map(({ href, icon: Icon, label, desc, badge }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center gap-4 hover:border-primary-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-[var(--text)]">{label}</p>
                  {badge && (
                    <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Support */}
        <div className="mt-5 card p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">تحتاج مساعدة؟</p>
            <p className="text-xs text-[var(--text-muted)]">تواصل معنا عبر واتساب</p>
          </div>
          <a
            href="https://wa.me/9647808765888"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            واتساب 💬
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
