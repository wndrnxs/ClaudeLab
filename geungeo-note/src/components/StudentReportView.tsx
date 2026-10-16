import Link from "next/link";
import { rate, type StudentReport } from "@/lib/analytics";
import { choiceLabel } from "@/lib/grading";
import { SKILL_MAP } from "@/lib/skills";
import type { Confidence } from "@/lib/types";
import { CONFIDENCE_LABEL, SkillBadge } from "./badges";
import { QuestionStem } from "./QuestionParts";
import { Bar, Empty, Panel, SummaryStrip, Tag, formatDate, pct } from "./ui";

/** 학생 약점 분석 화면. 학생 본인과 담당 교사가 같은 화면을 봅니다. */
export function StudentReportView({ report, viewer }: { report: StudentReport; viewer: "student" | "teacher" }) {
  if (report.solvedQuestions === 0) {
    return <Empty>제출한 과제가 없습니다. 과제를 제출하면 분석이 시작됩니다.</Empty>;
  }
  const you = viewer === "student" ? "나" : "학생";
  const sure = report.calibration.sure;
  const sureWrong = sure.total - sure.correct;
  const top = report.weakest[0];
  const notes = [...report.misconceptions, ...report.wrongNotes.filter((w) => w.confidence !== "sure")];

  return (
    <div className="space-y-6">
      <SummaryStrip
        items={[
          { label: "전체 정답률", value: pct(rate(report.overall)), sub: `${report.overall.total}문항 중 ${report.overall.correct}문항` },
          { label: "문학", value: pct(rate(report.byGenre["문학"])), sub: `${report.byGenre["문학"].total}문항` },
          { label: "독서(비문학)", value: pct(rate(report.byGenre["독서"])), sub: `${report.byGenre["독서"].total}문항` },
          {
            label: "확신했지만 틀림",
            value: `${sureWrong}문항`,
            sub: sureWrong ? "잘못 알고 있을 가능성이 큰 문항" : "없음",
            tone: sureWrong ? "wrong" : "default",
          },
        ]}
      />

      {top && (
        <section className="rounded-lg border border-line border-l-4 border-l-wrong bg-surface p-5 sm:p-6">
          <div className="text-[13px] font-semibold text-wrong">먼저 보완할 영역</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <h2 className="font-serif text-[22px] font-bold">{SKILL_MAP[top.skill].label}</h2>
            <span className="text-sm text-ink-2">
              정답률 {pct(rate(top.mine))} · 반 평균 {pct(rate(top.classAverage))}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-2">{SKILL_MAP[top.skill].description}</p>
          <p className="mt-4 border-t border-line pt-4 text-[15px] leading-relaxed">
            <span className="font-semibold">공부 방법 </span>
            {SKILL_MAP[top.skill].studyTip}
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="평가 요소별 정답률"
          action={
            <span className="flex items-center gap-3 text-[13px] text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 rounded-sm bg-series-1" aria-hidden /> {you}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-0.5 bg-series-2" aria-hidden /> 반 평균
              </span>
            </span>
          }
          bodyClassName="space-y-3.5 p-5"
        >
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
        </Panel>

        <Panel title="확신 정도별 정답률" bodyClassName="space-y-3.5 p-5">
          {(["sure", "unsure", "guess"] as Confidence[]).map((c) => (
            <Bar
              key={c}
              label={`${CONFIDENCE_LABEL[c]} (${report.calibration[c].total}문항)`}
              value={rate(report.calibration[c])}
              detail={`${CONFIDENCE_LABEL[c]}: ${report.calibration[c].total}문항 중 ${report.calibration[c].correct}문항 정답`}
            />
          ))}
          <p className="border-t border-line pt-3 text-[13px] leading-relaxed text-ink-2">
            &lsquo;확실&rsquo;이라고 답하고 틀린 문항은 개념을 잘못 알고 있을 가능성이 큽니다.
            {sureWrong > 0 && <span className="font-semibold text-wrong"> 해당 문항 {sureWrong}개가 오답 노트 맨 위에 있습니다.</span>}
          </p>
        </Panel>
      </div>

      <Panel title="오답 노트" action={<span className="text-[13px] text-ink-3">{notes.length}문항</span>} bodyClassName="">
        {notes.length === 0 ? (
          <div className="p-5">
            <Empty>틀린 문항이 없습니다.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {notes.map((w) => (
              <li key={`${w.assignmentId}-${w.question.id}`} className="p-5 sm:p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                  <Link
                    href={viewer === "student" ? `/student/assignments/${w.assignmentId}` : `/teacher/assignments/${w.assignmentId}`}
                    className="font-semibold text-ink-2 underline decoration-line-strong underline-offset-4"
                  >
                    {w.assignmentTitle} {w.number}번
                  </Link>
                  <span>{formatDate(w.submittedAt)}</span>
                  <SkillBadge skill={w.question.skill} />
                  {w.confidence === "sure" && <Tag tone="wrong">확신했지만 틀림</Tag>}
                </div>
                <QuestionStem q={w.question} className="font-serif text-[16px] font-bold leading-relaxed" />
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-md border border-[#efc2bd] bg-wrong-tint p-3">
                    <div className="font-semibold text-wrong">
                      {you}의 답 {choiceLabel(w.question, w.myChoice)} · {CONFIDENCE_LABEL[w.confidence]}
                    </div>
                    {w.question.type === "mcq" && <div className="mt-1 text-ink">{w.question.choices[w.myChoice]}</div>}
                    <div className="mt-2 text-ink-2">고른 이유: {w.myReason || "적지 않음"}</div>
                    {w.question.choiceNotes[w.myChoice] && <div className="mt-1 text-wrong">{w.question.choiceNotes[w.myChoice]}</div>}
                  </div>
                  <div className="rounded-md border border-[#bcdcc6] bg-correct-tint p-3">
                    <div className="font-semibold text-correct">정답 {choiceLabel(w.question, w.question.answerIndex)}</div>
                    <div className="mt-1 leading-relaxed text-ink">{w.question.explanation}</div>
                    {w.question.evidence[0] && (
                      <div className="mt-2 text-ink-2">
                        근거 <mark className="evidence font-serif">{w.question.evidence[0]}</mark>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
