import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

/**
 * Claude API 호출부. API 키는 서버에서만 읽으며 브라우저로 내려가지 않습니다.
 * ANTHROPIC_API_KEY가 없으면 앱 전체가 데모 모드로 동작합니다(pipeline.ts 참고).
 */

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// 서버 측 거절 대체(fallbacks: "default")를 지원하는 모델
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

export function hasClaudeKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.AI_MODE !== "demo";
}

export class AiError extends Error {}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

interface StructuredCall<T extends z.ZodType> {
  system: string;
  user: string;
  schema: T;
  effort: "low" | "medium" | "high";
}

export async function callStructured<T extends z.ZodType>({
  system,
  user,
  schema,
  effort,
}: StructuredCall<T>): Promise<z.infer<T>> {
  const useFallbacks = FALLBACK_MODELS.has(CLAUDE_MODEL);
  try {
    const response = await getClient().beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      output_config: { effort, format: zodOutputFormat(schema) },
    });

    if (response.stop_reason === "refusal") {
      throw new AiError("AI가 이 요청을 처리하지 않았습니다. 지문이나 요청사항을 확인해 주세요.");
    }
    if (response.stop_reason === "max_tokens") {
      throw new AiError("응답이 너무 길어 중간에 끊겼습니다. 문항 수를 줄여 다시 시도해 주세요.");
    }
    if (response.parsed_output == null) {
      throw new AiError("AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.");
    }
    return response.parsed_output as z.infer<T>;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("Claude API 키가 올바르지 않습니다. .env의 ANTHROPIC_API_KEY를 확인해 주세요.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("요청이 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiError(`Claude API 오류(${error.status ?? "연결"}): ${error.message}`);
    }
    throw error;
  }
}
