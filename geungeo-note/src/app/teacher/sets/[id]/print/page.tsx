import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { choiceLabel } from "@/lib/grading";
import { skillLabel } from "@/lib/skills";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const withAnswers = (await searchParams).answers === "1";
  const db = await readDb();
  const set = db.sets.find((s) => s.id === id && s.teacherId === teacher.id);
  if (!set) notFound();
  const passage = db.passages.find((p) => p.id === set.passageId);
  if (!passage) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-[14px] leading-relaxed shadow-sm print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex items-center justify-between rounded-lg bg-canvas px-4 py-2 text-sm">
        <span>{withAnswers ? "교사용(정답·해설 포함)" : "학생용"} 인쇄 화면입니다. PDF로 저장하려면 인쇄 대상에서 &lsquo;PDF로 저장&rsquo;을 고르세요.</span>
        <PrintButton />
      </div>
      <header className="mb-4 border-b-2 border-ink pb-2">
        <h1 className="text-xl font-bold">{set.title}</h1>
        <p className="text-xs text-ink-2">
          {passage.title} · {passage.author} · {set.items.length}문항 {withAnswers && "· 교사용"}
        </p>
      </header>
      <section className="print-break mb-6 rounded border border-ink/40 p-4">
        <div className="passage-text">{passage.text}</div>
      </section>
      <ol className="space-y-5">
        {set.items.map((q, i) => (
          <li key={q.id} className="print-break">
            <p className="whitespace-pre-wrap font-semibold">
              {i + 1}. {q.stem} {q.type === "ox" && <span className="font-normal">( O / X )</span>}
            </p>
            {q.type === "mcq" && (
              <ol className="mt-1 space-y-0.5 pl-2">
                {q.choices.map((c, j) => (
                  <li key={j} className={withAnswers && j === q.answerIndex ? "font-bold underline" : ""}>
                    {choiceLabel(q, j)} {c}
                  </li>
                ))}
              </ol>
            )}
            {withAnswers && (
              <div className="mt-2 rounded bg-canvas p-2 text-[13px] print:bg-transparent print:p-0">
                <b>정답 {choiceLabel(q, q.answerIndex)}</b> · {skillLabel(q.skill)} · 난이도 {q.difficulty}
                <br />
                {q.explanation}
                {q.evidence.length > 0 && <div className="text-ink-2">근거: “{q.evidence.join("” / “")}”</div>}
              </div>
            )}
          </li>
        ))}
      </ol>
      <footer className="mt-8 border-t border-line pt-2 text-[11px] text-ink-3">
        지문 출처: {passage.title}, {passage.author} — {passage.rights.note}
      </footer>
    </div>
  );
}
