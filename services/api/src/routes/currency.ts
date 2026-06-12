import { Hono } from "hono"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const currencyRoutes = new Hono()

// سعر صرف IQD/USD (محدث يومياً)
const DEFAULT_RATE = 1310  // 1 USD = 1310 IQD (تقريبي)

// ── جلب أسعار الصرف ──────────────────────────────────────
currencyRoutes.get("/rates", async (c) => {
  // جرب من Cache أولاً
  const cached = await redis.get("currency:rates").catch(() => null)
  if (cached) return c.json({ success: true, data: JSON.parse(cached) })

  // جلب من API خارجي (أو استخدم القيمة الافتراضية)
  let usdToIqd = DEFAULT_RATE
  try {
    const res  = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: AbortSignal.timeout(3000) })
    const data = await res.json()
    usdToIqd = data.rates?.IQD || DEFAULT_RATE
  } catch {
    // استخدم القيمة الافتراضية
  }

  const rates = {
    USD_TO_IQD: usdToIqd,
    IQD_TO_USD: 1 / usdToIqd,
    updatedAt:  new Date().toISOString(),
  }

  // Cache لـ 6 ساعات
  await redis.setex("currency:rates", 21600, JSON.stringify(rates)).catch(() => {})

  return c.json({ success: true, data: rates })
})

// ── تحويل سعر ────────────────────────────────────────────
currencyRoutes.get("/convert", async (c) => {
  const { amount, from = "IQD", to = "USD" } = c.req.query()
  if (!amount) return c.json({ success: false, message: "amount مطلوب" }, 400)

  const cached = await redis.get("currency:rates").catch(() => null)
  const rates  = cached ? JSON.parse(cached) : { USD_TO_IQD: DEFAULT_RATE }

  const num     = Number(amount)
  let converted = num

  if (from === "IQD" && to === "USD") {
    converted = num / rates.USD_TO_IQD
  } else if (from === "USD" && to === "IQD") {
    converted = num * rates.USD_TO_IQD
  }

  return c.json({
    success: true,
    data: {
      original:  num,
      converted: Math.round(converted * 100) / 100,
      from, to,
      rate: from === "IQD" ? rates.IQD_TO_USD : rates.USD_TO_IQD,
    },
  })
})

// ── Helper: تحويل سعر للعرض ──────────────────────────────
export async function formatPrice(iqd: number, currency: "IQD" | "USD" = "IQD"): Promise<string> {
  if (currency === "IQD") {
    return `${iqd.toLocaleString()} د.ع`
  }

  const cached = await redis.get("currency:rates").catch(() => null)
  const rates  = cached ? JSON.parse(cached) : { USD_TO_IQD: DEFAULT_RATE }
  const usd    = iqd / rates.USD_TO_IQD

  return `$${usd.toFixed(2)}`
}
