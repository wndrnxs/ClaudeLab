"use client";

import { useState } from "react";
import { SkillBadge, VerificationBadge } from "@/components/badges";
import { btn } from "@/components/ui";
import { choiceLabel } from "@/lib/grading";
import type { Question } from "@/lib/types";

export function QuestionCard({
  q,
  number,
  selected,
  busy,
  locked,
  onSelect,
  onEdit,
  onVerify,
  onRegenerate,
  onDelete,
}: {
  q: Question;
  number: number;
  selected: boolean;
  busy: string | null;
  /** 저장하지 않은 수정 사항이 있으면 서버 작업(재검증·다시 만들기)을 막습니다. */
  locked: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const v = q.verification;

  return (
    <article
      className={`rounded-xl border bg-white p-4 transition ${selected ? "border-brand-600 ring-2 ring-brand-100" : "border-line"}`}
      onClick={onSelect}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold tabular-nums">{number}.</span>
        <span className="rounded bg-canvas px-1.5 py-0.5 text-xs font-medium text-ink-2">{q.type === "ox" ? "OX" : "5지선다"}</span>
        <SkillBadge skill={q.skill} />
        <span className="text-xs text-ink-3">난이도 {q.difficulty}</span>
        <span className="ml-auto">
          <VerificationBadge v={v} />
        </span>
      </header>

      <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed">{q.stem}</p>

      <ol className="mt-3 space-y-1.5">
        {q.choices.map((c, i) => {
          const isAnswer = i === q.answerIndex;
          const solverPick = v.solverAnswerIndex === i && !isAnswer;
          return (
            <li
              key={i}
              className={`flex gap-2 rounded-md px-2 py-1 text-sm ${isAnswer ? "bg-green-50 font-semibold text-good-ink" : solverPick ? "bg-red-50" : ""}`}
            >
              <span className="w-5 shrink-0">{choiceLabel(q, i)}</span>
              <span className="flex-1">
                {q.type === "ox" ? (i === 0 ? "맞다" : "틀리다") : c}
                {isAnswer && <span className="ml-1 text-xs">(정답)</span>}
                {solverPick && <span className="ml-1 text-xs font-semibold text-critical-ink">(AI 풀이 선택)</span>}
                {showNotes && q.choiceNotes[i] && <span className="mt-0.5 block text-xs font-normal text-ink-2">→ {q.choiceNotes[i]}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm leading-relaxed">
        <span className="font-semibold">해설</span> {q.explanation}
      </div>

      <div className="mt-2 text-xs text-ink-2">
        <span className="font-semibold">근거 문장</span>{" "}
        {q.evidence.length === 0 ? (
          <span className="text-critical-ink">없음</span>
        ) : (
          q.evidence.map((e, i) => (
            <span key={i} className="mr-1.5 inline-block rounded bg-[#fff6d6] px-1.5 py-0.5 text-ink">
              “{e}”
            </span>
          ))
        )}
        {q.evidence.length > 0 && (
          <span className={v.evidenceFound ? "text-good-ink" : "text-critical-ink"}>
            {v.evidenceFound ? " ✓ 지문에서 확인" : " ✕ 지문에서 찾지 못함"}
          </span>
        )}
      </div>

      {v.issues.length > 0 && (
        <ul
          className={`mt-3 space-y-1 rounded-lg px-3 py-2 text-xs leading-relaxed ${
            v.status === "flagged" ? "bg-red-50 text-critical-ink" : "bg-amber-50 text-warning-ink"
          }`}
        >
          {v.issues.map((issue, i) => (
            <li key={i}>• {issue}</li>
          ))}
        </ul>
      )}

      <footer className="mt-3 flex flex-wrap gap-1 border-t border-line pt-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={btn.ghost} onClick={() => setShowNotes((s) => !s)}>
          {showNotes ? "선지별 근거 숨기기" : "선지별 근거 보기"}
        </button>
        <button type="button" className={btn.ghost} onClick={onEdit} disabled={!!busy}>
          ✎ 편집
        </button>
        <button type="button" className={btn.ghost} onClick={onVerify} disabled={!!busy || locked} title={locked ? "먼저 변경 사항을 저장해 주세요." : undefined}>
          {busy === `verify:${q.id}` ? "검증 중…" : "↻ 재검증"}
        </button>
        <button type="button" className={btn.ghost} onClick={onRegenerate} disabled={!!busy || locked} title={locked ? "먼저 변경 사항을 저장해 주세요." : undefined}>
          {busy === `regen:${q.id}` ? "다시 만드는 중…" : "⟳ 이 문항 다시 만들기"}
        </button>
        <button type="button" className={`${btn.danger} ml-auto`} onClick={onDelete} disabled={!!busy}>
          삭제
        </button>
      </footer>
    </article>
  );
}
