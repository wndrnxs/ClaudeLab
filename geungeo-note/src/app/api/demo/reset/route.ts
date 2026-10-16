import { HttpError } from "@/lib/auth";
import { json, route } from "@/lib/api";
import { resetDb } from "@/lib/db";
import { demoLoginEnabled } from "@/lib/demo";

/** 체험 데이터를 처음 상태로 되돌립니다(체험 모드에서만). */
export const POST = route(async () => {
  if (!demoLoginEnabled()) throw new HttpError(404, "체험 모드가 아닙니다.");
  await resetDb();
  return json({ ok: true });
});
