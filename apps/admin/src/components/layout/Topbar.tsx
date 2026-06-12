"use client"
import { Bell, Search, X, ShoppingBag } from "lucide-react"
import { useAdminAuth } from "@/store/auth"
import { useState, useEffect, useRef } from "react"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchNotifications() }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const token = useAdminAuth.getState().token
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const orders = data.data?.recentOrders || []
      const notifs = orders.slice(0, 10).map((o: any) => ({
        id: o.id,
        title: `طلب #${o.id.slice(-6).toUpperCase()}`,
        body: `${o.user?.name || 'عميل'} — ${o.total?.toLocaleString()} د.ع`,
        time: new Date(o.createdAt).toLocaleString('ar-IQ', {timeZone: 'Asia/Baghdad'}),
        status: o.status,
      }))
      setNotifications(notifs)
      setUnread(notifs.length)
    } catch {}
  }

  const statusColor: Record<string, string> = {
    PENDING: 'text-yellow-500',
    PROCESSING: 'text-blue-500',
    SHIPPED: 'text-purple-500',
    DELIVERED: 'text-green-500',
    CANCELLED: 'text-red-500',
  }

  const statusAr: Record<string, string> = {
    PENDING: 'معلق',
    PROCESSING: 'قيد التنفيذ',
    SHIPPED: 'مشحون',
    DELIVERED: 'مسلّم',
    CANCELLED: 'ملغي',
  }

  return (
    <header className="h-14 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-[var(--text)]">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input type="search" placeholder="بحث سريع..." className="input ps-8 h-8 text-xs w-48" />
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(!open); if (!open) { fetchNotifications(); setUnread(0) } }}
            className="relative p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4 text-[var(--text-muted)]" />
            {unread > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute end-0 top-11 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-semibold text-sm text-[var(--text)]">آخر الطلبات</span>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-muted)] text-sm">لا توجد طلبات</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-[var(--bg)] border-b border-[var(--border)] last:border-0 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg)] flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text)]">{n.title}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{n.body}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{n.time}</p>
                      </div>
                      <span className={`text-[10px] font-semibold self-start mt-1 ${statusColor[n.status] || 'text-[var(--text-muted)]'}`}>
                        {statusAr[n.status] || n.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-[var(--border)] text-center">
                <button onClick={fetchNotifications} className="text-xs text-[var(--accent)] hover:underline">
                  تحديث
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
