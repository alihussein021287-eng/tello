"use client"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Star, TrendingUp, Gift } from "lucide-react"
import Link from "next/link"

const TIER_COLORS = {
  Bronze:  { bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-600 dark:text-amber-400",  badge: "bg-amber-500" },
  Silver:  { bg: "bg-slate-50 dark:bg-slate-800/50",  text: "text-slate-600 dark:text-slate-300",  badge: "bg-slate-400" },
  Gold:    { bg: "bg-yellow-50 dark:bg-yellow-900/20",text: "text-yellow-600 dark:text-yellow-400",badge: "bg-yellow-500" },
  Diamond: { bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-500" },
}

export function LoyaltyWidget() {
  const { isLoggedIn } = useAuthStore()

  const { data } = useQuery({
    queryKey: ["loyalty-balance"],
    queryFn:  () => api.get("/api/loyalty/balance").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  if (!isLoggedIn() || !data) return null

  const { points, lifetime, tier } = data.data
  const colors = TIER_COLORS[tier?.name as keyof typeof TIER_COLORS] || TIER_COLORS.Bronze

  return (
    <Link href="/account/loyalty" className={`card p-4 ${colors.bg} border-0 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${colors.badge} rounded-full flex items-center justify-center`}>
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
          <span className={`text-xs font-bold ${colors.text}`}>{tier?.nameAr || "برونزي"}</span>
        </div>
        <Gift className={`w-4 h-4 ${colors.text}`} />
      </div>
      <p className={`text-2xl font-black ${colors.text}`}>{points.toLocaleString()}</p>
      <p className="text-xs text-[var(--text-muted)]">نقطة يمكن استبدالها</p>
      {tier?.benefits?.length > 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-1">✨ {tier.benefits[0]}</p>
      )}
    </Link>
  )
}

// مكون صغير يُضاف على صفحة الـ checkout
export function LoyaltyRedeemInput({
  orderTotal,
  onApply,
}: {
  orderTotal: number
  onApply: (discount: number, pointsUsed: number) => void
}) {
  const { isLoggedIn } = useAuthStore()
  const [pointsInput, setPointsInput] = useState("")
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { useState } = require("react")

  if (!isLoggedIn()) return null

  const calculate = async () => {
    if (!pointsInput) return
    setLoading(true)
    try {
      const res = await api.post("/api/loyalty/redeem/calculate", {
        points: Number(pointsInput), orderTotal,
      })
      setPreview(res.data.data)
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
        <p className="text-sm font-semibold">استبدل نقاطك</p>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={pointsInput}
          onChange={e => setPointsInput(e.target.value)}
          placeholder="عدد النقاط"
          className="input text-sm flex-1"
        />
        <button onClick={calculate} disabled={loading} className="btn-ghost border border-yellow-400 text-yellow-600 text-sm px-3 disabled:opacity-50">
          احسب
        </button>
      </div>
      {preview && (
        <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
          <p>نقاط مستخدمة: <span className="text-yellow-600 font-bold">{preview.pointsUsed}</span></p>
          <p>الخصم: <span className="text-emerald-600 font-bold">{preview.discount.toLocaleString()} د.ع</span></p>
          <button
            onClick={() => onApply(preview.discount, preview.pointsUsed)}
            className="btn-primary w-full mt-2 text-xs py-1.5"
          >
            تطبيق الخصم
          </button>
        </div>
      )}
    </div>
  )
}
