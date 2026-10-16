import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceBadge, SkillBadge } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { AnswerExplanation, QuestionStem } from "@/components/QuestionParts";
import { Bar, PageTitle, Panel, SummaryStrip, Tag, btn, formatDate, pct } from "@/components/ui";
import { assignmentStats, rate, weakestSkill } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { choiceLabel } from "@/lib/grading";
import { SKILLS, skillLabel } from "@/lib/skills";
import { InsightsButton } from "./InsightsButton";

export default async function AssignmentStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const db = await readDb();
  const assignment = db.assignments.find((a) => a.id === id && a.teacherId === teacher.id);
  if (!assignment) notFound();
  const passage = db.passages.find((p) => p.id === assignment.passageId);
  const cls = db.classes.find((c) => c.id === assignment.classId);
  const stats = assignmentStats(db, assignment);
  const insights = assignment.insights;
  const insightFor = (qid: string) => insights?.questions.find((x) => x.questionId === qid);

  const answered = stats.questions.filter((q) => q.correctRate !== null);
  const hardest = answered.length
    ? answered.reduce((min, q) => ((q.correctRate ?? 1) < (min.correctRate ?? 1) ? q : min))
    : null;
  const totalSureWrong = stats.questions.reduce((sum, q) => sum + q.sureButWrong, 0);
  const weak = weakestSkill(stats.skill);
  const notSubmitted = stats.classSize - stats.submittedCount;

  return (
    <>
      <PageTitle
        eyebrow={`과제 통계 · ${cls?.name ?? ""} · ${assignment.dueAt ? `${formatDate(assignment.dueAt)} 마감` : "마감 없음"}`}
        title={assignment.title}
        action={
          <Link href={`/teacher/sets/${assignment.setId}`} className={btn.secondary}>
            원본 문항 세트
          </Link>
        }
      />

      <div className="mb-6">
        <SummaryStrip
          items={[
            { label: "제출", value: `${stats.submittedCount} / ${stats.classSize}`, sub: notSubmitted ? `${notSubmitted}명 미제출` : "모두 제출" },
            { label: "평균 정답률", value: pct(stats.averageRate), sub: `${assignment.items.length}문항` },
            {
              label: "가장 어려운 문항",
              value: hardest ? `${hardest.number}번` : "–",
              sub: hardest ? `정답률 ${pct(hardest.correctRate)} · ${skillLabel(hardest.question.skill)}` : undefined,
            },
            {
              label: "확신했지만 틀린 응답",
              value: totalSureWrong,
              sub: totalSureWrong ? "오개념 신호 · 아래 문항별 이유 확인" : "없음",
              tone: totalSureWrong ? "wrong" : "default",
            },
          ]}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="문항별 정답률" bodyClassName="space-y-3 p-5">
          {stats.questions.map((q) => (
            <Bar
              key={q.question.id}
              label={`${q.number}번 ${skillLabel(q.question.skill)}`}
              value={q.correctRate}
              detail={`${q.number}번: ${q.responses}명 중 ${q.correct}명 정답`}
            />
          ))}
        </Panel>
        <Panel title="평가 요소별 정답률" bodyClassName="p-5">
          <div className="space-y-3">
            {SKILLS.filter((s) => stats.skill[s.id].total > 0).map((s) => (
              <Bar
                key={s.id}
                label={s.label}
                value={rate(stats.skill[s.id])}
                color={s.id === weak ? "var(--color-wrong)" : undefined}
                detail={`${s.label}: 응답 ${stats.skill[s.id].total}개 중 ${stats.skill[s.id].correct}개 정답`}
              />
            ))}
          </div>
          {weak && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm">
                가장 약한 영역 <b className="text-wrong">{skillLabel(weak)}</b>
              </span>
              <Link href={`/teacher/generate?passageId=${assignment.passageId}&focusSkill=${weak}`} className={btn.secondary}>
                이 영역 복습 세트 만들기
              </Link>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        className="mb-6"
        title="오답 이유 분석"
        action={<InsightsButton assignmentId={assignment.id} hasInsights={!!insights} disabled={stats.submittedCount === 0} />}
      >
        {insights ? (
          <p className="text-sm text-ink-2">
            {insights.source === "claude" ? "Claude 분석" : "규칙 기반 분석(데모)"} · 제출 {insights.submissionCount}건 기준 ·{" "}
            {formatDate(insights.generatedAt)}. 문항별 결과는 아래 각 문항에 붙어 있습니다.
          </p>
        ) : (
          <p className="text-sm text-ink-2">
            학생들이 오답을 고르며 적은 이유를 모아 문항별 오개념과 수업에서 짚을 점으로 정리합니다. 학생 이름은 분석에 보내지 않습니다.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-8">
        <div className="lg:sticky lg:top-6 lg:h-fit">{passage && <PassageView passage={passage} />}</div>
        <div className="space-y-5">
          {stats.questions.map((qs) => {
            const q = qs.question;
            const insight = insightFor(q.id);
            return (
              <article key={q.id} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
                <header className="mb-3 flex flex-wrap items-center gap-2">
                  <SkillBadge skill={q.skill} />
                  <span className="text-[13px] text-ink-3">난이도 {q.difficulty}</span>
                  <span className="ml-auto text-sm text-ink-2">
                    정답률 <b className="text-ink tabular-nums">{pct(qs.correctRate)}</b>
                    <span className="text-ink-3 tabular-nums"> ({qs.correct}/{qs.responses})</span>
                  </span>
                </header>
                <QuestionStem q={q} number={qs.number} className="font-serif text-[16px] font-bold leading-relaxed" />

                <div className="mt-4 space-y-2.5">
                  {qs.choices.map((c) => (
                    <div key={c.index}>
                      <Bar
                        labelWidth="6.5rem"
                        label={
                          <span className={c.isAnswer ? "font-semibold text-correct" : ""}>
                            {choiceLabel(q, c.index)} {c.isAnswer ? "정답" : ""} {c.count}명
                          </span>
                        }
                        value={qs.responses ? c.count / qs.responses : 0}
                        color={c.isAnswer ? "var(--color-correct)" : "var(--color-line-strong)"}
                        detail={q.type === "mcq" ? q.choices[c.index] : c.index === 0 ? "O (맞다)" : "X (틀리다)"}
                      />
                      {c.reasons.length > 0 && !c.isAnswer && (
                        <ul className="mt-1.5 mb-1 ml-[7.25rem] space-y-1">
                          {c.reasons.map((r) => (
                            <li key={r.studentId} className="flex flex-wrap items-center gap-1.5 text-[13px]">
                              <span className="font-semibold">{r.studentName}</span>
                              <ConfidenceBadge c={r.confidence} />
                              <span className="text-ink-2">{r.reason || "이유 없음"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {(qs.sureButWrong > 0 || qs.guessedRight > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {qs.sureButWrong > 0 && <Tag tone="wrong">확신했지만 틀림 {qs.sureButWrong}명</Tag>}
                    {qs.guessedRight > 0 && <Tag tone="caution">찍어서 맞힘 {qs.guessedRight}명</Tag>}
                  </div>
                )}

                {insight && (
                  <div className="mt-4 border-l-4 border-primary bg-paper px-4 py-3 text-sm leading-relaxed">
                    <div className="mb-1 text-[13px] font-semibold text-primary">오답 이유 분석</div>
                    <p>{insight.summary}</p>
                    {insight.misconceptions.length > 0 && (
                      <ul className="mt-2 space-y-1 text-[13px] text-ink-2">
                        {insight.misconceptions.map((m, k) => (
                          <li key={k}>
                            <b className="text-ink">
                              {choiceLabel(q, m.choiceIndex)} {m.studentCount}명
                            </b>{" "}
                            {m.pattern}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-[13px]">
                      <b>수업에서 짚을 점</b> {insight.teachingTip}
                    </p>
                  </div>
                )}

                <details className="mt-4 text-sm text-ink-2">
                  <summary className="cursor-pointer font-semibold text-ink-2">해설과 근거</summary>
                  <div className="mt-2 leading-relaxed">
                    <AnswerExplanation q={q} compact />
                  </div>
                  {q.evidence.length > 0 && (
                    <p className="mt-2">
                      근거 <mark className="evidence font-serif">{q.evidence.join(" / ")}</mark>
                    </p>
                  )}
                </details>
              </article>
            );
          })}
        </div>
      </div>

      <Panel className="mt-6" title="학생별 결과" bodyClassName="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-sunken text-left text-[13px] text-ink-2">
            <tr>
              <th className="px-5 py-2.5 font-medium">학생</th>
              <th className="px-3 py-2.5 font-medium">제출일</th>
              <th className="px-3 py-2.5 text-right font-medium">점수</th>
              <th className="px-3 py-2.5 text-right font-medium">확신 오답</th>
              <th className="px-5 py-2.5 font-medium">틀린 영역</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {stats.students.map((row) => {
              const sub = row.submission;
              const sureWrong = sub
                ? sub.answers.filter((a) => {
                    const q = assignment.items.find((x) => x.id === a.questionId);
                    return q && a.confidence === "sure" && a.choiceIndex !== q.answerIndex;
                  }).length
                : 0;
              const weakSkills = SKILLS.filter((s) => row.skill[s.id].total > row.skill[s.id].correct).map((s) => s.label);
              return (
                <tr key={row.student.id} className="hover:bg-paper">
                  <td className="px-5 py-3">
                    <Link href={`/teacher/students/${row.student.id}`} className="font-semibold underline decoration-line-strong underline-offset-4">
                      {row.student.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-ink-2">{sub ? formatDate(sub.submittedAt) : <Tag tone="caution">미제출</Tag>}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{sub ? `${sub.correctCount} / ${sub.total}` : "–"}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${sureWrong ? "font-semibold text-wrong" : ""}`}>{sub ? sureWrong : "–"}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-2">{sub ? weakSkills.join(", ") || "없음" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
