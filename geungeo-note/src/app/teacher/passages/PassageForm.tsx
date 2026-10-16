"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";
import type { Genre, RightsKind } from "@/lib/types";

const RIGHTS_OPTIONS: { value: RightsKind; label: string; placeholder: string }[] = [
  { value: "original", label: "직접 작성한 글", placeholder: "예: 본인 작성 (2026.10)" },
  { value: "public_domain", label: "저작권 보호기간이 끝난 작품", placeholder: "예: 김소월(1902~1934), 『진달래꽃』(1925)" },
  { value: "licensed", label: "이용 허락을 받은 작품", placeholder: "예: ○○출판사 이용허락 2026-123" },
];

export function PassageForm() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", author: "", genre: "독서" as Genre, text: "", rightsKind: "original" as RightsKind, rightsNote: "" });
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const rights = RIGHTS_OPTIONS.find((r) => r.value === form.rightsKind)!;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          const { id } = await postJson<{ id: string }>("/api/passages", { ...form, confirm });
          router.push(`/teacher/generate?passageId=${id}`);
        } catch (err) {
          setError((err as Error).message);
          setPending(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input className={input} placeholder="제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className={input} placeholder="지은이 / 작성자" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
      </div>
      <select className={input} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value as Genre })}>
        <option value="독서">독서(비문학)</option>
        <option value="문학">문학</option>
      </select>
      <textarea
        className={`${input} min-h-48 leading-relaxed`}
        placeholder="지문을 붙여 넣으세요. 줄바꿈(시의 행·연, 문단)은 그대로 유지됩니다."
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        required
      />
      <fieldset className="space-y-2 rounded-lg border border-line p-3">
        <legend className="px-1 text-sm font-semibold">이용 권리 근거</legend>
        {RIGHTS_OPTIONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="rights" checked={form.rightsKind === r.value} onChange={() => setForm({ ...form, rightsKind: r.value })} />
            {r.label}
          </label>
        ))}
        <input className={input} placeholder={rights.placeholder} value={form.rightsNote} onChange={(e) => setForm({ ...form, rightsNote: e.target.value })} required />
      </fieldset>
      <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-warning-ink">
        <input type="checkbox" className="mt-0.5" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        <span>
          이 지문을 수업 자료로 이용할 권리가 있음을 확인합니다. 교과서·EBS 교재·모의고사·시판 문제집 지문은 저작권자의
          허락 없이 등록할 수 없으며, 등록한 지문은 제 계정과 제 반 학생에게만 사용됩니다.
        </span>
      </label>
      {error && <p className="text-sm text-critical-ink">{error}</p>}
      <button type="submit" className={`${btn.primary} w-full`} disabled={pending || !confirm}>
        {pending ? "등록 중…" : "등록하고 문항 만들기"}
      </button>
    </form>
  );
}
