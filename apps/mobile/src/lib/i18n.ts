import { I18n } from "i18n-js"
import * as Localization from "expo-localization"

const ar = {
  nav: {
    home: "الرئيسية", categories: "الأقسام",
    cart: "السلة", account: "حسابي", search: "ابحث...",
  },
  home: {
    hero: "تسوّق بثقة، استلم بسرعة",
    hero_sub: "آلاف المنتجات من أفضل البائعين",
    featured: "منتجات مميزة",
    categories: "الأقسام",
    new: "وصل حديثاً",
    see_all: "عرض الكل",
  },
  product: {
    add_cart: "أضف للسلة", buy_now: "اشتري الآن",
    out_of_stock: "نفذ المخزون", reviews: "تقييمات",
    qty: "الكمية",
  },
  cart: {
    title: "سلة التسوق", empty: "السلة فارغة",
    total: "الإجمالي", checkout: "إتمام الطلب",
    remove: "حذف", continue: "مواصلة التسوق",
  },
  auth: {
    login: "تسجيل الدخول", register: "إنشاء حساب",
    email: "البريد الإلكتروني", password: "كلمة المرور",
    name: "الاسم الكامل", phone: "رقم الهاتف",
    login_btn: "دخول", register_btn: "إنشاء الحساب",
    logout: "تسجيل الخروج",
    have_account: "عندك حساب؟ ",
    no_account: "ما عندك حساب؟ ",
  },
  common: {
    loading: "جاري التحميل...", error: "حدث خطأ",
    retry: "حاول مجدداً", back: "رجوع",
    iqd: "د.ع", search_placeholder: "ابحث بالعربي أو الإنجليزي...",
  },
  ai: {
    title: "مساعد Tello", subtitle: "اسألني عن أي منتج",
    placeholder: "شنو تريد؟",
    quick1: "أريد موبايل مو غالي",
    quick2: "شو عندكم من العروض؟",
    quick3: "ساعدني ألكي هدية",
  },
}

const en: typeof ar = {
  nav: {
    home: "Home", categories: "Categories",
    cart: "Cart", account: "Account", search: "Search...",
  },
  home: {
    hero: "Shop with confidence, receive fast",
    hero_sub: "Thousands of products from top sellers",
    featured: "Featured Products",
    categories: "Categories",
    new: "New Arrivals",
    see_all: "See All",
  },
  product: {
    add_cart: "Add to Cart", buy_now: "Buy Now",
    out_of_stock: "Out of Stock", reviews: "Reviews",
    qty: "Quantity",
  },
  cart: {
    title: "Shopping Cart", empty: "Cart is empty",
    total: "Total", checkout: "Checkout",
    remove: "Remove", continue: "Continue Shopping",
  },
  auth: {
    login: "Login", register: "Register",
    email: "Email", password: "Password",
    name: "Full Name", phone: "Phone",
    login_btn: "Login", register_btn: "Create Account",
    logout: "Logout",
    have_account: "Have an account? ",
    no_account: "No account? ",
  },
  common: {
    loading: "Loading...", error: "An error occurred",
    retry: "Try again", back: "Back",
    iqd: "IQD", search_placeholder: "Search in Arabic or English...",
  },
  ai: {
    title: "Tello Assistant", subtitle: "Ask me about any product",
    placeholder: "What are you looking for?",
    quick1: "I need an affordable phone",
    quick2: "What deals do you have?",
    quick3: "Help me find a gift",
  },
}

export const i18n = new I18n({ ar, en })
i18n.locale = Localization.getLocales()[0]?.languageCode === "ar" ? "ar" : "en"
i18n.enableFallback = true

export const t = (key: string, opts?: object) => i18n.t(key, opts)
export const isRTL = i18n.locale === "ar"
