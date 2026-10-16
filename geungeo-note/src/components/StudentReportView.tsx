import Link from "next/link";
import { rate, type StudentReport } from "@/lib/analytics";
import { choiceLabel } from "@/lib/grading";
import { SKILL_MAP } from "@/lib/skills";
import type { Confidence } from "@/lib/types";
import { CONFIDENCE_LABEL, SkillBadge } from "./badges";
import { QuestionStem } from "./QuestionParts";
import { Bar, Card, Empty, SectionTitle, Stat, formatDate, pct } from "./ui";

/** 학생 약점 분석 화면. 학생 본인과 담당 교사가 같은 화면을 봅니다. */
export function StudentReportView({ report, viewer }: { report: StudentReport; viewer: "student" | "teacher" }) {
  if (report.solvedQuestions === 0) {
    return <Empty>아직 푼 과제가 없어요. 과제를 제출하면 약점 분석이 시작됩니다.</Empty>;
  }
  const you = viewer === "student" ? "나" : "학생";
  const sure = report.calibration.sure;
  const sureWrong = sure.total - sure.correct;
  const top = report.weakest[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="전체 정답률" value={pct(rate(report.overall))} sub={`${report.overall.total}문항 중 ${report.overall.correct}문항`} />
        <Stat label="문학" value={pct(rate(report.byGenre["문학"]))} sub={`${report.byGenre["문학"].total}문항`} />
        <Stat label="독서(비문학)" value={pct(rate(report.byGenre["독서"]))} sub={`${report.byGenre["독서"].total}문항`} />
        <Stat label="확신했지만 틀림" value={`${sureWrong}문항`} sub="잘못 알고 있을 가능성이 큰 부분" />
      </div>

      {top && (
        <Card className="border-brand-100 !bg-brand-50">
          <div className="text-sm font-semibold text-brand-800">지금 가장 먼저 보완할 영역</div>
          <div className="mt-1 text-xl font-bold">
            {SKILL_MAP[top.skill].label} <span className="text-base font-semibold text-ink-2">정답률 {pct(rate(top.mine))}</span>
          </div>
          <p className="mt-1 text-sm text-ink-2">{SKILL_MAP[top.skill].description}</p>
          <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-relaxed">
            <b>이렇게 공부해 보세요.</b> {SKILL_MAP[top.skill].studyTip}
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            hint={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-4 rounded-sm bg-series-1" /> {you}의 정답률
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-0.5 bg-series-2" /> 반 평균
                </span>
              </span>
            }
          >
            평가 요소별 정답률
          </SectionTitle>
          <div className="space-y-3">
            {report.bySkill
              .filter((s) => s.mine.total > 0)
              .map((s) => (
                <Bar
                  key={s.skill}
                  label={SKILL_MAP[s.skill].label}
                  value={rate(s.mine)}
                  marker={rate(s.classAverage)}
                  markerLabel="반 평균"
                  detail={`${you}: ${s.mine.correct}/${s.mine.total} · 반 평균 ${pct(rate(s.classAverage))}`}
                />
              ))}
          </div>
        </Card>

        <Card>
          <SectionTitle hint="'확실'이라고 답한 문항을 얼마나 맞혔는지 보면, 잘못 알고 있는 개념을 찾을 수 있어요.">
            확신도별 정답률
          </SectionTitle>
          <div className="space-y-3">
            {(["sure", "unsure", "guess"] as Confidence[]).map((c) => (
              <Bar
                key={c}
                label={`${CONFIDENCE_LABEL[c]} (${report.calibration[c].total}문항)`}
                value={rate(report.calibration[c])}
                detail={`${CONFIDENCE_LABEL[c]}: ${report.calibration[c].total}문항 중 ${report.calibration[c].correct}문항 정답`}
              />
            ))}
          </div>
          {sureWrong > 0 && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-critical-ink">
              ! &lsquo;확실&rsquo;이라고 답했는데 틀린 문항이 {sureWrong}개 있어요. 아래 오답 노트에서 먼저 확인하세요.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle hint="확신하고 틀린 문항이 먼저 나옵니다. 내가 쓴 이유와 정답의 근거를 비교해 보세요.">오답 노트</SectionTitle>
        {report.wrongNotes.length === 0 ? (
          <Empty>틀린 문항이 없어요. 잘하고 있어요!</Empty>
        ) : (
          <ul className="space-y-3">
            {[...report.misconceptions, ...report.wrongNotes.filter((w) => w.confidence !== "sure")].map((w) => (
              <li key={`${w.assignmentId}-${w.question.id}`} className="rounded-lg border border-line bg-white p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                  <Link href={viewer === "student" ? `/student/assignments/${w.assignmentId}` : `/teacher/assignments/${w.assignmentId}`} className="hover:underline">
                    {w.assignmentTitle} {w.number}번
                  </Link>
                  <SkillBadge skill={w.question.skill} />
                  {w.confidence === "sure" && <span className="font-semibold text-critical-ink">! 확신하고 틀림</span>}
                  <span>{formatDate(w.submittedAt)}</span>
                </div>
                <QuestionStem q={w.question} className="font-medium" />
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div className="rounded-md bg-red-50 p-2">
                    <div className="text-xs font-semibold text-critical-ink">
                      {you}의 답 {choiceLabel(w.question, w.myChoice)} · {CONFIDENCE_LABEL[w.confidence]}
                    </div>
                    <div className="text-xs text-ink-2">{w.question.type === "mcq" && w.question.choices[w.myChoice]}</div>
                    <div className="mt-1 text-xs">고른 이유: “{w.myReason || "적지 않음"}”</div>
                    {w.question.choiceNotes[w.myChoice] && (
                      <div className="mt-1 text-xs text-critical-ink">→ {w.question.choiceNotes[w.myChoice]}</div>
                    )}
                  </div>
                  <div className="rounded-md bg-green-50 p-2">
                    <div className="text-xs font-semibold text-good-ink">정답 {choiceLabel(w.question, w.question.answerIndex)}</div>
                    <div className="mt-1 text-xs">{w.question.explanation}</div>
                    {w.question.evidence[0] && <div className="mt-1 text-xs text-ink-2">근거: “{w.question.evidence[0]}”</div>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
