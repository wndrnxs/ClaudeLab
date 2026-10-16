"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";

export function CompositeForm({ passages }: { passages: { id: string; title: string; author: string }[] }) {
  const router = useRouter();
  const [a, setA] = useState(passages[0]?.id ?? "");
  const [b, setB] = useState(passages[1]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-8 shrink-0 font-bold">{label}</span>
      <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
        {passages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title} — {p.author}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          const { id } = await postJson<{ id: string }>("/api/passages/composite", { passageIds: [a, b] });
          router.push(`/teacher/generate?passageId=${id}`);
        } catch (err) {
          setError((err as Error).message);
          setPending(false);
        }
      }}
    >
      {select(a, setA, "(가)")}
      {select(b, setB, "(나)")}
      {error && <p className="text-sm text-critical-ink">{error}</p>}
      <button type="submit" className={`${btn.secondary} w-full`} disabled={pending || !a || !b || a === b}>
        {pending ? "묶는 중…" : "(가)(나) 복합 지문 만들고 문항 만들기"}
      </button>
      <p className="text-xs text-ink-3">두 작품을 비교하는 수능형 문항(예: &lsquo;(가)와 (나)의 공통점&rsquo;)을 만들 때 씁니다.</p>
    </form>
  );
}
