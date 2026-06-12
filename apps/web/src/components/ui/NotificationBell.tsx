"use client"
import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, ShoppingCart, Package, Truck, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store"
import { api } from "@/lib/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

const NOTIF_ICONS: Record<string, any> = {
  ORDER_PLACED:    { icon: ShoppingCart, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
  ORDER_CONFIRMED: { icon: CheckCircle,  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ORDER_SHIPPED:   { icon: Truck,        color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
  ORDER_DELIVERED: { icon: CheckCircle,  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ORDER_CANCELLED: { icon: X,            color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20" },
  NEW_VENDOR_ORDER:{ icon: Package,      color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
  LOW_STOCK:       { icon: AlertTriangle,color: "text-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  VENDOR_APPROVED: { icon: CheckCircle,  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
}

export function NotificationBell() {
  const [open, setOpen]       = useState(false)
  const { token, isLoggedIn } = useAuthStore()
  const qc                    = useQueryClient()
  const dropRef               = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn:  () => api.get("/api/notifications").then(r => r.data),
    enabled:  isLoggedIn(),
    refetchInterval: 60_000,
  })

  const notifs = data?.data  || []
  const unread = data?.unread || 0

  // SSE — إشعارات فورية
  useEffect(() => {
    if (!token) return

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stream`,
      { withCredentials: false }
    )

    es.onmessage = (e) => {
      if (e.data === ": ping") return
      try {
        const notif = JSON.parse(e.data)
        if (notif.type === "CONNECTED") return
        qc.invalidateQueries({ queryKey: ["notifications"] })
        // أصوت تنبيه بسيط
        new Audio("/sounds/notif.mp3").play().catch(() => {})
      } catch {}
    }

    return () => es.close()
  }, [token])

  // إغلاق عند الضغط خارج
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = () => {
    api.patch("/api/notifications/read-all")
      .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
  }

  if (!isLoggedIn()) return null

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost p-2 relative"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="font-semibold text-sm">الإشعارات</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
            {notifs.length === 0 && (
              <div className="py-10 text-center text-[var(--text-muted)] text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                لا توجد إشعارات
              </div>
            )}
            {notifs.map((n: any) => {
              const cfg   = NOTIF_ICONS[n.type] || NOTIF_ICONS.ORDER_PLACED
              const Icon  = cfg.icon
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-[var(--bg-soft)] transition-colors cursor-pointer ${!n.read ? "bg-primary-50/50 dark:bg-primary-900/5" : ""}`}
                  onClick={() => {
                    api.patch(`/api/notifications/${n.id}/read`)
                    qc.invalidateQueries({ queryKey: ["notifications"] })
                  }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-medium"} text-[var(--text)]`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
