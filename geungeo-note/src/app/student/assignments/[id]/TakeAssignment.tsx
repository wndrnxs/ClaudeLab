"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONFIDENCE_LABEL } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { ChoiceNum, QuestionStem } from "@/components/QuestionParts";
import { btn, textarea } from "@/components/ui";
import { postJson } from "@/lib/client";
import type { Confidence, Passage, QuestionType } from "@/lib/types";

interface PublicQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  bogi?: string;
  choices: string[];
}

interface Draft {
  choiceIndex: number | null;
  confidence: Confidence | null;
  reason: string;
}

/**
 * 문제 풀이 화면
 * - 넓은 화면: 왼쪽에 지문을 고정하고 오른쪽에 모든 문항을 나열합니다.
 * - 좁은 화면: 한 번에 한 문항씩 보여 주고, 아래 고정 바로 이전·다음 문항을 오갑니다.
 */
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
  const [current, setCurrent] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = (d: Draft) =>
    d.choiceIndex !== null && d.confidence !== null && (!requireReason || d.reason.trim().length >= 2);
  const doneCount = items.filter((q) => isComplete(drafts[q.id])).length;
  const update = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const go = (i: number) => {
    setCurrent(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const isLast = current === items.length - 1;

  return (
    <div className="pb-28 lg:pb-0">
      <div className="mb-6">
        <div className="mb-1 text-[13px] text-ink-3">
          {passage.title} · {items.length}문항
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-[24px] font-bold leading-tight sm:text-[28px]">{title}</h1>
          <span className="text-sm font-semibold tabular-nums text-ink-2">
            {doneCount} / {items.length} 완료
          </span>
        </div>
        <div className="mt-3 h-1 rounded-full bg-sunken">
          <div className="h-1 rounded-full bg-primary transition-[width]" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
        <p className="mt-3 text-[13px] text-ink-3">
          문항마다 답, 확신 정도{requireReason ? ", 고른 이유" : ""}를 입력합니다. 이유는 오답 원인을 찾는 데 쓰입니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="lg:hidden">
            <PassageView passage={passage} collapsible />
          </div>
          <div className="hidden lg:block">
            <PassageView passage={passage} />
          </div>
        </div>

        <form
          id="answer-form"
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const missing = items.findIndex((q) => !isComplete(drafts[q.id]));
            if (missing !== -1) {
              setError(`${missing + 1}번 문항의 답, 확신 정도${requireReason ? ", 고른 이유" : ""}를 모두 입력해 주세요.`);
              setCurrent(missing);
              document.getElementById(`q-${items[missing].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
            if (!window.confirm("제출하면 답을 바꿀 수 없습니다. 제출할까요?")) return;
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
          {/* 좁은 화면: 문항 번호로 바로 이동 */}
          <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="문항 이동">
            {items.map((q, i) => {
              const done = isComplete(drafts[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === current ? "step" : undefined}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border text-sm font-semibold tabular-nums ${
                    i === current
                      ? "border-primary bg-primary text-white"
                      : done
                        ? "border-primary-tint bg-primary-tint text-primary"
                        : "border-line-strong bg-surface text-ink-2"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>

          {items.map((q, i) => {
            const d = drafts[q.id];
            return (
              <fieldset
                key={q.id}
                id={`q-${q.id}`}
                className={`rounded-lg border border-line bg-surface p-5 sm:p-6 ${i === current ? "" : "hidden"} lg:block`}
              >
                <legend className="sr-only">{i + 1}번 문항</legend>
                <QuestionStem q={q} number={i + 1} />

                <div className={`mt-4 ${q.type === "ox" ? "grid grid-cols-2 gap-2.5" : "space-y-2"}`}>
                  {q.choices.map((c, idx) => {
                    const selected = d.choiceIndex === idx;
                    return (
                      <label
                        key={idx}
                        className={`flex cursor-pointer gap-3 rounded-md px-4 py-3 text-[15px] leading-relaxed transition-colors ${
                          selected
                            ? "border-2 border-primary bg-primary-tint px-[15px] py-[11px] font-semibold text-primary"
                            : "border border-line-strong bg-surface hover:bg-paper"
                        } ${q.type === "ox" ? "items-center justify-center text-xl font-bold" : "items-start"}`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={`choice-${q.id}`}
                          checked={selected}
                          onChange={() => update(q.id, { choiceIndex: idx })}
                        />
                        {q.type === "mcq" && <ChoiceNum type={q.type} index={idx} />}
                        <span>{c}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-[13px] font-semibold text-ink-2">이 답에 얼마나 확신하나요?</div>
                  <div className="grid grid-cols-3 overflow-hidden rounded-md border border-line-strong" role="radiogroup">
                    {(["sure", "unsure", "guess"] as Confidence[]).map((c, k) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={d.confidence === c}
                        onClick={() => update(q.id, { confidence: c })}
                        className={`h-10 text-sm font-semibold ${k > 0 ? "border-l border-line-strong" : ""} ${
                          d.confidence === c ? "bg-primary text-white" : "bg-surface text-ink-2 hover:bg-paper"
                        }`}
                      >
                        {CONFIDENCE_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-[13px] font-semibold text-ink-2">
                    이 답을 고른 이유{requireReason ? "" : " (선택)"}
                  </span>
                  <textarea
                    className={`${textarea} min-h-[84px]`}
                    placeholder="지문의 어느 부분을 보고 판단했는지 적어 보세요."
                    value={d.reason}
                    maxLength={300}
                    onChange={(e) => update(q.id, { reason: e.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}

          {error && <p className="rounded-md border border-[#efc2bd] bg-wrong-tint px-4 py-3 text-sm text-wrong">{error}</p>}
          <button type="submit" className={`${btn.primary} hidden h-12 w-full text-base lg:flex`} disabled={pending}>
            {pending ? "제출하는 중" : `제출하기 (${doneCount} / ${items.length})`}
          </button>
        </form>
      </div>

      {/* 좁은 화면: 아래 고정 바 */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <button type="button" className={btn.secondary} disabled={current === 0} onClick={() => go(current - 1)}>
            이전
          </button>
          {isLast ? (
            <button type="submit" form="answer-form" className={`${btn.primary} flex-1`} disabled={pending}>
              {pending ? "제출하는 중" : `제출하기 (${doneCount} / ${items.length})`}
            </button>
          ) : (
            <button type="button" className={`${btn.primary} flex-1`} onClick={() => go(current + 1)}>
              다음 문항
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
