import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("tello_admin_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tello_admin_token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export const adminApi = {
  // Stats (real data)
  stats: () => api.get("/api/admin/stats").then(r => r.data),

  // Products
  properties: {
    list:    (status?: string)      => api.get(`/api/admin/properties${status ? "?status=" + status : ""}`).then(r => r.data),
    approve: (id: string)          => api.patch(`/api/admin/properties/${id}/approve`).then(r => r.data),
    reject:  (id: string, reason?: string) => api.patch(`/api/admin/properties/${id}/reject`, { reason }).then(r => r.data),
  },
  products: {
    list:   (p?: any)              => api.get("/api/admin/products",      { params: p }).then(r => r.data),
    update: (id: string, d: any)   => api.patch(`/api/admin/products/${id}`, d).then(r => r.data),
    delete: (id: string)           => api.delete(`/api/admin/products/${id}`).then(r => r.data),
    approve: (id: string)          => api.patch(`/api/admin/products/${id}/approve`).then(r => r.data),
    reject:  (id: string, reason?: string) => api.patch(`/api/admin/products/${id}/reject`, { reason }).then(r => r.data),
  },

  // Orders
  orders: {
    list:         (p?: any)                        => api.get("/api/admin/orders",            { params: p }).then(r => r.data),
    updateStatus: (id: string, status: string)     => api.patch(`/api/admin/orders/${id}/status`, { status }).then(r => r.data),
  },

  // Users
  users: {
    list:    (p?: any)                          => api.get("/api/admin/users", { params: p }).then(r => r.data),
    get:     (id: string)                       => api.get(`/api/admin/users/${id}`).then(r => r.data),
    setRole: (id: string, role: string)         => api.patch(`/api/admin/users/${id}/role`, { role }).then(r => r.data),
    toggle:  (id: string)                       => api.patch(`/api/admin/users/${id}/toggle`).then(r => r.data),
    update:  (id: string, data: any)            => api.patch(`/api/admin/users/${id}`, data).then(r => r.data),
    setPassword: (id: string, password: string) => api.patch(`/api/admin/users/${id}/password`, { password }).then(r => r.data),
    remove:  (id: string)                       => api.delete(`/api/admin/users/${id}`).then(r => r.data),
  },

  // Vendors
  vendors: {
    applications: (status?: string) => api.get("/api/admin/vendor/applications", { params: { status } }).then(r => r.data),
    action:       (userId: string, action: string) => api.patch(`/api/admin/vendor/applications/${userId}`, { action }).then(r => r.data),
    list:         ()                               => api.get("/api/admin/vendor/vendors").then(r => r.data),
  },

  // Coupons
  coupons: {
    list:   ()               => api.get("/api/coupons").then(r => r.data),
    create: (d: any)         => api.post("/api/coupons", d).then(r => r.data),
    toggle: (id: string, isActive: boolean) => api.patch(`/api/coupons/${id}`, { isActive }).then(r => r.data),
  },

  // AI
  ai: {
    insights:     (period: string) => api.get(`/api/ai/admin/insights/${period}`).then(r => r.data),
    generateDesc: (d: any)         => api.post("/api/ai/admin/generate-description", d).then(r => r.data),
    autoTag:      (d: any)         => api.post("/api/ai/admin/auto-tag", d).then(r => r.data),
    reviewProduct: (d: any)        => api.post("/api/ai/admin/review-product", d).then(r => r.data),
    ask:          (question: string) => api.post("/api/ai/admin/ask", { question }).then(r => r.data),
  },
}
