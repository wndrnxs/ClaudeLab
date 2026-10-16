"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";
import type { Role } from "@/lib/types";

export function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [form, setForm] = useState({ name: "", loginId: "", password: "", joinCode: "" });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          const { redirect } = await postJson<{ redirect: string }>("/api/auth/signup", {
            role,
            ...form,
            joinCode: role === "student" ? form.joinCode : undefined,
            agreePrivacy: agree,
          });
          router.push(redirect);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
          setPending(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-canvas p-1">
        {(["student", "teacher"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md py-2 text-sm font-semibold ${role === r ? "bg-white shadow-sm" : "text-ink-2"}`}
          >
            {r === "student" ? "학생" : "선생님"}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">이름</span>
        <input className={input} value={form.name} onChange={set("name")} required />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">아이디</span>
        <input className={input} value={form.loginId} onChange={set("loginId")} placeholder="영어 소문자·숫자 4~20자" required />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">비밀번호</span>
        <input className={input} type="password" value={form.password} onChange={set("password")} placeholder="8자 이상" required />
      </label>
      {role === "student" && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">반 참여 코드</span>
          <input className={`${input} uppercase`} value={form.joinCode} onChange={set("joinCode")} placeholder="선생님께 받은 6자리 코드 (데모: KOR2A1)" required />
        </label>
      )}
      <label className="flex items-start gap-2 rounded-lg bg-canvas p-3 text-xs leading-relaxed text-ink-2">
        <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          [필수] 개인정보 수집·이용 동의: 이름, 아이디, 학습 기록(답안·답을 고른 이유)을 수업 운영과 학습 분석 목적으로만
          이용합니다. 이메일·전화번호는 수집하지 않습니다.
          {role === "student" && " 만 14세 미만은 보호자 동의가 필요합니다(정식 서비스에서 보호자 동의 절차 추가 예정)."}
        </span>
      </label>
      {error && <p className="text-sm text-critical-ink">{error}</p>}
      <button type="submit" className={`${btn.primary} w-full`} disabled={pending}>
        {pending ? "가입 중…" : "가입하기"}
      </button>
    </form>
  );
}
