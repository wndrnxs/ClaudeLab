"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          const { redirect } = await postJson<{ redirect: string }>("/api/auth/login", { loginId, password });
          router.push(redirect);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
          setPending(false);
        }
      }}
    >
      <label className="block text-sm">
        <span className="mb-1 block font-medium">아이디</span>
        <input className={input} value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">비밀번호</span>
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="text-sm text-critical-ink">{error}</p>}
      <button type="submit" className={`${btn.primary} w-full`} disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
