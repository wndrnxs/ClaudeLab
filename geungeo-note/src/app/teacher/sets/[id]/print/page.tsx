import Link from "next/link";
import { notFound } from "next/navigation";
import { PassageText, splitComposite } from "@/components/PassageView";
import { PrintButton } from "@/components/PrintButton";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { choiceLabel, choiceTopic } from "@/lib/grading";
import { skillLabel } from "@/lib/skills";
import type { Question } from "@/lib/types";

type Mode = "student" | "inline" | "end";

const MODES: { mode: Mode; label: string; query: string }[] = [
  { mode: "student", label: "학생용 (문제만)", query: "" },
  { mode: "inline", label: "교사용 (문항 아래 해설)", query: "?answers=inline" },
  { mode: "end", label: "교사용 (맨 뒤 정답·해설)", query: "?answers=end" },
];

/** 정답·해설·오답 풀이를 시험지 해설지처럼 한 문단으로 */
function ExplanationLine({ q, number }: { q: Question; number: number }) {
  const wrong = q.choices.map((_, i) => i).filter((i) => i !== q.answerIndex && q.choiceNotes[i]?.trim());
  return (
    <p className="text-justify text-[12.5px] leading-[1.65] text-[#b42318]">
      {number}) <b>[정답] {choiceLabel(q, q.answerIndex)}</b> <b>[해설]</b> {q.explanation}
      {wrong.length > 0 && (
        <>
          {" "}
          <b>[오답 풀이]</b> {wrong.map((i) => `${choiceTopic(q, i)} ${q.choiceNotes[i]}`).join(" ")}
        </>
      )}
      <span className="text-[#b42318]/70"> ({skillLabel(q.skill)} · 난이도 {q.difficulty})</span>
    </p>
  );
}

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const answers = (await searchParams).answers;
  const mode: Mode = answers === "end" ? "end" : answers === "inline" || answers === "1" ? "inline" : "student";
  const db = await readDb();
  const set = db.sets.find((s) => s.id === id && s.teacherId === teacher.id);
  if (!set) notFound();
  const passage = db.passages.find((p) => p.id === set.passageId);
  if (!passage) notFound();

  return (
    <div className="exam mx-auto max-w-[210mm] bg-white px-10 py-8 text-[14.5px] leading-[1.75] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <div className="no-print mb-6 space-y-2 rounded-lg bg-canvas p-3 font-sans text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {MODES.map((m) => (
            <Link
              key={m.mode}
              href={`/teacher/sets/${set.id}/print${m.query}`}
              className={`rounded-full px-3 py-1 font-semibold ${mode === m.mode ? "bg-brand-700 text-white" : "bg-white text-ink-2 ring-1 ring-line"}`}
            >
              {m.label}
            </Link>
          ))}
          <span className="ml-auto">
            <PrintButton />
          </span>
        </div>
        <p className="text-xs text-ink-2">PDF로 저장하려면 인쇄 창에서 대상(프린터)을 &lsquo;PDF로 저장&rsquo;으로 고르세요.</p>
      </div>

      <header className="mb-4 flex items-end justify-between border-b-[3px] border-ink pb-1.5">
        <h1 className="text-xl font-bold">{set.title}</h1>
        <p className="font-sans text-xs text-ink-2">
          {set.items.length}문항 {mode !== "student" && "· 교사용"} · 이름 ____________
        </p>
      </header>

      <section className="print-break mb-5 border border-ink/50 px-5 py-4">
        <p className="mb-2 font-sans text-xs text-ink-2">※ 다음 글을 읽고 물음에 답하시오.</p>
        <div className="exam-columns">
          {splitComposite(passage)?.map((part) => (
            // 작품 하나는 한 단 안에 두어 시가 두 단으로 갈라지지 않게 합니다.
            <div key={part.label} className="exam-item mb-3">
              <div className="passage-label">{part.label}</div>
              <div className="passage-text">{part.text}</div>
            </div>
          )) ?? <PassageText passage={passage} />}
        </div>
      </section>

      <ol className="exam-columns">
        {set.items.map((q, i) => (
          <li key={q.id} className="exam-item mb-6">
            <p className="text-justify">
              <span className="mr-1.5 text-[20px] font-extrabold italic">{i + 1}.</span>
              {q.stem}
              {q.type === "ox" && <span className="ml-1">( O / X )</span>}
            </p>
            {q.bogi && (
              <div className="my-2 border border-ink/60 px-3 py-2 text-[14px]">
                <div className="mb-0.5">&lt;보기&gt;</div>
                <p className="text-justify whitespace-pre-wrap">{q.bogi}</p>
              </div>
            )}
            {q.type === "mcq" && (
              <ol className="mt-1.5 space-y-1">
                {q.choices.map((c, j) => (
                  <li key={j} className="flex gap-1.5 text-justify">
                    <span className="shrink-0">{choiceLabel(q, j)}</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
            )}
            {mode === "inline" && (
              <div className="mt-2">
                <ExplanationLine q={q} number={i + 1} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {mode === "end" && (
        <section className="mt-8 break-before-page border-t-[3px] border-ink pt-3">
          <h2 className="mb-2 text-lg font-bold">정답 및 해설</h2>
          <table className="mb-4 w-full border-collapse text-center font-sans text-sm">
            <tbody>
              <tr>
                {set.items.map((q, i) => (
                  <td key={q.id} className="border border-ink/40 px-1 py-1">
                    <div className="text-xs text-ink-2">{i + 1}</div>
                    <div className="font-bold">{choiceLabel(q, q.answerIndex)}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="exam-columns">
            {set.items.map((q, i) => (
              <div key={q.id} className="exam-item mb-3">
                <ExplanationLine q={q} number={i + 1} />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-line pt-2 font-sans text-[11px] text-ink-3">
        지문 출처: {passage.rights.note}
      </footer>
    </div>
  );
}
