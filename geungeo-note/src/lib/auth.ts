import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDb } from "./db";
import { readSessionToken, SESSION_COOKIE } from "./session";
import type { Role, User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const userId = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const db = await readDb();
  return db.users.find((u) => u.id === userId) ?? null;
}

/** 페이지용: 역할이 맞지 않으면 로그인 화면이나 본인 홈으로 보냅니다. */
export async function requireRole(role: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(user.role === "teacher" ? "/teacher" : "/student");
  return user;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** API용: 역할이 맞지 않으면 401/403 오류를 던집니다. */
export async function requireApiRole(role: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "로그인이 필요합니다.");
  if (user.role !== role) throw new HttpError(403, "권한이 없습니다.");
  return user;
}
