import { z } from "zod";
import { HttpError } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/api";
import { readDb } from "@/lib/db";
import { DEMO_USER_IDS, demoLoginEnabled } from "@/lib/demo";
import { setSessionCookie } from "@/lib/session-cookie";

const Body = z.object({ userId: z.string() });

export const POST = route(async (req) => {
  if (!demoLoginEnabled()) throw new HttpError(404, "체험 로그인이 꺼져 있습니다.");
  const { userId } = await parseBody(req, Body);
  if (!DEMO_USER_IDS.includes(userId)) throw new HttpError(400, "체험용 계정이 아닙니다.");
  const user = (await readDb()).users.find((u) => u.id === userId);
  if (!user) throw new HttpError(404, "체험 계정을 찾을 수 없습니다. 체험 데이터를 초기화해 주세요.");
  const res = json({ redirect: user.role === "teacher" ? "/teacher" : "/student" });
  setSessionCookie(res, user.id);
  return res;
});
