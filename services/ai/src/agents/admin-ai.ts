import { runAgent } from "./agent-loop"
import { claude, CLAUDE_MODEL } from "../lib/claude"
import { cachedAI } from "../lib/cache"
import { prisma } from "../lib/db"

/**
 * Admin Dashboard Insights
 * Analyzes sales data and gives actionable recommendations
 */
export async function getAdminInsights(period: "today" | "week" | "month" | "year"): Promise<string> {
  return cachedAI(`insights:${period}`, 1800, () =>
    runAgent({
      messages: [
        {
          role: "user",
          content: `
حلل أداء المتجر لفترة: ${period}.
استخدم get_sales_analytics وget_low_stock_products.
أعطني:
1. ملخص الأداء
2. المنتجات الأكثر مبيعاً
3. تحذيرات المخزون
4. توصيات لتحسين المبيعات
أجب بالعربية بشكل مختصر وعملي.
          `.trim(),
        },
      ],
      systemExtra: "أنت محلل أعمال خبير. ردودك موجهة للأدمن وتكون دقيقة وعملية.",
    })
  )
}

/**
 * Auto-generate product description in Arabic + English
 */
export async function generateProductDescription(productInfo: {
  name: string
  category: string
  price: number
  specs?: string
}): Promise<{ ar: string; en: string }> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `
اكتب وصفاً تسويقياً لهذا المنتج:
الاسم: ${productInfo.name}
القسم: ${productInfo.category}
السعر: ${productInfo.price} د.ع
${productInfo.specs ? `المواصفات: ${productInfo.specs}` : ""}

أرجع فقط JSON بهذا الشكل:
{"ar": "الوصف بالعربية (2-3 جمل)", "en": "Description in English (2-3 sentences)"}
        `.trim(),
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")

  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return {
      ar: `${productInfo.name} — منتج عالي الجودة بسعر ${productInfo.price} د.ع`,
      en: `${productInfo.name} — High quality product at ${productInfo.price} IQD`,
    }
  }
}

/**
 * Auto-tag and categorize a product
 */
export async function autoTagProduct(productName: string, description: string): Promise<{
  suggestedCategory: string
  tags: string[]
  searchKeywords: string[]
}> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, nameAr: true },
  })

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `
المنتج: ${productName}
الوصف: ${description}
الأقسام المتاحة: ${JSON.stringify(categories)}

أرجع فقط JSON:
{
  "suggestedCategory": "category_id",
  "tags": ["tag1", "tag2", "tag3"],
  "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
        `.trim(),
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")

  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { suggestedCategory: "", tags: [], searchKeywords: [] }
  }
}

/**
 * Anomaly Detection - flags suspicious orders
 */
export async function detectOrderAnomalies(orderId: string): Promise<{
  isSuspicious: boolean
  reason?: string
  riskScore: number
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: { select: { createdAt: true, orders: { select: { id: true } } } },
    },
  })

  if (!order) return { isSuspicious: false, riskScore: 0 }

  // Basic heuristics
  const flags: string[] = []
  let riskScore = 0

  // New account with large order
  const accountAge = Date.now() - order.user.createdAt.getTime()
  const accountAgeDays = accountAge / (1000 * 60 * 60 * 24)
  if (accountAgeDays < 1 && order.total > 100000) {
    flags.push("حساب جديد مع طلب كبير")
    riskScore += 30
  }

  // Very high quantity of same item
  const highQtyItem = order.items.find((i) => i.quantity > 20)
  if (highQtyItem) {
    flags.push(`كمية غير طبيعية: ${highQtyItem.quantity}x`)
    riskScore += 40
  }

  // Total too high
  if (order.total > 5000000) {
    flags.push("مبلغ مرتفع جداً")
    riskScore += 20
  }

  // If borderline, ask Claude
  if (riskScore > 20 && riskScore < 70) {
    const aiVerdict = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content: `طلب بمواصفات: المبلغ=${order.total}، عمر الحساب=${Math.round(accountAgeDays)} يوم، عدد الطلبات السابقة=${order.user.orders.length}. هل هذا مشبوه؟ أجب بـ JSON: {"suspicious": true/false, "reason": "السبب"}`,
        },
      ],
    })

    try {
      const aiText = (aiVerdict.content[0] as any).text
      const aiResult = JSON.parse(aiText.replace(/```json|```/g, "").trim())
      if (aiResult.suspicious) {
        flags.push(aiResult.reason)
        riskScore += 20
      }
    } catch {}
  }

  return {
    isSuspicious: riskScore >= 60,
    reason: flags.join(" | "),
    riskScore: Math.min(riskScore, 100),
  }
}

/**
 * مراجعة منتج بائع ذكية — توصية للأدمن قبل الموافقة
 */
export async function reviewProduct(p: {
  nameAr: string; name?: string; description?: string;
  price: number; comparePrice?: number; images?: string[]; category?: string;
}): Promise<{
  recommendation: "approve" | "review" | "reject"
  score: number
  summary: string
  issues: string[]
}> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `
أنت مراجع جودة لمتجر إلكتروني عراقي متعدد البائعين. افحص هذا المنتج المقدّم من بائع:

الاسم (عربي): ${p.nameAr}
الاسم (إنجليزي): ${p.name || "—"}
الوصف: ${p.description || "(فارغ)"}
السعر: ${p.price} دينار عراقي
السعر قبل الخصم: ${p.comparePrice || "—"}
عدد الصور: ${p.images?.length || 0}
الفئة: ${p.category || "—"}

قيّم المنتج وأرجع فقط JSON بهذا الشكل:
{
  "recommendation": "approve" أو "review" أو "reject",
  "score": رقم من 0 إلى 100 لجودة المنتج,
  "summary": "جملة مختصرة بالعربي عن المنتج وقرارك",
  "issues": ["مشكلة 1", "مشكلة 2"]
}

معايير التقييم:
- الاسم واضح ومفهوم؟
- الوصف كافٍ (مو فارغ ولا قصير جداً)؟
- السعر منطقي (مو 0 ولا غريب)؟
- في صور؟
- مؤشرات منتج مزيّف/مضلل/مخالف؟
إذا كل شي ممتاز: approve. إذا في نواقص بسيطة: review. إذا مخالف/مشبوه/ناقص جداً: reject.
        `.trim(),
      },
    ],
  })
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { recommendation: "review", score: 50, summary: "تعذّر التحليل التلقائي", issues: [] }
  }
}

/**
 * توليد منتج كامل من اسم بسيط — للبائع
 */
export async function generateFullProduct(input: { name: string }): Promise<{
  nameAr: string; name: string; descriptionAr: string; description: string;
  suggestedCategoryId: string; suggestedCategory: string; suggestedPrice: number;
}> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true, nameAr: true } })
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `
أنت خبير في التجارة الإلكترونية بالعراق. بائع أدخل اسم منتج بسيط: "${input.name}"

ولّد بيانات منتج كاملة احترافية. الأقسام المتاحة:
${JSON.stringify(categories)}

أرجع فقط JSON بهذا الشكل:
{
  "nameAr": "اسم عربي واضح وجذّاب",
  "name": "English name",
  "descriptionAr": "وصف تسويقي بالعربي 2-3 جمل يبرز المميزات",
  "description": "Marketing description in English 2-3 sentences",
  "suggestedCategoryId": "id القسم الأنسب من القائمة",
  "suggestedCategory": "اسم القسم بالعربي",
  "suggestedPrice": سعر تقديري بالدينار العراقي (رقم فقط، حسب السوق العراقي)
}
اختر القسم الصحيح بعناية حسب نوع المنتج.
        `.trim(),
      },
    ],
  })
  const text = response.content.filter((b) => b.type === "text").map((b: any) => b.text).join("")
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)
    // تأكد القسم صحيح
    const validCat = categories.find(c => c.id === parsed.suggestedCategoryId)
    if (!validCat && categories[0]) {
      parsed.suggestedCategoryId = categories[0].id
      parsed.suggestedCategory = categories[0].nameAr
    }
    return parsed
  } catch {
    return {
      nameAr: input.name, name: input.name, descriptionAr: "", description: "",
      suggestedCategoryId: categories[0]?.id || "", suggestedCategory: categories[0]?.nameAr || "",
      suggestedPrice: 0,
    }
  }
}

/**
 * مساعد الأدمن التفاعلي — يجاوب أسئلة بالعربي من بيانات المتجر الحقيقية
 */
export async function askAdminAI(question: string): Promise<string> {
  return runAgent({
    messages: [
      {
        role: "user",
        content: `سؤال من مدير المتجر: ${question}

استخدم الأدوات المتاحة (get_sales_analytics، get_low_stock_products، search_products، get_categories) لجلب البيانات الحقيقية وأجب بدقة.
أجب بالعربية بشكل مختصر وعملي ومباشر. إذا كانت أرقام، رتّبها بوضوح.`,
      },
    ],
    systemExtra: "أنت مساعد ذكي لمدير متجر إلكتروني عراقي. تجاوب من البيانات الفعلية فقط، ولا تخمّن. ردودك مختصرة وعملية بالعربية.",
  })
}

/**
 * تحسين وترجمة وصف منتج — للبائع
 */
export async function improveDescription(input: {
  nameAr?: string; currentAr?: string; currentEn?: string;
}): Promise<{ descriptionAr: string; description: string }> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `
أنت كاتب محتوى تسويقي لمتجر عراقي. حسّن وصف هذا المنتج واجعله جذّاباً واحترافياً، وترجمه للغتين.

اسم المنتج: ${input.nameAr || "—"}
الوصف الحالي بالعربي: ${input.currentAr || "(فارغ)"}
الوصف الحالي بالإنجليزي: ${input.currentEn || "(فارغ)"}

أرجع فقط JSON:
{
  "descriptionAr": "وصف عربي محسّن وجذّاب 2-3 جمل يبرز المميزات والفوائد",
  "description": "Improved attractive English description 2-3 sentences"
}
إذا الوصف فارغ، اكتب وصفاً مناسباً من اسم المنتج.
        `.trim(),
      },
    ],
  })
  const text = response.content.filter((b) => b.type === "text").map((b: any) => b.text).join("")
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { descriptionAr: input.currentAr || "", description: input.currentEn || "" }
  }
}

/**
 * توليد صورة منتج بالذكاء الاصطناعي — OpenAI GPT Image
 */
export async function generateProductImage(input: { name: string; category?: string; descriptionAr?: string }): Promise<{
  imageUrl: string; prompt: string;
}> {
  // 1) Claude يكتب prompt بصري احترافي
  const promptRes = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `منتج: "${input.name}"${input.category ? ` (قسم: ${input.category})` : ""}${input.descriptionAr ? ` — ${input.descriptionAr}` : ""}

اكتب prompt إنجليزي قصير ودقيق لتوليد صورة منتج احترافية لمتجر إلكتروني (خلفية بيضاء نظيفة، إضاءة استوديو، زاوية واضحة). أرجع الـ prompt فقط بدون أي شيء آخر.`,
    }],
  })
  const imgPrompt = promptRes.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim().slice(0, 400)

  // 2) OpenAI GPT Image يولّد الصورة
  const oaiRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: imgPrompt,
      n: 1,
      size: "1024x1024",
    }),
  })
  const oaiData: any = await oaiRes.json()
  if (!oaiRes.ok) {
    throw new Error(oaiData?.error?.message || "OpenAI image error")
  }
  // GPT Image يرجع base64
  const b64 = oaiData?.data?.[0]?.b64_json
  const url = oaiData?.data?.[0]?.url
  return { imageUrl: url || (b64 ? `data:image/png;base64,${b64}` : ""), prompt: imgPrompt }
}
