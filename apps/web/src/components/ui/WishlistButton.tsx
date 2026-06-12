"use client"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface WishlistButtonProps {
  productId: string
  size?: "sm" | "md"
  className?: string
}

export function WishlistButton({ productId, size = "md", className = "" }: WishlistButtonProps) {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) return
    api.get(`/api/wishlist/check/${productId}`)
      .then(r => setInWishlist(r.data.data.inWishlist))
      .catch(() => {})
  }, [productId, isLoggedIn()])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn()) {
      toast("سجّل دخولك لحفظ المفضلة", { icon: "❤️" })
      router.push("/auth/login")
      return
    }

    setLoading(true)
    try {
      if (inWishlist) {
        await api.delete(`/api/wishlist/${productId}`)
        setInWishlist(false)
        toast("تم الحذف من المفضلة", { icon: "🗑️" })
      } else {
        await api.post(`/api/wishlist/${productId}`)
        setInWishlist(true)
        toast.success("تمت الإضافة للمفضلة ❤️")
      }
    } catch {
      toast.error("حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"
  const btnSize  = size === "sm" ? "w-7 h-7" : "w-9 h-9"

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all active:scale-90 ${
        inWishlist
          ? "bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100"
          : "bg-[var(--bg)]/80 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      } ${className}`}
      aria-label={inWishlist ? "حذف من المفضلة" : "إضافة للمفضلة"}
    >
      <Heart className={`${iconSize} ${inWishlist ? "fill-red-500" : ""} transition-all`} />
    </button>
  )
}
