"use client"
import { useQuery } from "@tanstack/react-query"
import { Star, Gift, TrendingUp, Clock } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

const TIERS = [
  { name: "Bronze",  nameAr: "برونزي", min: 0,     icon: "🥉", color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20" },
  { name: "Silver",  nameAr: "فضي",    min: 5000,  icon: "🥈", color: "text-slate-500",  bg: "bg-slate-50 dark:bg-slate-800/30" },
  { name: "Gold",    nameAr: "ذهبي",   min: 20000, icon: "🥇", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  { name: "Diamond", nameAr: "ماس",    min: 50000, icon: "💎", color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20" },
]

const TX_TYPE: Record<string, { label: string; color: string }> = {
  EARN:   { label: "كسبت",  color: "text-emerald-500" },
  REDEEM: { label: "استبدلت", color: "text-orange-500" },
  ADMIN:  { label: "منحة",  color: "text-blue-500" },
  EXPIRE: { label: "انتهت", color: "text-red-500" },
}

export default function LoyaltyPage() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  useEffect(() => { if (!isLoggedIn()) router.replace("/auth/login") }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["loyalty"],
    queryFn:  () => api.get("/api/loyalty/balance").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  const wallet  = data?.data
  const tier    = wallet?.tier
  const curTier = TIERS.find(t => t.name === tier?.name) || TIERS[0]
  const nextTier = TIERS[TIERS.indexOf(curTier) + 1]

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
          <h1 className="text-xl font-bold">نقاط الولاء</h1>
        </div>

        {isLoading && <div className="card p-10 animate-pulse bg-[var(--border)]" />}

        {wallet && (
          <>
            {/* Balance Card */}
            <div className={`card p-6 mb-5 ${curTier.bg} border-0`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">رصيدك الحالي</p>
                  <p className="text-4xl font-black text-[var(--text)]">{wallet.points.toLocaleString()}</p>
                  <p className="text-sm text-[var(--text-muted)]">نقطة ≈ {wallet.points.toLocaleString()} د.ع</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl">{curTier.icon}</p>
                  <p className={`text-sm font-bold ${curTier.color}`}>{curTier.nameAr}</p>
                </div>
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
                    <span>{curTier.nameAr}</span>
                    <span>{nextTier.nameAr} ({nextTier.min.toLocaleString()} نقطة)</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min((wallet.lifetime / nextTier.min) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {Math.max(0, nextTier.min - wallet.lifetime).toLocaleString()} نقطة للوصول لـ {nextTier.nameAr}
                  </p>
                </div>
              )}
            </div>

            {/* Tiers */}
            <div className="card p-5 mb-5">
              <h2 className="font-bold text-sm mb-4">المستويات والمزايا</h2>
              <div className="space-y-3">
                {TIERS.map(t => (
                  <div key={t.name} className={`flex items-center gap-3 p-3 rounded-xl ${t.name === curTier.name ? `${t.bg} border border-[var(--border)]` : "opacity-60"}`}>
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${t.color}`}>{t.nameAr}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t.min.toLocaleString()}+ نقطة</p>
                    </div>
                    {t.name === curTier.name && (
                      <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">حالي</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="card p-5 mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">استبدل نقاطك</p>
                <p className="text-xs text-[var(--text-muted)]">1000 نقطة = 1000 د.ع خصم</p>
              </div>
              <Link href="/products" className="btn-primary text-sm flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                تسوق الآن
              </Link>
            </div>

            {/* History */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  سجل النقاط
                </h2>
              </div>
              {wallet.history?.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">لا توجد معاملات بعد</p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {wallet.history?.map((tx: any) => {
                    const txInfo = TX_TYPE[tx.type] || TX_TYPE.EARN
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(tx.createdAt).toLocaleDateString("ar-IQ")}
                          </p>
                        </div>
                        <span className={`font-bold text-sm ${txInfo.color}`}>
                          {tx.points > 0 ? "+" : ""}{tx.points.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
