import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceBadge, SkillBadge } from "@/components/badges";
import { PassageView } from "@/components/PassageView";
import { Bar, Card, PageTitle, SectionTitle, Stat, TextLink, btn, formatDate, pct } from "@/components/ui";
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

  return (
    <>
      <div className="mb-1 text-xs text-ink-3">
        <TextLink href="/teacher">대시보드</TextLink> / 과제 통계
      </div>
      <PageTitle
        title={assignment.title}
        sub={`${cls?.name ?? ""} · 마감 ${formatDate(assignment.dueAt)} · ${assignment.items.length}문항`}
        action={
          <Link href={`/teacher/sets/${assignment.setId}`} className={btn.secondary}>
            원본 문항 세트
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="제출" value={`${stats.submittedCount}/${stats.classSize}`} sub={stats.classSize - stats.submittedCount > 0 ? `${stats.classSize - stats.submittedCount}명 미제출` : "모두 제출"} />
        <Stat label="평균 정답률" value={pct(stats.averageRate)} />
        <Stat label="가장 어려운 문항" value={hardest ? `${hardest.number}번` : "–"} sub={hardest ? `정답률 ${pct(hardest.correctRate)}` : undefined} />
        <Stat label="확신했지만 틀린 응답" value={totalSureWrong} sub="오개념 신호 — 아래에서 이유를 확인하세요" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="막대에 마우스를 올리면 정답 인원을 볼 수 있어요.">문항별 정답률</SectionTitle>
          <div className="space-y-2.5">
            {stats.questions.map((q) => (
              <Bar
                key={q.question.id}
                label={`${q.number}번 · ${skillLabel(q.question.skill)}`}
                value={q.correctRate}
                detail={`${q.number}번: ${q.responses}명 중 ${q.correct}명 정답`}
              />
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle hint="이 과제에서 평가 요소별로 반 전체가 맞힌 비율입니다.">평가 요소별 정답률</SectionTitle>
          <div className="space-y-2.5">
            {SKILLS.filter((s) => stats.skill[s.id].total > 0).map((s) => (
              <Bar
                key={s.id}
                label={s.label}
                value={rate(stats.skill[s.id])}
                detail={`${s.label}: ${stats.skill[s.id].total}개 응답 중 ${stats.skill[s.id].correct}개 정답`}
              />
            ))}
          </div>
          {weak && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm">
              <span>
                가장 약한 영역은 <b>{skillLabel(weak)}</b>입니다.
              </span>
              <Link href={`/teacher/generate?passageId=${assignment.passageId}&focusSkill=${weak}`} className={`${btn.primary} !px-3 !py-1.5`}>
                이 영역 복습 세트 만들기
              </Link>
            </div>
          )}
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle hint="학생들이 오답을 고른 이유를 모아 공통된 오개념과 수업 팁으로 정리합니다. 학생 이름은 AI에 보내지 않아요.">
            오답 이유 분석
          </SectionTitle>
          <InsightsButton assignmentId={assignment.id} hasInsights={!!insights} disabled={stats.submittedCount === 0} />
        </div>
        {insights ? (
          <p className="text-xs text-ink-3">
            {insights.source === "claude" ? "Claude 분석" : "데모 분석(규칙 기반)"} · 제출 {insights.submissionCount}건 기준 ·{" "}
            {formatDate(insights.generatedAt)} 생성. 문항별 결과는 아래 각 문항에 표시됩니다.
          </p>
        ) : (
          <p className="text-sm text-ink-2">아직 분석하지 않았습니다. 버튼을 누르면 문항별 오개념 패턴이 아래에 나타납니다.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="lg:sticky lg:top-20 lg:h-fit">{passage && <PassageView passage={passage} />}</div>
        <div className="space-y-4">
          {stats.questions.map((qs) => {
            const q = qs.question;
            const insight = insightFor(q.id);
            return (
              <Card key={q.id} className="!p-4">
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{qs.number}.</span>
                  <SkillBadge skill={q.skill} />
                  <span className="text-xs text-ink-3">난이도 {q.difficulty}</span>
                  <span className="ml-auto text-sm">
                    정답률 <b className="tabular-nums">{pct(qs.correctRate)}</b>
                    <span className="text-ink-3"> ({qs.correct}/{qs.responses})</span>
                  </span>
                </header>
                <p className="mb-3 whitespace-pre-wrap text-sm font-medium">{q.stem}</p>

                <div className="space-y-2">
                  {qs.choices.map((c) => (
                    <div key={c.index}>
                      <Bar
                        label={
                          <span className={c.isAnswer ? "font-semibold text-good-ink" : ""}>
                            {choiceLabel(q, c.index)} {c.isAnswer ? "정답 ✓" : ""} · {c.count}명
                          </span>
                        }
                        value={qs.responses ? c.count / qs.responses : 0}
                        color={c.isAnswer ? "var(--color-series-1)" : "#9b9a95"}
                        detail={q.type === "mcq" ? q.choices[c.index] : c.index === 0 ? "O (맞다)" : "X (틀리다)"}
                      />
                      {c.reasons.length > 0 && !c.isAnswer && (
                        <ul className="mt-1 mb-2 ml-[9.75rem] space-y-1">
                          {c.reasons.map((r) => (
                            <li key={r.studentId} className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-semibold">{r.studentName}</span>
                              <ConfidenceBadge c={r.confidence} />
                              <span className="text-ink-2">“{r.reason || "이유 없음"}”</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {(qs.sureButWrong > 0 || qs.guessedRight > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {qs.sureButWrong > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-critical-ink">
                        ! 확신하고 틀림 {qs.sureButWrong}명
                      </span>
                    )}
                    {qs.guessedRight > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-warning-ink">
                        ? 찍어서 맞힘 {qs.guessedRight}명
                      </span>
                    )}
                  </div>
                )}

                {insight && (
                  <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm">
                    <div className="mb-1 font-semibold text-brand-800">분석</div>
                    <p>{insight.summary}</p>
                    {insight.misconceptions.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {insight.misconceptions.map((m, k) => (
                          <li key={k}>
                            <b>
                              {choiceLabel(q, m.choiceIndex)} ({m.studentCount}명)
                            </b>{" "}
                            {m.pattern}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs">
                      <b>수업 팁</b> {insight.teachingTip}
                    </p>
                  </div>
                )}

                <details className="mt-3 text-xs text-ink-2">
                  <summary className="cursor-pointer">해설·근거 보기</summary>
                  <p className="mt-1">{q.explanation}</p>
                  <p className="mt-1">근거: “{q.evidence.join("” / “")}”</p>
                </details>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="mt-6">
        <SectionTitle hint="학생 이름을 누르면 약점 분석을 볼 수 있어요.">학생별 결과</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-3">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">학생</th>
                <th className="py-2 font-medium">제출</th>
                <th className="py-2 text-right font-medium">점수</th>
                <th className="py-2 text-right font-medium">확신 오답</th>
                <th className="py-2 pl-4 font-medium">틀린 영역</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={row.student.id} className="border-b border-line last:border-0">
                    <td className="py-2.5">
                      <TextLink href={`/teacher/students/${row.student.id}`}>{row.student.name}</TextLink>
                    </td>
                    <td className="py-2.5 text-ink-2">{sub ? formatDate(sub.submittedAt) : <span className="text-warning-ink">미제출</span>}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{sub ? `${sub.correctCount}/${sub.total}` : "–"}</td>
                    <td className="py-2.5 text-right tabular-nums">{sub ? sureWrong : "–"}</td>
                    <td className="py-2.5 pl-4 text-xs text-ink-2">{sub ? weakSkills.join(", ") || "없음" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
