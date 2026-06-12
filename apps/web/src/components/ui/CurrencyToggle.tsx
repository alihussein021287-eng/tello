"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

// ── Store ─────────────────────────────────────────────────
interface CurrencyStore {
  currency:    "IQD" | "USD"
  setCurrency: (c: "IQD" | "USD") => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency:    "IQD",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "tello-currency" }
  )
)

// ── Hook: تحويل سعر ───────────────────────────────────────
export function usePrice(iqd: number): string {
  const { currency } = useCurrencyStore()

  const { data } = useQuery({
    queryKey: ["currency-rates"],
    queryFn:  () => api.get("/api/currency/rates").then(r => r.data),
    staleTime: 6 * 60 * 60 * 1000,
  })

  if (currency === "IQD" || !data?.data) {
    return `${iqd.toLocaleString()} د.ع`
  }

  const usd = iqd / data.data.USD_TO_IQD
  return `$${usd.toFixed(2)}`
}

// ── Toggle Component ──────────────────────────────────────
export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrencyStore()

  return (
    <div className="flex items-center gap-1 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-1">
      {(["IQD", "USD"] as const).map(c => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            currency === c
              ? "bg-[var(--bg)] shadow text-[var(--text)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {c === "IQD" ? "د.ع" : "$"}
        </button>
      ))}
    </div>
  )
}

// ── Price Display Component ───────────────────────────────
export function Price({ iqd, className = "" }: { iqd: number; className?: string }) {
  const formatted = usePrice(iqd)
  return <span className={className}>{formatted}</span>
}
