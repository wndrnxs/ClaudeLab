"use client";

import { useState } from "react";
import { btn, input, textarea } from "@/components/ui";
import { CHOICE_MARKS } from "@/lib/grading";
import { SKILLS } from "@/lib/skills";
import { DIFFICULTIES, type Difficulty, difficultyText } from "@/lib/difficulty";
import type { Question, SkillId } from "@/lib/types";

export function QuestionEditForm({
  q,
  number,
  onDone,
  onCancel,
}: {
  q: Question;
  number: number;
  onDone: (q: Question) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Question>(structuredClone(q));
  const [evidenceText, setEvidenceText] = useState(q.evidence.join("\n"));
  const update = (patch: Partial<Question>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <article className="rounded-lg border-2 border-primary bg-surface p-4">
      <h3 className="mb-3 font-bold">{number}번 문항 편집</h3>
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block font-semibold">발문</span>
          <textarea className={`${textarea} min-h-20`} value={draft.stem} onChange={(e) => update({ stem: e.target.value })} />
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">&lt;보기&gt; (선택)</span>
          <textarea
            className={`${textarea} min-h-16`}
            placeholder="<보기>가 필요한 문항이면 내용을 적으세요. 비워 두면 <보기> 없이 출제됩니다."
            value={draft.bogi ?? ""}
            onChange={(e) => update({ bogi: e.target.value })}
          />
        </label>

        <fieldset>
          <legend className="mb-1 font-semibold">선지 · 정답 · 선지별 근거</legend>
          <div className="space-y-2">
            {draft.choices.map((c, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr] items-start gap-2">
                <label className="flex items-center gap-1 pt-2">
                  <input type="radio" name={`answer-${q.id}`} checked={draft.answerIndex === i} onChange={() => update({ answerIndex: i })} />
                  <span className="w-4">{draft.type === "ox" ? c : CHOICE_MARKS[i]}</span>
                </label>
                <div className="space-y-1">
                  {draft.type === "mcq" && (
                    <input
                      className={input}
                      value={c}
                      onChange={(e) => update({ choices: draft.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                    />
                  )}
                  <input
                    className={`${input} text-xs`}
                    placeholder="이 선지가 맞거나 틀린 이유"
                    value={draft.choiceNotes[i] ?? ""}
                    onChange={(e) =>
                      update({ choiceNotes: draft.choices.map((_, j) => (j === i ? e.target.value : (draft.choiceNotes[j] ?? ""))) })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-3">왼쪽 동그라미로 정답을 고릅니다.</p>
        </fieldset>

        <label className="block">
          <span className="mb-1 block font-semibold">해설</span>
          <textarea className={`${textarea} min-h-16`} value={draft.explanation} onChange={(e) => update({ explanation: e.target.value })} />
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">근거 문장 (한 줄에 하나, 지문에서 그대로 복사)</span>
          <textarea className={`${textarea} min-h-16`} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-semibold">평가 요소</span>
            <select className={input} value={draft.skill} onChange={(e) => update({ skill: e.target.value as SkillId })}>
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">난이도</span>
            <select className={input} value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value as Difficulty })}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {difficultyText(d)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={btn.secondary} onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className={btn.primary}
          onClick={() =>
            onDone({
              ...draft,
              evidence: evidenceText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          편집 완료
        </button>
      </div>
    </article>
  );
}
