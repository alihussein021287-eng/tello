"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useCartStore, useAuthStore } from "@/store"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function WishlistPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const qc = useQueryClient()

  useEffect(() => { if (!isLoggedIn()) router.replace("/auth/login") }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn:  () => api.get("/api/wishlist").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  const removeMut = useMutation({
    mutationFn: (productId: string) => api.delete(`/api/wishlist/${productId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] })
      toast.success("تم الحذف من المفضلة")
    },
  })

  const products = data?.data || []

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <h1 className="text-xl font-bold">المفضلة</h1>
          {products.length > 0 && (
            <span className="text-sm text-[var(--text-muted)]">({products.length} منتج)</span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-[var(--border)]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[var(--border)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--border)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-14 h-14 mx-auto mb-3 text-[var(--border)]" />
            <p className="font-semibold text-lg mb-1">المفضلة فارغة</p>
            <p className="text-[var(--text-muted)] text-sm mb-6">أضف منتجات تعجبك للمفضلة</p>
            <Link href="/products" className="btn-primary inline-flex">تصفح المنتجات</Link>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="card group overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-square overflow-hidden bg-[var(--bg-soft)]">
                <Link href={`/products/${p.id}`}>
                  {p.images?.[0]
                    ? <Image src={p.images[0]} alt={p.nameAr} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  }
                </Link>
                <button
                  onClick={() => removeMut.mutate(p.id)}
                  className="absolute top-2 end-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              <div className="p-3">
                <Link href={`/products/${p.id}`}>
                  <p className="text-sm font-medium line-clamp-2 hover:text-primary-500 transition-colors mb-2">
                    {p.nameAr || p.name}
                  </p>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary-500 text-sm">
                    {p.price.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">د.ع</span>
                  </span>
                  <button
                    onClick={() => { addItem(p); toast.success("أضيف للسلة") }}
                    className="w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
