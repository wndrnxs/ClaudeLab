"use client";

import Link from "next/link";
import { useState } from "react";
import { CONFIDENCE_LABEL, ResultMark, SkillBadge } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { AnswerExplanation, QuestionStem } from "@/components/QuestionParts";
import { btn } from "@/components/ui";
import { choiceLabel } from "@/lib/grading";
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

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title} 결과</h1>
          <p className="mt-1 text-sm text-ink-2">문항을 누르면 정답의 근거 문장이 지문에 노란색으로 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-ink-2">점수</div>
            <div className="text-3xl font-bold tabular-nums">
              {submission.correctCount}
              <span className="text-lg text-ink-3">/{submission.total}</span>
            </div>
          </div>
          <Link href="/student/report" className={btn.secondary}>
            약점 분석 보기
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <PassageView passage={passage} highlights={selected?.evidence ?? []} />
        </div>
        <div className="space-y-4">
          {items.map((q, i) => {
            const a = answers.get(q.id);
            const correct = a?.choiceIndex === q.answerIndex;
            return (
              <article
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                className={`cursor-pointer rounded-xl border bg-white p-4 ${
                  selectedId === q.id ? "border-brand-600 ring-2 ring-brand-100" : "border-line"
                }`}
              >
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{i + 1}.</span>
                  <ResultMark correct={correct} />
                  <SkillBadge skill={q.skill} />
                  {a && !correct && a.confidence === "sure" && (
                    <span className="text-xs font-semibold text-critical-ink">! 확신하고 틀렸어요 — 꼭 다시 보세요</span>
                  )}
                </header>
                <QuestionStem q={q} />
                <ol className="mt-2 space-y-1">
                  {q.choices.map((c, idx) => {
                    const isAnswer = idx === q.answerIndex;
                    const mine = a?.choiceIndex === idx;
                    return (
                      <li
                        key={idx}
                        className={`flex gap-2 rounded-md px-2 py-1 text-sm ${
                          isAnswer ? "bg-green-50 font-semibold text-good-ink" : mine ? "bg-red-50 text-critical-ink" : ""
                        }`}
                      >
                        <span className="w-5 shrink-0">{choiceLabel(q, idx)}</span>
                        <span className="flex-1">
                          {q.type === "ox" ? (idx === 0 ? "맞다" : "틀리다") : c}
                          {isAnswer && " (정답)"}
                          {mine && !isAnswer && " (내 답)"}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {a && (
                  <div className="mt-2 text-xs text-ink-2">
                    내가 쓴 이유 ({CONFIDENCE_LABEL[a.confidence]}): “{a.reason || "적지 않음"}”
                  </div>
                )}
                {!correct && a && q.choiceNotes[a.choiceIndex] && (
                  <div className="mt-1 text-xs text-critical-ink">→ 내 답이 틀린 이유: {q.choiceNotes[a.choiceIndex]}</div>
                )}
                <div className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm leading-relaxed">
                  <AnswerExplanation q={q} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
