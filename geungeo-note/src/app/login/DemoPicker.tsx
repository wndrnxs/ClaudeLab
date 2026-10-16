"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";

export interface DemoAccount {
  id: string;
  name: string;
  role: "teacher" | "student";
  hint: string;
}

export function DemoPicker({ accounts }: { accounts: DemoAccount[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function enter(id: string) {
    setPending(id);
    setError(null);
    try {
      const { redirect } = await postJson<{ redirect: string }>("/api/demo/login", { userId: id });
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    }
  }

  const teacher = accounts.filter((a) => a.role === "teacher");
  const students = accounts.filter((a) => a.role === "student");

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold text-ink-2">선생님으로 체험</div>
        {teacher.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={!!pending}
            onClick={() => enter(a.id)}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-4 text-left hover:bg-brand-100 disabled:opacity-60"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-700 font-bold text-white">선</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{a.name} 선생님</span>
              <span className="block text-xs text-ink-2">{a.hint}</span>
            </span>
            <span className="text-sm font-semibold text-brand-800">{pending === a.id ? "입장 중…" : "입장 →"}</span>
          </button>
        ))}
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold text-ink-2">학생으로 체험</div>
        <div className="grid gap-2">
          {students.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!!pending}
              onClick={() => enter(a.id)}
              className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left hover:bg-canvas disabled:opacity-60"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-800">
                {a.name.slice(-2, -1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{a.name}</span>
                <span className="block text-xs text-ink-3">{a.hint}</span>
              </span>
              <span className="text-xs font-semibold text-ink-2">{pending === a.id ? "입장 중…" : "입장 →"}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-critical-ink">{error}</p>}
      <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-xs text-ink-2">
        <span>{notice ?? "체험 중 바꾼 내용은 모든 체험자에게 함께 보이며, 서버가 쉬었다 깨어나면 처음 상태로 돌아갑니다."}</span>
        <button
          type="button"
          className="shrink-0 font-semibold text-brand-700 hover:underline disabled:opacity-50"
          disabled={!!pending}
          onClick={async () => {
            if (!window.confirm("체험 데이터를 처음 상태로 되돌릴까요? 만든 문항과 제출 기록이 모두 지워집니다.")) return;
            setPending("reset");
            try {
              await postJson("/api/demo/reset");
              setNotice("체험 데이터를 초기화했습니다.");
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setPending(null);
            }
          }}
        >
          체험 데이터 초기화
        </button>
      </div>
    </div>
  );
}
