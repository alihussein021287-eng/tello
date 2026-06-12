"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Star, Gift, Users, TrendingUp } from "lucide-react"
import { Topbar } from "@/components/layout/Topbar"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

export default function LoyaltyAdminPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ userId: "", points: "", description: "" })

  const awardMut = useMutation({
    mutationFn: () => api.post("/api/loyalty/admin/award", {
      userId:      form.userId,
      points:      Number(form.points),
      description: form.description,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success("تم منح النقاط")
      setForm({ userId: "", points: "", description: "" })
    },
    onError: () => toast.error("حدث خطأ"),
  })

  return (
    <>
      <Topbar title="نقاط الولاء" />
      <div className="p-6 space-y-5 max-w-2xl">

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "نظام النقاط",  value: "100 د.ع = 1 نقطة",   icon: Star,      color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { label: "قيمة النقطة",  value: "1 نقطة = 1 د.ع",     icon: Gift,      color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "حد الاستبدال", value: "500 نقطة كحد أدنى",   icon: TrendingUp,color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
            { label: "أقصى خصم",     value: "20% من قيمة الطلب",   icon: Users,     color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-8 h-8 ${bg} ${color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-bold text-sm">{value}</p>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>

        {/* المستويات */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">مستويات الولاء</h3>
          <div className="space-y-3 text-sm">
            {[
              { tier: "🥉 برونزي",  min: 0,     max: 4999,  benefits: "تجميع نقاط" },
              { tier: "🥈 فضي",     min: 5000,  max: 19999, benefits: "خصم 10%" },
              { tier: "🥇 ذهبي",    min: 20000, max: 49999, benefits: "خصم 15% + شحن مجاني" },
              { tier: "💎 ماسي",    min: 50000, max: null,   benefits: "خصم 20% + شحن مجاني + دعم أولوية" },
            ].map(({ tier, min, max, benefits }) => (
              <div key={tier} className="flex items-center justify-between p-3 bg-[var(--bg-soft)] rounded-xl">
                <span className="font-medium">{tier}</span>
                <span className="text-xs text-[var(--text-muted)]">{min.toLocaleString()}{max ? `—${max.toLocaleString()}` : "+"} نقطة</span>
                <span className="text-xs text-primary-500">{benefits}</span>
              </div>
            ))}
          </div>
        </div>

        {/* منح نقاط يدوي */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">منح نقاط يدوياً</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1">User ID</label>
              <input value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="input text-sm font-mono" placeholder="cuid..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">النقاط</label>
                <input type="number" value={form.points} onChange={e => setForm({...form, points: e.target.value})} className="input text-sm" placeholder="100" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">السبب</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input text-sm" placeholder="مكافأة..." />
              </div>
            </div>
            <button
              onClick={() => awardMut.mutate()}
              disabled={!form.userId || !form.points || awardMut.isPending}
              className="btn-primary w-full disabled:opacity-60"
            >
              {awardMut.isPending ? "جاري..." : "منح النقاط"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
