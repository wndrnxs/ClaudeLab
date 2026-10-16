"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONFIDENCE_LABEL } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";
import { CHOICE_MARKS } from "@/lib/grading";
import type { Confidence, Passage, QuestionType } from "@/lib/types";

interface PublicQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  choices: string[];
}

interface Draft {
  choiceIndex: number | null;
  confidence: Confidence | null;
  reason: string;
}

export function TakeAssignment({
  assignmentId,
  title,
  passage,
  items,
  requireReason,
}: {
  assignmentId: string;
  title: string;
  passage: Passage;
  items: PublicQuestion[];
  requireReason: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(items.map((q) => [q.id, { choiceIndex: null, confidence: null, reason: "" }])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = (d: Draft) =>
    d.choiceIndex !== null && d.confidence !== null && (!requireReason || d.reason.trim().length >= 2);
  const doneCount = items.filter((q) => isComplete(drafts[q.id])).length;
  const update = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-ink-2">
            답을 고른 뒤 얼마나 확신하는지, {requireReason ? "왜 그 답을 골랐는지 적어 주세요." : "(선택) 왜 그 답을 골랐는지 적어 주세요."}{" "}
            이유를 적어 두면 내가 어디서 헷갈리는지 정확히 분석할 수 있어요.
          </p>
        </div>
        <div className="text-sm font-semibold tabular-nums text-ink-2">
          {doneCount}/{items.length} 완료
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <PassageView passage={passage} />
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const missing = items.findIndex((q) => !isComplete(drafts[q.id]));
            if (missing !== -1) {
              setError(`${missing + 1}번 문항의 답·확신도${requireReason ? "·이유" : ""}를 모두 입력해 주세요.`);
              document.getElementById(`q-${items[missing].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
            if (!window.confirm("제출할까요? 제출한 뒤에는 답을 바꿀 수 없어요.")) return;
            setPending(true);
            setError(null);
            try {
              await postJson(`/api/assignments/${assignmentId}/submit`, {
                answers: items.map((q) => ({
                  questionId: q.id,
                  choiceIndex: drafts[q.id].choiceIndex,
                  confidence: drafts[q.id].confidence,
                  reason: drafts[q.id].reason.trim(),
                })),
              });
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
              setPending(false);
            }
          }}
        >
          {items.map((q, i) => {
            const d = drafts[q.id];
            return (
              <fieldset key={q.id} id={`q-${q.id}`} className="rounded-xl border border-line bg-white p-4">
                <legend className="sr-only">{i + 1}번 문항</legend>
                <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed">
                  <span className="mr-1 font-bold">{i + 1}.</span>
                  {q.stem}
                </p>
                <div className={`mt-3 ${q.type === "ox" ? "grid grid-cols-2 gap-2" : "space-y-1.5"}`}>
                  {q.choices.map((c, idx) => (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                        d.choiceIndex === idx ? "border-brand-600 bg-brand-50 font-semibold" : "border-line hover:bg-canvas"
                      } ${q.type === "ox" ? "justify-center text-lg" : ""}`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`choice-${q.id}`}
                        checked={d.choiceIndex === idx}
                        onChange={() => update(q.id, { choiceIndex: idx })}
                      />
                      {q.type === "mcq" && <span className="w-5 shrink-0">{CHOICE_MARKS[idx]}</span>}
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-2">이 답에 얼마나 확신하나요?</span>
                  {(["sure", "unsure", "guess"] as Confidence[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update(q.id, { confidence: c })}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        d.confidence === c ? "border-brand-600 bg-brand-700 text-white" : "border-line bg-white text-ink-2"
                      }`}
                      aria-pressed={d.confidence === c}
                    >
                      {CONFIDENCE_LABEL[c]}
                    </button>
                  ))}
                </div>
                <textarea
                  className={`${input} mt-2 min-h-14 text-sm`}
                  placeholder={`왜 이 답을 골랐나요? 지문의 어느 부분을 보고 판단했는지 적어 보세요.${requireReason ? " (필수)" : ""}`}
                  value={d.reason}
                  maxLength={300}
                  onChange={(e) => update(q.id, { reason: e.target.value })}
                />
              </fieldset>
            );
          })}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-critical-ink">{error}</p>}
          <button type="submit" className={`${btn.primary} w-full !py-3 text-base`} disabled={pending}>
            {pending ? "제출 중…" : `제출하기 (${doneCount}/${items.length})`}
          </button>
        </form>
      </div>
    </>
  );
}
