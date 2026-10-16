import { choiceLabel, choiceTopic } from "@/lib/grading";
import type { Question } from "@/lib/types";

/** <보기> 상자 */
export function BogiBox({ text, className = "" }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={`mt-2 rounded-sm border border-ink/40 bg-white px-3 py-2 text-[14px] leading-relaxed ${className}`}>
      <div className="mb-1 text-xs font-semibold text-ink-2">&lt;보기&gt;</div>
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  );
}

/** 발문 + <보기> */
export function QuestionStem({
  q,
  number,
  className = "text-[15px] font-medium leading-relaxed",
}: {
  q: Pick<Question, "stem" | "bogi">;
  number?: number;
  className?: string;
}) {
  return (
    <>
      <p className={`whitespace-pre-wrap ${className}`}>
        {number !== undefined && <span className="mr-1 font-bold">{number}.</span>}
        {q.stem}
      </p>
      <BogiBox text={q.bogi} />
    </>
  );
}

/** 정답 · 해설 · 오답 풀이를 한 덩어리로 보여 줍니다. */
export function AnswerExplanation({ q, compact = false }: { q: Question; compact?: boolean }) {
  const wrongNotes = q.choices
    .map((_, i) => i)
    .filter((i) => i !== q.answerIndex && q.choiceNotes[i]?.trim());
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <p>
        <b>[정답] {choiceLabel(q, q.answerIndex)}</b> <b>[해설]</b> {q.explanation}
      </p>
      {wrongNotes.length > 0 && (
        <p>
          <b>[오답 풀이]</b>{" "}
          {wrongNotes.map((i) => (
            <span key={i}>
              {choiceTopic(q, i)} {q.choiceNotes[i]}{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
