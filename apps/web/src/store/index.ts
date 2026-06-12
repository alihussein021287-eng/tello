"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

// ── Types (inline) ────────────────────────────────────────
interface User {
  id: string; name: string; email: string
  phone?: string; avatar?: string; role: string
}
interface Product {
  id: string; name: string; nameAr: string
  price: number; comparePrice?: number
  images: string[]; stock: number
  vendorId: string; categoryId: string
  vendor?: any; isActive: boolean
}
interface CartItem {
  productId: string; quantity: number; product: Product
}

// ── AUTH STORE ────────────────────────────────────────────
interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token })
        if (typeof window !== "undefined") {
          localStorage.setItem("tello_token", token)
          // حفظ في cookie للـ middleware
          document.cookie = `tello_token=${token}; path=/; max-age=2592000; SameSite=Lax`
        }
      },
      clearAuth: () => {
        set({ user: null, token: null })
        if (typeof window !== "undefined") {
          localStorage.removeItem("tello_token")
          document.cookie = "tello_token=; path=/; max-age=0"
        }
      },
      isLoggedIn: () => !!get().token,
    }),
    { name: "tello-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)

// ── CART STORE ────────────────────────────────────────────
interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(i => i.productId === product.id)
          if (existing) return { items: state.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i) }
          return { items: [...state.items, { productId: product.id, quantity, product }] }
        })
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.productId !== id) })),
      updateQuantity: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return }
        set(s => ({ items: s.items.map(i => i.productId === id ? { ...i, quantity: qty } : i) }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "tello-cart" }
  )
)
