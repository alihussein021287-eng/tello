import { runAgent, type AgentMessage } from "./agent-loop"
import { cachedAI } from "../lib/cache"

/**
 * Shopping Assistant
 * Helps users find products, compare them, and make decisions.
 * Understands Iraqi dialect.
 */
export async function shoppingAssistant(
  messages: AgentMessage[],
  userId?: string
): Promise<string> {
  const userContext = userId
    ? `معرف المستخدم الحالي: ${userId}. استخدم get_user_order_history لتقديم توصيات شخصية.`
    : "المستخدم غير مسجل الدخول."

  return runAgent({
    messages,
    systemExtra: `
أنت مساعد تسوق ودود لمنصة Tello.
${userContext}
- تفهم اللهجة العراقية (مثال: "أريد موبايل مو غالي" = هاتف بسعر معقول)
- عند البحث عن منتجات، استخدم search_products دائماً
- قدم خيارات مع الأسعار بالدينار العراقي
- إذا سأل عن مقارنة، قارن المنتجات بشكل واضح
- اقترح بدائل إذا لم يجد المستخدم ما يريد
    `.trim(),
  })
}

/**
 * Product Recommendations
 * Generates personalized "You might like" suggestions
 */
export async function getRecommendations(
  userId: string,
  limit = 6
): Promise<string> {
  const cacheKey = `recs:${userId}:${limit}`

  return cachedAI(cacheKey, 3600, () =>
    runAgent({
      messages: [
        {
          role: "user",
          content: `بناءً على تاريخ مشتريات المستخدم ${userId}، اقترح ${limit} منتجات مناسبة له. أرجع فقط قائمة من IDs المنتجات بصيغة JSON array مثل: ["id1","id2"]`,
        },
      ],
      systemExtra: "أرجع فقط JSON array نظيف بدون أي نص إضافي.",
    })
  )
}

/**
 * Smart Search
 * Understands natural language & Iraqi dialect search queries
 */
export async function smartSearch(query: string): Promise<string> {
  const cacheKey = `search:${query.toLowerCase().trim()}`

  return cachedAI(cacheKey, 300, () =>
    runAgent({
      messages: [
        {
          role: "user",
          content: `المستخدم يبحث عن: "${query}". ابحث عن المنتجات المناسبة وأرجعها بصيغة JSON مع الحقول: id, nameAr, price, image. أرجع فقط JSON array نظيف.`,
        },
      ],
      systemExtra: "ترجم اللهجة العراقية لمصطلحات بحث مناسبة قبل البحث. أرجع JSON array فقط.",
    })
  )
}
