import { json, route } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session-cookie";

export const POST = route(async () => {
  const res = json({ redirect: "/login" });
  clearSessionCookie(res);
  return res;
});
