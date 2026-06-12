"use client"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function CartPage() {
  const t = useTranslations("cart")
  const tc = useTranslations("common")
  const locale = useLocale()
  const { items, removeItem, updateQuantity, total } = useCartStore()

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-xl font-bold mb-2">{t("empty")}</h1>
          <p className="text-[var(--text-muted)] mb-6">{t("empty_desc")}</p>
          <Link href="/products" className="btn-primary inline-flex">
            {t("continue")}
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="card p-4 flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-soft)] flex-shrink-0">
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.nameAr} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary-500 transition-colors">
                      {item.product.nameAr || item.product.name}
                    </h3>
                  </Link>
                  <p className="text-primary-500 font-bold mt-1">
                    {(item.product.price * item.quantity).toLocaleString()} {tc("iqd")}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-[var(--bg-soft)] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-[var(--bg-soft)] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-20">
              <h2 className="font-bold text-lg mb-4">{t("total")}</h2>

              <div className="space-y-2 text-sm mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-[var(--text-muted)]">
                    <span className="truncate max-w-[150px]">{item.product.nameAr} ×{item.quantity}</span>
                    <span>{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-3 mb-5">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("total")}</span>
                  <span className="text-primary-500">{total().toLocaleString()} {tc("iqd")}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                {t("checkout")}
              </Link>

              <Link href="/products" className="btn-ghost w-full flex items-center justify-center mt-2 text-sm">
                {t("continue")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
