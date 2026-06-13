"use client"
import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bot, Sparkles, TrendingUp, AlertTriangle, Send, Loader2, RefreshCw } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { adminApi, api } from "@/lib/api"

type Period = "today" | "week" | "month" | "year"

interface ChatMsg {
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

export default function AIPage() {
  const [period, setPeriod] = useState<Period>("week")
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "أهلاً! أنا مساعد الأدمن الذكي لـ Tello 🤖\nأقدر أحلل المبيعات، أشخص المشاكل، وأعطيك توصيات لتطوير المتجر. شنو تريد تعرف؟" },
  ])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMsgs])

  const { data: insights, isLoading: insightsLoading, refetch } = useQuery({
    queryKey: ["admin", "ai", "insights", period],
    queryFn: () => adminApi.ai.insights(period),
    staleTime: 1800_000,
  })

  const sendChat = async () => {
    if (!input.trim() || chatLoading) return
    const msg = input.trim()
    setInput("")
    setChatMsgs((p) => [...p, { role: "user", content: msg }])
    setChatLoading(true)
    setChatMsgs((p) => [...p, { role: "assistant", content: "", streaming: true }])

    try {
      const res = await adminApi.ai.ask(msg)
      const answer = res.data?.answer || "ما قدرت أجاوب، حاول بصيغة ثانية."
      setChatMsgs((p) => [...p.slice(0, -1), { role: "assistant", content: answer }])
    } catch {
      setChatMsgs((p) => [...p.slice(0, -1), { role: "assistant", content: "حدث خطأ، حاول مجدداً." }])
    } finally {
      setChatLoading(false)
    }
  }

  const QUICK = [
    "شو أكثر منتج مباع هذا الأسبوع؟",
    "أي قسم يحتاج تعزيز؟",
    "وين يتعطل المستخدمون في عملية الشراء؟",
    "اقترح عروض للأسبوع الجاي",
  ]

  return (
    <>
      <Topbar title="مركز الذكاء الاصطناعي" />
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h2 className="font-semibold">Claude AI — مدمج مع Tello</h2>
            <p className="text-xs text-[var(--text-muted)]">يقرأ بياناتك الحقيقية ويحلل بالوقت الفعلي</p>
          </div>
          <div className="ms-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-500 font-medium">متصل</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* AI Insights */}
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  <h3 className="font-semibold text-sm">تحليل ذكي للمبيعات</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                    className="input h-7 text-xs py-0 w-auto"
                  >
                    <option value="today">اليوم</option>
                    <option value="week">هذا الأسبوع</option>
                    <option value="month">هذا الشهر</option>
                    <option value="year">هذه السنة</option>
                  </select>
                  <button onClick={() => refetch()} className="p-1 hover:bg-[var(--bg)] rounded-lg transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${insightsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {insightsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 bg-[var(--bg)] rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-line bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
                    {insights?.insight || "لا توجد بيانات بعد"}
                  </div>
                </div>
              )}
            </div>

            {/* Quick AI Actions */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <h3 className="font-semibold text-sm">إجراءات ذكية</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "توليد وصف منتج", icon: "✍️", action: () => setInput("اكتب وصفاً لمنتج جديد") },
                  { label: "تحليل المنافسين", icon: "🔍", action: () => setInput("ساعدني أحلل المنافسين") },
                  { label: "اقتراح عروض", icon: "🎯", action: () => setInput("اقترح عروض ترويجية مناسبة") },
                  { label: "تقرير أسبوعي", icon: "📊", action: () => setInput("اعطني تقرير أسبوعي مختصر") },
                ].map(({ label, icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-2 p-3 bg-[var(--bg)] hover:bg-[var(--border)] rounded-xl text-xs font-medium transition-colors text-start"
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Chat */}
          <div className="card flex flex-col h-[500px]">
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">مساعد الأدمن</p>
                <p className="text-xs text-[var(--text-muted)]">يقرأ بيانات Tello مباشرة</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary-500 text-white"
                      : "bg-[var(--bg)] border border-[var(--border)] text-[var(--text)]"
                  }`}>
                    {msg.content}
                    {msg.streaming && (
                      <span className="inline-block w-1 h-4 bg-current opacity-60 animate-pulse ms-0.5 align-middle" />
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && chatMsgs[chatMsgs.length - 1]?.content === "" && (
                <div className="flex">
                  <div className="bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick prompts */}
            {chatMsgs.length === 1 && (
              <div className="px-3 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(sendChat, 0) }}
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="اسأل عن أي شيء..."
                className="flex-1 input text-sm"
                disabled={chatLoading}
              />
              <button
                onClick={sendChat}
                disabled={!input.trim() || chatLoading}
                className="w-9 h-9 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
