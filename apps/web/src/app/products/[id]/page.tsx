"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ShoppingCart, Heart, Star, Minus, Plus, Store,
  Share2, MessageCircle, ChevronLeft, Copy, Check
} from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { api, products as productsApi } from "@/lib/api"
import { useCartStore } from "@/store"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { WishlistButton } from "@/components/ui/WishlistButton"
import { ReviewsSection } from "@/components/product/ReviewsSection"
import toast from "react-hot-toast"

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id }    = params
  const t         = useTranslations("product")
  const tc        = useTranslations("common")
  const router    = useRouter()
  const addItem   = useCartStore(s => s.addItem)
  const [qty, setQty]           = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [copied, setCopied]     = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id),
  })

  if (isLoading) return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-[var(--border)] rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-[var(--border)] rounded animate-pulse" />)}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  const product = data?.data
  if (!product) return null

  const avg = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : null

  const handleAddToCart = () => {
    addItem(product, qty)
    toast.success("أضيف للسلة ✓")
  }

  // مشاركة المنتج
  const handleShare = async () => {
    const url = window.location.href
    const text = `${product.nameAr || product.name} - ${product.price.toLocaleString()} د.ع\n${url}`
    if (navigator.share) {
      await navigator.share({ title: product.nameAr, text, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("تم نسخ الرابط!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // واتساب مباشر
  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`أريد الاستفسار عن: ${product.nameAr || product.name}\nالسعر: ${product.price.toLocaleString()} د.ع\n${window.location.href}`)
    window.open(`https://wa.me/9647808765888?text=${msg}`, "_blank")
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          رجوع
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--bg-soft)] mb-3 relative">
              {product.images?.[activeImg] ? (
                <img
                  src={product.images[activeImg]}
                  alt={product.nameAr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute top-3 end-3 p-2 bg-white/80 backdrop-blur rounded-xl shadow hover:bg-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? "border-primary-500" : "border-[var(--border)]"}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">{product.vendor?.storeNameAr || product.vendor?.storeName}</p>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{product.nameAr || product.name}</h1>

            {/* Rating */}
            {avg && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)]"}`} />
                  ))}
                </div>
                <span className="text-sm text-[var(--text-muted)]">({product.reviews.length} {t("reviews")})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary-500">{product.price.toLocaleString()}</span>
              <span className="text-[var(--text-muted)]">{tc("iqd")}</span>
              {product.comparePrice && (
                <span className="text-[var(--text-muted)] line-through text-lg">{product.comparePrice.toLocaleString()}</span>
              )}
              {product.comparePrice && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[var(--text-muted)] leading-relaxed mb-6">{product.descriptionAr || product.description}</p>

            {/* Stock indicator */}
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-sm text-orange-500 mb-4">⚠️ باقي {product.stock} قطعة فقط!</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-medium">{t("qty")}</span>
              <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 hover:bg-[var(--bg-soft)] transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2.5 hover:bg-[var(--bg-soft)] transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-[var(--text-muted)]">{product.stock} متوفر</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? t("out_of_stock") : t("add_cart")}
              </button>
              <WishlistButton productId={product.id} size="md" className="border border-[var(--border)]" />
            </div>

            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors mb-4"
            >
              <MessageCircle className="w-5 h-5" />
              اسأل عن المنتج على واتساب
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 border border-[var(--border)] rounded-xl py-2.5 text-sm text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              مشاركة المنتج
            </button>

            {/* Vendor link */}
            {product.vendor && (
              <Link href={`/store/${product.vendorId}`} className="flex items-center gap-2 mt-4 text-sm text-[var(--text-muted)] hover:text-primary-500 transition-colors">
                <Store className="w-4 h-4" />
                {product.vendor.storeNameAr || product.vendor.storeName}
              </Link>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={id} />

      </main>
      <Footer />
    </>
  )
}
