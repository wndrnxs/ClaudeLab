"use client";

import { ChevronRight, RotateCcw } from "lucide-react";
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

  const row = (a: DemoAccount, title: string) => (
    <button
      key={a.id}
      type="button"
      disabled={!!pending}
      onClick={() => enter(a.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken disabled:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-[13px] text-ink-3">{a.hint}</span>
      </span>
      <span className="text-[13px] text-ink-2">{pending === a.id ? "들어가는 중" : <ChevronRight className="h-5 w-5" aria-hidden />}</span>
    </button>
  );

  const teacher = accounts.filter((a) => a.role === "teacher");
  const students = accounts.filter((a) => a.role === "student");

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-ink-2">선생님</h2>
        <div className="divide-y divide-line overflow-hidden rounded-md border border-line-strong">
          {teacher.map((a) => row(a, `${a.name} 선생님`))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-ink-2">학생 · 고2 국어 A반</h2>
        <div className="divide-y divide-line overflow-hidden rounded-md border border-line-strong">
          {students.map((a) => row(a, a.name))}
        </div>
      </section>
      {error && <p className="text-sm text-wrong">{error}</p>}
      <div className="border-t border-line pt-4 text-[13px] leading-relaxed text-ink-3">
        <p>{notice ?? "체험 데이터는 모든 체험자가 함께 씁니다. 서버가 다시 켜지면 처음 상태로 돌아갑니다."}</p>
        <button
          type="button"
          className="mt-1.5 inline-flex items-center gap-1 font-semibold text-ink-2 hover:text-ink disabled:opacity-50"
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
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          체험 데이터 초기화
        </button>
      </div>
    </div>
  );
}
