import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AdminAuthStore {
  user: { id: string; name: string; email: string; role: string } | null
  token: string | null
  setAuth: (user: any, token: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
}

export const useAdminAuth = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token })
        localStorage.setItem("tello_admin_token", token)
      },
      clearAuth: () => {
        set({ user: null, token: null })
        localStorage.removeItem("tello_admin_token")
      },
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    { name: "tello-admin-auth" }
  )
)
