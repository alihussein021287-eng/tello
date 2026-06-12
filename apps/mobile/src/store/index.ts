import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import * as SecureStore from "expo-secure-store"
import AsyncStorage from "@react-native-async-storage/async-storage"

// SecureStore adapter for auth token
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

// ===== AUTH =====
interface AuthStore {
  user: any | null
  token: string | null
  setAuth: (user: any, token: string) => void
  clearAuth: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isLoggedIn: () => !!get().token,
    }),
    {
      name: "tello-auth",
      storage: createJSONStorage(() => secureStorage as any),
    }
  )
)

// ===== CART =====
interface CartItem {
  productId: string
  quantity: number
  product: any
}

interface CartStore {
  items: CartItem[]
  addItem: (product: any, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => {
        set((s) => {
          const existing = s.items.find((i) => i.productId === product.id)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...s.items, { productId: product.id, quantity: qty, product }] }
        })
      },
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return }
        set((s) => ({ items: s.items.map((i) => i.productId === id ? { ...i, quantity: qty } : i) }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: "tello-cart",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
