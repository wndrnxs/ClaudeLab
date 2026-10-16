import { choiceLabel, choiceTopic } from "@/lib/grading";
import type { Question } from "@/lib/types";

/** 선지 번호. 화면에서는 원문자(①) 대신 잘 보이는 숫자 원을 씁니다. */
export function ChoiceNum({ type, index, className = "" }: { type: Question["type"]; index: number; className?: string }) {
  if (type === "ox") return <span className={`w-6 shrink-0 text-center font-bold ${className}`}>{index === 0 ? "O" : "X"}</span>;
  return (
    <span
      className={`mt-[0.15em] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-current text-[13px] font-semibold leading-none tabular-nums ${className}`}
      aria-label={`${index + 1}번`}
    >
      {index + 1}
    </span>
  );
}

/** <보기> 상자 */
export function BogiBox({ text, className = "" }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={`mt-3 border border-ink/45 bg-surface px-4 py-3 text-[15px] leading-[1.8] ${className}`}>
      <div className="mb-1 text-[13px] font-semibold text-ink-2">&lt;보기&gt;</div>
      <p className="whitespace-pre-wrap font-serif">{text}</p>
    </div>
  );
}

/** 발문 + <보기> */
export function QuestionStem({
  q,
  number,
  className = "font-serif text-[17px] font-bold leading-[1.65]",
}: {
  q: Pick<Question, "stem" | "bogi">;
  number?: number;
  className?: string;
}) {
  return (
    <>
      <p className={`whitespace-pre-wrap ${className}`}>
        {number !== undefined && <span className="mr-1.5 text-primary">{number}.</span>}
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
