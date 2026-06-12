import { TrendingUp, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  iconColor?: string
  prefix?: string
}

export function StatCard({ title, value, change, icon: Icon, iconColor = "text-primary-500", prefix }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[var(--text-muted)] font-medium">{title}</p>
        <div className={`p-2 rounded-lg bg-[var(--bg)] ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-[var(--text)]">
          {prefix && <span className="text-base font-medium text-[var(--text-muted)] me-1">{prefix}</span>}
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{change}% من الشهر الماضي
        </div>
      )}
    </div>
  )
}
