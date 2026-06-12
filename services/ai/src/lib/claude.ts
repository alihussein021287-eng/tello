import Anthropic from "@anthropic-ai/sdk"

// Single Claude client for the whole service
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001"

// System prompt shared across all Tello AI features
export const TELLO_SYSTEM = `أنت مساعد ذكي لمنصة Tello للتسوق الإلكتروني في العراق.
- تتحدث العربية والإنجليزية وتفهم اللهجة العراقية
- لديك معرفة كاملة بمنتجات وأقسام المتجر
- تساعد المستخدمين في إيجاد المنتجات المناسبة
- ردودك مختصرة وعملية
- تستخدم الأدوات المتاحة لك لجلب البيانات الحقيقية`

// Helper: extract text from Claude response
export function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("")
}

// Helper: stream response as SSE
export async function* streamClaude(params: Anthropic.MessageCreateParamsNonStreaming) {
  const stream = await claude.messages.stream({
    ...params,
    stream: true,
  })
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text
    }
  }
}
