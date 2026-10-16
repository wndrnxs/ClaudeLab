"use client";

import { Check, ListTree, Pencil, RefreshCw, Shuffle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AnswerExplanation, ChoiceNum, QuestionStem } from "@/components/QuestionParts";
import { SkillBadge, VerificationBadge } from "@/components/badges";
import { btn } from "@/components/ui";
import { difficultyText } from "@/lib/difficulty";
import type { Question } from "@/lib/types";

const STATUS_BAR: Record<Question["verification"]["status"], string> = {
  passed: "border-l-correct",
  flagged: "border-l-wrong",
  edited: "border-l-caution",
  unverified: "border-l-line-strong",
};

const ic = "h-4 w-4";

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
  const lockedHint = locked ? "변경 사항을 먼저 저장해 주세요." : undefined;

  return (
    <article
      className={`rounded-lg border border-l-4 bg-surface p-5 sm:p-6 ${STATUS_BAR[v.status]} ${selected ? "border-primary outline outline-1 outline-primary" : "border-line"}`}
      onClick={onSelect}
    >
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <VerificationBadge v={v} />
        <SkillBadge skill={q.skill} />
        <span className="text-[13px] text-ink-3">
          {q.type === "ox" ? "OX" : "5지선다"} · {difficultyText(q.difficulty)}
        </span>
      </header>

      <QuestionStem q={q} number={number} />

      <ol className="mt-4 space-y-1">
        {q.choices.map((c, i) => {
          const isAnswer = i === q.answerIndex;
          const solverPick = v.solverAnswerIndex === i && !isAnswer;
          return (
            <li
              key={i}
              className={`flex gap-3 rounded-md px-3 py-1.5 text-[15px] leading-relaxed ${
                isAnswer ? "bg-correct-tint text-correct" : solverPick ? "bg-wrong-tint text-wrong" : ""
              }`}
            >
              <ChoiceNum type={q.type} index={i} />
              <span className="flex-1">
                <span className={isAnswer ? "font-semibold" : ""}>{q.type === "ox" ? (i === 0 ? "맞다" : "틀리다") : c}</span>
                {showNotes && q.choiceNotes[i] && <span className="mt-0.5 block text-[13px] text-ink-2">{q.choiceNotes[i]}</span>}
              </span>
              {isAnswer && <span className="shrink-0 text-[13px] font-semibold">정답</span>}
              {solverPick && <span className="shrink-0 text-[13px] font-semibold">AI 풀이 선택</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm leading-relaxed">
        <AnswerExplanation q={q} />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span className="text-[13px] font-semibold text-ink-2">근거 문장</span>
        {q.evidence.length === 0 ? (
          <span className="text-wrong">없음</span>
        ) : (
          q.evidence.map((e, i) => (
            <mark key={i} className="evidence font-serif">
              {e}
            </mark>
          ))
        )}
        {q.evidence.length > 0 && (
          <span className={`inline-flex items-center gap-1 text-[13px] ${v.evidenceFound ? "text-correct" : "text-wrong"}`}>
            {v.evidenceFound ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
            {v.evidenceFound ? "지문에서 확인" : "지문에서 찾지 못함"}
          </span>
        )}
      </div>

      {v.issues.length > 0 && (
        <ul
          className={`mt-4 list-disc space-y-1 rounded-md border py-3 pr-4 pl-8 text-sm leading-relaxed ${
            v.status === "flagged" ? "border-[#efc2bd] bg-wrong-tint text-wrong" : "border-[#f0d58a] bg-caution-tint text-caution"
          }`}
        >
          {v.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={btn.ghost} onClick={onEdit} disabled={!!busy}>
          <Pencil className={ic} aria-hidden />
          편집
        </button>
        <button type="button" className={btn.ghost} onClick={onVerify} disabled={!!busy || locked} title={lockedHint}>
          <RefreshCw className={`${ic} ${busy === `verify:${q.id}` ? "animate-spin" : ""}`} aria-hidden />
          {busy === `verify:${q.id}` ? "검증하는 중" : "재검증"}
        </button>
        <button type="button" className={btn.ghost} onClick={onRegenerate} disabled={!!busy || locked} title={lockedHint}>
          <Shuffle className={ic} aria-hidden />
          {busy === `regen:${q.id}` ? "다시 만드는 중" : "다시 만들기"}
        </button>
        <button type="button" className={btn.ghost} onClick={() => setShowNotes((s) => !s)} aria-pressed={showNotes}>
          <ListTree className={ic} aria-hidden />
          선지별 근거
        </button>
        <button type="button" className={`${btn.danger} ml-auto`} onClick={onDelete} disabled={!!busy}>
          <Trash2 className={ic} aria-hidden />
          삭제
        </button>
      </footer>
    </article>
  );
}
