import { z } from "zod";
import { HttpError } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session-cookie";
import type { User } from "@/lib/types";

const Body = z.object({
  role: z.enum(["teacher", "student"]),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(30),
  loginId: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{4,20}$/, "아이디는 영어 소문자·숫자·밑줄로 4~20자입니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(100),
  joinCode: z.string().trim().toUpperCase().optional(),
  agreePrivacy: z.literal(true, { error: "개인정보 수집·이용에 동의해 주세요." }),
});

export const POST = route(async (req) => {
  const body = await parseBody(req, Body);
  const user = await updateDb((db) => {
    if (db.users.some((u) => u.loginId === body.loginId)) {
      throw new HttpError(409, "이미 사용 중인 아이디입니다.");
    }
    let classIds: string[] = [];
    if (body.role === "student") {
      const cls = db.classes.find((c) => c.joinCode === body.joinCode);
      if (!cls) throw new HttpError(400, "반 참여 코드를 확인해 주세요. 선생님께 코드를 받아 입력합니다.");
      classIds = [cls.id];
    }
    const created: User = {
      id: newId("u"),
      role: body.role,
      name: body.name,
      loginId: body.loginId,
      passwordHash: hashPassword(body.password),
      classIds,
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });
  const res = json({ redirect: user.role === "teacher" ? "/teacher" : "/student" }, 201);
  setSessionCookie(res, user.id);
  return res;
});
