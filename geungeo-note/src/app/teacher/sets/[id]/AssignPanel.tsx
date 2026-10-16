"use client";

import Link from "next/link";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";
import type { ClassRoom } from "@/lib/types";

export function AssignPanel({
  setId,
  defaultTitle,
  classes,
  disabledReason,
}: {
  setId: string;
  defaultTitle: string;
  classes: ClassRoom[];
  disabledReason: string | null;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState(defaultTitle);
  const [due, setDue] = useState("");
  const [requireReason, setRequireReason] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  if (created) {
    return (
      <div className="rounded-lg bg-green-50 p-3 text-sm text-good-ink">
        ✓ 과제를 배포했습니다. 학생 화면의 &lsquo;내 과제&rsquo;에 바로 나타납니다.
        <div className="mt-2 flex gap-2">
          <Link href={`/teacher/assignments/${created}`} className={btn.secondary}>
            제출 현황·통계 보기
          </Link>
          <button type="button" className={btn.ghost} onClick={() => setCreated(null)}>
            다른 반에도 배포
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-2.5 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          const dueAt = due ? new Date(`${due}T23:59:00`).toISOString() : undefined;
          const { id } = await postJson<{ id: string }>("/api/assignments", { setId, classId, title, dueAt, requireReason });
          setCreated(id);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <select className={input} value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="과제 제목" />
      <label className="block">
        <span className="mb-1 block text-xs text-ink-2">마감일 (선택)</span>
        <input className={input} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-xs text-ink-2">
        <input type="checkbox" className="mt-0.5" checked={requireReason} onChange={(e) => setRequireReason(e.target.checked)} />
        <span>
          문항마다 <b>답을 고른 이유</b>를 쓰게 하기 (오답 원인 분석에 쓰여요)
        </span>
      </label>
      {error && <p className="text-critical-ink">{error}</p>}
      {disabledReason && <p className="text-xs text-warning-ink">{disabledReason}</p>}
      <button type="submit" className={`${btn.primary} w-full`} disabled={pending || !!disabledReason || !classId}>
        {pending ? "배포 중…" : "학생에게 배포"}
      </button>
    </form>
  );
}
