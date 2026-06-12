import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[var(--bg-soft)] border-t border-[var(--border)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-lg">Tello</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              منصة التسوق الإلكتروني الأولى في العراق — مستوحاة من مدينة تيلو السومرية 🏺
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">التسوق</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><Link href="/products"             className="hover:text-[var(--text)] transition-colors">جميع المنتجات</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-[var(--text)] transition-colors">وصل حديثاً</Link></li>
              <li><Link href="/products?sort=popular"className="hover:text-[var(--text)] transition-colors">الأكثر مبيعاً</Link></li>
              <li><Link href="/vendor/register"      className="hover:text-[var(--text)] transition-colors">كن بائعاً</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">حسابي</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><Link href="/account"          className="hover:text-[var(--text)] transition-colors">ملفي الشخصي</Link></li>
              <li><Link href="/account/orders"   className="hover:text-[var(--text)] transition-colors">طلباتي</Link></li>
              <li><Link href="/account/wishlist" className="hover:text-[var(--text)] transition-colors">المفضلة</Link></li>
              <li><Link href="/auth/login"       className="hover:text-[var(--text)] transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">المساعدة</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><Link href="/help"     className="hover:text-[var(--text)] transition-colors">الدعم والمساعدة</Link></li>
              <li><Link href="/about"    className="hover:text-[var(--text)] transition-colors">من نحن</Link></li>
              <li><Link href="/shipping" className="hover:text-[var(--text)] transition-colors">سياسة التوصيل</Link></li>
              <li><Link href="/returns"  className="hover:text-[var(--text)] transition-colors">الإرجاع والاستبدال</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} Tello. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">الخصوصية</Link>
            <Link href="/terms"   className="hover:text-[var(--text)] transition-colors">الشروط والأحكام</Link>
          </div>
          <p>مدعوم بـ <span className="text-gold-500 font-medium">fshsmart.com</span></p>
        </div>
      </div>
    </footer>
  )
}
