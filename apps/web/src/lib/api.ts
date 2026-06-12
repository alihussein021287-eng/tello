import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // جرب tello_token أولاً، ثم zustand persist store
    let token = localStorage.getItem("tello_token")
    if (!token) {
      try {
        const store = JSON.parse(localStorage.getItem("tello-auth") || "{}")
        token = store?.state?.token || null
      } catch {}
    }
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tello_token")
      window.location.href = "/auth/login"
    }
    return Promise.reject(err)
  }
)

// Typed helpers
export const products = {
  list: (params?: Record<string, string>) =>
    api.get("/api/products", { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/api/products/${id}`).then((r) => r.data),
}

export const categories = {
  list: () => api.get("/api/categories").then((r) => r.data),
}

export const auth = {
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data).then((r) => r.data),
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post("/api/auth/register", data).then((r) => r.data),
  me: () => api.get("/api/users/me").then((r) => r.data),
}

export const orders = {
  list: () => api.get("/api/orders").then((r) => r.data),
  get: (id: string) => api.get(`/api/orders/${id}`).then((r) => r.data),
  create: (data: any) => api.post("/api/orders", data).then((r) => r.data),
}

// Wishlist
export const wishlist = {
  get:    ()         => api.get("/api/wishlist").then(r => r.data),
  add:    (id: string) => api.post(`/api/wishlist/${id}`).then(r => r.data),
  remove: (id: string) => api.delete(`/api/wishlist/${id}`).then(r => r.data),
  check:  (id: string) => api.get(`/api/wishlist/check/${id}`).then(r => r.data),
}

// Notifications
export const notifications = {
  list:       ()         => api.get("/api/notifications").then(r => r.data),
  markRead:   (id: string) => api.patch(`/api/notifications/${id}/read`).then(r => r.data),
  markAllRead: ()         => api.patch("/api/notifications/read-all").then(r => r.data),
}

// Coupons
export const coupons = {
  apply: (code: string, orderTotal: number) =>
    api.post("/api/coupons/apply", { code, orderTotal }).then(r => r.data),
}

// Reports
export const reports = {
  vendorData: (month: number, year: number) =>
    api.get(`/api/reports/vendor/data?month=${month}&year=${year}`).then(r => r.data),
}
