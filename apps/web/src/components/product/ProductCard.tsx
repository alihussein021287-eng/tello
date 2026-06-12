"use client"
import Link from "next/link"
import { ShoppingCart, Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCartStore } from "@/store"
import toast from "react-hot-toast"

export function ProductCard({ product }: { product: any }) {
  const tc = useTranslations("common")
  const addItem = useCartStore(s => s.addItem)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  return (
    <Link href={`/products/${product.id}`} className="group card hover:shadow-md transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-soft)]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.nameAr || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
        {discount && <span className="badge bg-red-500 text-white absolute top-2 start-2">-{discount}%</span>}
        <button className="absolute top-2 end-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100">
          <Heart className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-[var(--text-muted)] mb-1 truncate">{product.vendor?.storeNameAr || product.vendor?.storeName}</p>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.nameAr || product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-bold text-primary-500">{product.price.toLocaleString()} {tc("iqd")}</span>
            {product.comparePrice && <span className="text-xs text-[var(--text-muted)] line-through ms-1">{product.comparePrice.toLocaleString()}</span>}
          </div>
          <button onClick={e => { e.preventDefault(); addItem(product); toast.success("أضيف للسلة ✓") }} disabled={product.stock === 0} className="w-8 h-8 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  )
}
