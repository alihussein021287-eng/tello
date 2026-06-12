"use client"
import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2, Package } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"

interface LiveChatProps {
  vendorId:      string
  vendorName:    string
  vendorLogo?:   string
  productId?:    string
  productName?:  string
}

interface Message {
  id:          string
  senderId:    string
  content:     string
  messageType: string
  createdAt:   string
  metadata?:   string
}

export function LiveChat({ vendorId, vendorName, vendorLogo, productId, productName }: LiveChatProps) {
  const { user, isLoggedIn } = useAuthStore()
  const qc      = useQueryClient()
  const [open,  setOpen]  = useState(false)
  const [input, setInput] = useState("")
  const [convId, setConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sending,  setSending]  = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const esRef  = useRef<EventSource | null>(null)

  // فتح/إنشاء محادثة
  const openChat = async () => {
    if (!isLoggedIn()) return
    setOpen(true)
    if (convId) return

    try {
      const res = await api.post("/api/chat/conversations", { vendorId })
      const conv = res.data.data
      setConvId(conv.id)
      setMessages(conv.messages || [])

      // إذا في منتج — أرسل رسالة ترحيب تلقائية
      if (productId && productName && conv.messages?.length === 0) {
        await api.post(`/api/chat/conversations/${conv.id}/messages`, {
          content:     `مرحبا، عندي سؤال عن المنتج: ${productName}`,
          messageType: "product",
          metadata:    { productId, productName },
        })
      }
    } catch {}
  }

  // SSE للرسائل الفورية
  useEffect(() => {
    if (!convId || !open) return
    const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations/${convId}/stream`)
    esRef.current = es

    es.onmessage = (e) => {
      if (e.data === ": ping" || e.data === ": connected") return
      try {
        const msg = JSON.parse(e.data)
        setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg])
      } catch {}
    }

    return () => { es.close(); esRef.current = null }
  }, [convId, open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !convId || sending) return
    const text = input.trim()
    setInput("")
    setSending(true)

    try {
      const res = await api.post(`/api/chat/conversations/${convId}/messages`, {
        content: text, messageType: "text",
      })
      setMessages(prev => [...prev, res.data.data])
    } catch {} finally {
      setSending(false)
    }
  }

  if (!isLoggedIn()) return null

  return (
    <>
      {/* زر الفتح */}
      {!open && (
        <button
          onClick={openChat}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          راسل البائع
        </button>
      )}

      {/* نافذة الدردشة */}
      {open && (
        <div className="fixed bottom-24 end-6 z-40 w-80 flex flex-col rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-500">
            <div className="flex items-center gap-2.5">
              {vendorLogo
                ? <Image src={vendorLogo} alt="" width={28} height={28} className="rounded-full" />
                : <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">{vendorName[0]}</div>
              }
              <div>
                <p className="text-white text-sm font-semibold">{vendorName}</p>
                <p className="text-emerald-100 text-xs">بائع موثق</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72">
            {messages.length === 0 && (
              <p className="text-center text-xs text-[var(--text-muted)] py-6">
                ابدأ المحادثة مع {vendorName}
              </p>
            )}
            {messages.map(msg => {
              const isMine = msg.senderId === user?.id
              const meta   = msg.metadata ? JSON.parse(msg.metadata) : null
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    isMine ? "bg-emerald-500 text-white rounded-ee-sm" : "bg-[var(--bg-soft)] text-[var(--text)] rounded-es-sm"
                  }`}>
                    {msg.messageType === "product" && meta?.productName && (
                      <p className="text-xs opacity-75 mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />{meta.productName}
                      </p>
                    )}
                    {msg.content}
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border)] p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-[var(--bg-soft)] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              disabled={sending || !convId}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !convId}
              className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
