"use client"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Minimize2, Bot, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store"

interface Message {
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "أهلاً! أنا مساعد Tello 🏺\nأقدر أساعدك تلكي المنتج اللي تريده. شكو؟",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    // Add empty assistant message for streaming effect
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ])

    try {
      const history = messages
        .slice(-8) // last 8 messages for context
        .map((m) => ({ role: m.role, content: m.content }))
      history.push({ role: "user", content: userMsg })

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            userId: user?.id,
          }),
        }
      )

      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break

          try {
            const { text } = JSON.parse(data)
            if (text) {
              fullText += text
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: fullText, streaming: true },
              ])
            }
          } catch {}
        }
      }

      // Finalize
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: fullText, streaming: false },
      ])
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "عذراً، حدث خطأ. حاول مجدداً.", streaming: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 end-6 z-50 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="فتح المساعد"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 end-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="bg-primary-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">مساعد Tello</p>
                <p className="text-primary-100 text-xs">متواجد الآن</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary-500 text-white rounded-ee-sm"
                      : "bg-[var(--bg-soft)] text-[var(--text)] rounded-es-sm"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-1 h-4 bg-current opacity-70 animate-pulse ms-0.5 align-middle" />
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-soft)] px-4 py-3 rounded-2xl rounded-es-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                "أريد موبايل مو غالي",
                "شو عندكم من العروض؟",
                "ساعدني ألكي هدية",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    setTimeout(() => sendMessage(), 0)
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 border border-[var(--border)] rounded-full hover:border-primary-400 hover:text-primary-500 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[var(--border)] p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-[var(--bg-soft)] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-[var(--text)]"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
