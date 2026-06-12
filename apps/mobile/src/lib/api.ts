import axios from "axios"
import * as SecureStore from "expo-secure-store"
import Constants from "expo-constants"

const BASE = Constants.expoConfig?.extra?.apiUrl || "https://api.fshsmart.com"

export const api = axios.create({
  baseURL: BASE,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("tello_token").catch(() => null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync("tello_token").catch(() => {})
    }
    return Promise.reject(err)
  }
)

export const productsApi = {
  list: (params?: Record<string, string>) =>
    api.get("/api/products", { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/api/products/${id}`).then((r) => r.data),
}

export const categoriesApi = {
  list: () => api.get("/api/categories").then((r) => r.data),
}

export const authApi = {
  login: (d: { email: string; password: string }) =>
    api.post("/api/auth/login", d).then((r) => r.data),
  register: (d: { name: string; email: string; password: string; phone?: string }) =>
    api.post("/api/auth/register", d).then((r) => r.data),
  me: () => api.get("/api/users/me").then((r) => r.data),
}

export const ordersApi = {
  list: () => api.get("/api/orders").then((r) => r.data),
  get: (id: string) => api.get(`/api/orders/${id}`).then((r) => r.data),
  create: (d: any) => api.post("/api/orders", d).then((r) => r.data),
}

export const aiApi = {
  chat: async (messages: Array<{role: string; content: string}>, userId?: string) => {
    const res = await fetch(`${BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userId }),
    })
    return res
  },
  smartSearch: (q: string) =>
    api.get("/ai/search", { params: { q } }).then((r) => r.data),
}

// Wishlist
export const wishlistApi = {
  get:    ()         => api.get("/api/wishlist").then(r => r.data),
  add:    (id: string) => api.post(`/api/wishlist/${id}`).then(r => r.data),
  remove: (id: string) => api.delete(`/api/wishlist/${id}`).then(r => r.data),
  check:  (id: string) => api.get(`/api/wishlist/check/${id}`).then(r => r.data),
}

// Notifications
export const notificationsApi = {
  list:        ()         => api.get("/api/notifications").then(r => r.data),
  markRead:    (id: string) => api.patch(`/api/notifications/${id}/read`).then(r => r.data),
  markAllRead: ()         => api.patch("/api/notifications/read-all").then(r => r.data),
}

// Reviews
export const reviewsApi = {
  forProduct: (productId: string) =>
    api.get(`/api/reviews/product/${productId}`).then(r => r.data),
  submit: (data: { productId: string; orderId: string; rating: number; comment?: string }) =>
    api.post("/api/reviews", data).then(r => r.data),
}
