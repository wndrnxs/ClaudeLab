import { NextResponse } from "next/server";
import { z } from "zod";
import { AiError } from "./ai/claude";
import { HttpError } from "./auth";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "요청 형식이 올바르지 않습니다.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(400, first?.message ?? "입력값을 확인해 주세요.");
  }
  return parsed.data;
}

/** 라우트 핸들러 공통 오류 처리 */
export function route<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      if (error instanceof AiError) return json({ error: error.message }, 502);
      console.error(error);
      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      return json({ error: message }, 500);
    }
  };
}

export type IdCtx = { params: Promise<{ id: string }> };
