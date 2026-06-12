"use client"
import { useState } from "react"
import { Tag, X, CheckCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

interface CouponResult {
  couponId:    string
  code:        string
  discount:    number
  finalTotal:  number
  description: string
}

interface CouponInputProps {
  orderTotal:  number
  onApply:     (result: CouponResult) => void
  onRemove:    () => void
  applied?:    CouponResult | null
}

export function CouponInput({ orderTotal, onApply, onRemove, applied }: CouponInputProps) {
  const [code,    setCode]    = useState("")
  const [loading, setLoading] = useState(false)

  const apply = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await api.post("/api/coupons/apply", {
        code: code.trim(), orderTotal,
      })
      onApply(res.data.data)
      toast.success(`خصم ${res.data.data.discount.toLocaleString()} د.ع تم تطبيقه! 🎉`)
      setCode("")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "كود غير صحيح")
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              كود <span className="font-mono">{applied.code}</span> مطبق
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              وفرت {applied.discount.toLocaleString()} د.ع
            </p>
          </div>
        </div>
        <button onClick={onRemove} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
          <X className="w-4 h-4 text-emerald-600" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && apply()}
          placeholder="كود الخصم"
          className="input ps-9 text-sm font-mono"
          maxLength={20}
        />
      </div>
      <button
        onClick={apply}
        disabled={!code.trim() || loading}
        className="btn-primary px-4 disabled:opacity-50 flex-shrink-0"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
      </button>
    </div>
  )
}
