// ===== USER =====
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: "customer" | "vendor" | "admin"
  createdAt: Date
}

// ===== PRODUCT =====
export interface Product {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: number
  comparePrice?: number
  images: string[]
  stock: number
  categoryId: string
  vendorId: string
  isActive: boolean
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  nameAr: string
  icon: string
  parentId?: string
}

// ===== ORDER =====
export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled"
export type PaymentMethod = "cash" | "card" | "wallet"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  address: Address
  createdAt: Date
}

// ===== ADDRESS =====
export interface Address {
  id: string
  label: string
  city: string
  district: string
  street: string
  building?: string
  notes?: string
  lat?: number
  lng?: number
}

// ===== CART =====
export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
