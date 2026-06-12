import axios from "axios"
import * as SecureStore from "expo-secure-store"
import Constants from "expo-constants"

const BASE = Constants.expoConfig?.extra?.apiUrl || "https://api.fshsmart.com"

export const api = axios.create({ baseURL: BASE, timeout: 12000 })

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("vendor_token").catch(() => null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const vendorApi = {
  // Auth
  login: (d: { email: string; password: string }) =>
    api.post("/api/auth/login", d).then(r => r.data),

  // Store
  me:     ()     => api.get("/api/vendor/me").then(r => r.data),
  update: (d: any) => api.patch("/api/vendor/me", d).then(r => r.data),
  stats:  ()     => api.get("/api/vendor/stats").then(r => r.data),

  // Products
  products: {
    list:   (p?: any) => api.get("/api/vendor/products", { params: p }).then(r => r.data),
    create: (d: any)  => api.post("/api/vendor/products", d).then(r => r.data),
    update: (id: string, d: any) => api.patch(`/api/vendor/products/${id}`, d).then(r => r.data),
    delete: (id: string)         => api.delete(`/api/vendor/products/${id}`).then(r => r.data),
  },

  // Orders
  orders: {
    list: (p?: any) => api.get("/api/vendor/orders", { params: p }).then(r => r.data),
  },

  // Chat
  chat: {
    conversations: () => api.get("/api/chat/conversations").then(r => r.data),
    messages: (convId: string) => api.get(`/api/chat/conversations/${convId}/messages`).then(r => r.data),
    send: (convId: string, content: string) =>
      api.post(`/api/chat/conversations/${convId}/messages`, { content }).then(r => r.data),
  },

  // Reports
  reports: (month: number, year: number) =>
    api.get(`/api/reports/vendor/data?month=${month}&year=${year}`).then(r => r.data),

  // Upload
  uploadImage: async (file: any) => {
    const form = new FormData()
    form.append("file", file)
    return api.post("/api/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data)
  },
}
