"use client";

import { Highlighter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CONFIDENCE_LABEL, ResultMark, SkillBadge } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { AnswerExplanation, ChoiceNum, QuestionStem } from "@/components/QuestionParts";
import { Tag, btn } from "@/components/ui";
import type { Passage, Question, Submission } from "@/lib/types";

export function ResultView({
  title,
  passage,
  items,
  submission,
}: {
  title: string;
  passage: Passage;
  items: Question[];
  submission: Submission;
}) {
  const answers = new Map(submission.answers.map((a) => [a.questionId, a]));
  const firstWrong = items.find((q) => answers.get(q.id)?.choiceIndex !== q.answerIndex);
  const [selectedId, setSelectedId] = useState<string | null>(firstWrong?.id ?? items[0]?.id ?? null);
  const selected = items.find((q) => q.id === selectedId);
  const selectedNumber = items.findIndex((q) => q.id === selectedId) + 1;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[13px] text-ink-3">제출 결과</div>
          <h1 className="font-serif text-[24px] font-bold leading-tight sm:text-[28px]">{title}</h1>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <div className="text-[13px] text-ink-3">맞힌 문항</div>
            <div className="text-[32px] font-bold leading-none tabular-nums">
              {submission.correctCount}
              <span className="text-lg font-medium text-ink-3"> / {submission.total}</span>
            </div>
          </div>
          <Link href="/student/report" className={btn.secondary}>
            약점 분석 보기
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        <div id="result-passage" className="scroll-mt-24 lg:sticky lg:top-6 lg:h-fit">
          {selected && (
            <p className="mb-2 flex items-center gap-1.5 text-[13px] text-ink-2">
              <Highlighter className="h-4 w-4" aria-hidden />
              {selectedNumber}번 문항의 근거 문장을 표시했습니다.
            </p>
          )}
          <PassageView passage={passage} highlights={selected?.evidence ?? []} />
        </div>

        <div className="space-y-5">
          {items.map((q, i) => {
            const a = answers.get(q.id);
            const correct = a?.choiceIndex === q.answerIndex;
            const isSelected = selectedId === q.id;
            return (
              <article
                key={q.id}
                className={`rounded-lg border bg-surface p-5 sm:p-6 ${isSelected ? "border-primary" : "border-line"}`}
              >
                <header className="mb-3 flex flex-wrap items-center gap-2">
                  <ResultMark correct={correct} />
                  <SkillBadge skill={q.skill} />
                  {a && !correct && a.confidence === "sure" && <Tag tone="wrong">확신했지만 틀림</Tag>}
                </header>
                <QuestionStem q={q} number={i + 1} />

                <ol className="mt-4 space-y-1.5">
                  {q.choices.map((c, idx) => {
                    const isAnswer = idx === q.answerIndex;
                    const mine = a?.choiceIndex === idx;
                    return (
                      <li
                        key={idx}
                        className={`flex gap-3 rounded-md px-3 py-2 text-[15px] leading-relaxed ${
                          isAnswer ? "bg-correct-tint text-correct" : mine ? "bg-wrong-tint text-wrong" : "text-ink"
                        }`}
                      >
                        <ChoiceNum type={q.type} index={idx} />
                        <span className={`flex-1 ${isAnswer || mine ? "font-semibold" : ""}`}>
                          {q.type === "ox" ? (idx === 0 ? "맞다" : "틀리다") : c}
                        </span>
                        {isAnswer && <span className="shrink-0 text-[13px] font-semibold">정답</span>}
                        {mine && !isAnswer && <span className="shrink-0 text-[13px] font-semibold">내 답</span>}
                      </li>
                    );
                  })}
                </ol>

                {a && (
                  <dl className="mt-4 space-y-1 border-l-2 border-line-strong pl-3 text-sm">
                    <div>
                      <dt className="inline text-ink-3">내가 쓴 이유({CONFIDENCE_LABEL[a.confidence]}) </dt>
                      <dd className="inline text-ink">{a.reason || "적지 않음"}</dd>
                    </div>
                    {!correct && q.choiceNotes[a.choiceIndex] && (
                      <div className="text-wrong">
                        <dt className="inline">내 답이 틀린 이유 </dt>
                        <dd className="inline">{q.choiceNotes[a.choiceIndex]}</dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm leading-relaxed">
                  <AnswerExplanation q={q} />
                </div>

                {q.evidence.length > 0 && (
                  <button
                    type="button"
                    className={`${btn.ghost} mt-2 -ml-2.5`}
                    onClick={() => {
                      setSelectedId(q.id);
                      if (window.innerWidth < 1024) document.getElementById("result-passage")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Highlighter className="h-4 w-4" aria-hidden />
                    지문에서 근거 문장 보기
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
