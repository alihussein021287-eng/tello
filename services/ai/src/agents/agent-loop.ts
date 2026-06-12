import type Anthropic from "@anthropic-ai/sdk"
import { claude, CLAUDE_MODEL, TELLO_SYSTEM, extractText } from "../lib/claude"
import { TELLO_TOOLS, executeTool } from "../tools/tello-tools"

export interface AgentMessage {
  role: "user" | "assistant"
  content: string
}

interface RunAgentOptions {
  messages: AgentMessage[]
  systemExtra?: string   // extra context (e.g. user profile)
  maxRounds?: number
  tools?: Anthropic.Tool[]
}

/**
 * Runs Claude in an agentic loop:
 * 1. Send messages
 * 2. If Claude calls a tool → execute it → feed result back
 * 3. Repeat until Claude gives a final text response
 */
export async function runAgent({
  messages,
  systemExtra = "",
  maxRounds = 8,
  tools = TELLO_TOOLS,
}: RunAgentOptions): Promise<string> {

  const system = systemExtra
    ? `${TELLO_SYSTEM}\n\n${systemExtra}`
    : TELLO_SYSTEM

  // Convert to Anthropic message format
  const history: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  for (let round = 0; round < maxRounds; round++) {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      tools,
      messages: history,
    })

    // Check if we're done
    if (response.stop_reason === "end_turn") {
      return extractText(response)
    }

    // Handle tool use
    if (response.stop_reason === "tool_use") {
      // Add Claude's response (with tool calls) to history
      history.push({ role: "assistant", content: response.content })

      // Execute all tool calls in parallel
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
          .map(async (toolCall) => {
            const result = await executeTool(
              toolCall.name,
              toolCall.input as Record<string, any>
            ).catch((err) => ({ error: String(err) }))

            return {
              type: "tool_result" as const,
              tool_use_id: toolCall.id,
              content: JSON.stringify(result),
            }
          })
      )

      // Feed tool results back
      history.push({ role: "user", content: toolResults })
      continue
    }

    // Fallback: extract whatever text is there
    return extractText(response)
  }

  return "عذراً، حدث خطأ في المعالجة. حاول مجدداً."
}
