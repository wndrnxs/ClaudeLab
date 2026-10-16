import { z } from "zod";
import { HttpError } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/api";
import { readDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session-cookie";

const Body = z.object({
  loginId: z.string().trim().min(1, "아이디를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const POST = route(async (req) => {
  const { loginId, password } = await parseBody(req, Body);
  const db = await readDb();
  const user = db.users.find((u) => u.loginId === loginId);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  const res = json({ redirect: user.role === "teacher" ? "/teacher" : "/student" });
  setSessionCookie(res, user.id);
  return res;
});
