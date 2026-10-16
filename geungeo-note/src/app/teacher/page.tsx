import { Plus } from "lucide-react";
import Link from "next/link";
import { assignmentStats, classSkillSummary, rate, weakestSkill } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { SKILLS, skillLabel } from "@/lib/skills";
import { Empty, PageTitle, Panel, SummaryStrip, Tag, TextLink, btn, dday, pct } from "@/components/ui";
import { CreateClassForm } from "./CreateClassForm";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayLabel(d = new Date()) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

export default async function TeacherDashboard() {
  const teacher = await requireRole("teacher");
  const db = await readDb();
  const classes = db.classes.filter((c) => c.teacherId === teacher.id);
  const sets = db.sets.filter((s) => s.teacherId === teacher.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const assignments = db.assignments
    .filter((a) => a.teacherId === teacher.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const studentsIn = (classId: string) => db.users.filter((u) => u.role === "student" && u.classIds.includes(classId));
  const stats = assignments.map((a) => ({ a, s: assignmentStats(db, a), due: dday(a.dueAt) }));

  const pendingSets = sets.filter((s) => !s.reviewed);
  const flaggedCount = pendingSets.reduce((n, s) => n + s.items.filter((q) => q.verification.status === "flagged").length, 0);
  const open = stats.filter((x) => x.due?.open ?? true);
  const missing = open.flatMap((x) => x.s.students.filter((r) => !r.submission).map((r) => r.student.name));
  const firstClass = classes[0];
  const classTally = firstClass ? classSkillSummary(db, firstClass.id) : null;
  const weak = classTally ? weakestSkill(classTally) : null;

  return (
    <>
      <PageTitle
        eyebrow={todayLabel()}
        title="오늘 확인할 일"
        action={
          <Link href="/teacher/generate" className={btn.primary}>
            <Plus className="h-4 w-4" aria-hidden />새 문항 만들기
          </Link>
        }
      />

      <div className="mb-6">
        <SummaryStrip
          items={[
            {
              label: "검토 대기 문항 세트",
              value: pendingSets.length,
              sub: flaggedCount ? `재검토 표시 ${flaggedCount}문항` : "재검토 표시 없음",
              tone: flaggedCount ? "wrong" : "default",
            },
            {
              label: "진행 중 과제",
              value: open.length,
              sub: open[0] ? `${open[0].a.title}${open[0].due ? ` · ${open[0].due.label}` : ""}` : "없음",
            },
            {
              label: "미제출 학생",
              value: `${missing.length}명`,
              sub: missing.length ? missing.slice(0, 3).join(", ") : "모두 제출",
            },
            {
              label: "반 약점 영역",
              value: weak && classTally ? pct(rate(classTally[weak])) : "–",
              sub: weak ? skillLabel(weak) : "데이터 부족",
              tone: weak ? "wrong" : "default",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="과제 현황" bodyClassName="">
            {stats.length === 0 ? (
              <div className="p-5">
                <Empty>아직 배포한 과제가 없습니다.</Empty>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-sunken text-left text-[13px] text-ink-2">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">과제</th>
                      <th className="px-3 py-2.5 font-medium">반</th>
                      <th className="px-3 py-2.5 text-right font-medium">제출</th>
                      <th className="px-3 py-2.5 font-medium">평균 정답률</th>
                      <th className="px-5 py-2.5 text-right font-medium">마감</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {stats.map(({ a, s, due }) => (
                      <tr key={a.id} className="hover:bg-paper">
                        <td className="px-5 py-3.5">
                          <TextLink href={`/teacher/assignments/${a.id}`}>{a.title}</TextLink>
                        </td>
                        <td className="px-3 py-3.5 text-ink-2">{classes.find((c) => c.id === a.classId)?.name}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {s.submittedCount} / {s.classSize}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-2 w-24 rounded-sm bg-sunken">
                              <div className="h-2 rounded-sm bg-primary" style={{ width: `${(s.averageRate ?? 0) * 100}%` }} />
                            </div>
                            <span className="font-semibold tabular-nums">{pct(s.averageRate)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {due ? <Tag tone={due.open ? "caution" : "neutral"}>{due.label}</Tag> : <span className="text-ink-3">없음</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="문항 세트" action={<span className="text-[13px] text-ink-3">검토를 마친 세트만 배포할 수 있습니다</span>} bodyClassName="">
            {sets.length === 0 ? (
              <div className="p-5">
                <Empty>아직 만든 문항 세트가 없습니다.</Empty>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {sets.map((s) => {
                  const flagged = s.items.filter((q) => q.verification.status === "flagged").length;
                  const passed = s.items.filter((q) => q.verification.status === "passed").length;
                  const passage = db.passages.find((p) => p.id === s.passageId);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <Link href={`/teacher/sets/${s.id}`} className="font-semibold hover:underline">
                          {s.title}
                        </Link>
                        <div className="mt-0.5 text-[13px] text-ink-3">
                          {passage?.title} · {s.items.length}문항 · 검증 통과 {passed}
                        </div>
                      </div>
                      {flagged > 0 && <Tag tone="wrong">재검토 {flagged}</Tag>}
                      {s.reviewed ? <Tag tone="correct">검토 완료</Tag> : <Tag tone="caution">검토 대기</Tag>}
                      <Link href={`/teacher/sets/${s.id}`} className={btn.small}>
                        {s.reviewed ? "열기" : "검토하기"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {classes.map((c) => {
            const tally = classSkillSummary(db, c.id);
            const weakest = weakestSkill(tally);
            const rows = SKILLS.filter((s) => tally[s.id].total > 0);
            return (
              <Panel
                key={c.id}
                title={c.name}
                action={<span className="text-[13px] text-ink-3">학생 {studentsIn(c.id).length}명</span>}
                bodyClassName=""
              >
                <div className="px-5 pt-4">
                  <div className="text-[13px] text-ink-3">반 참여 코드</div>
                  <div className="mt-0.5 font-mono text-[26px] font-bold tracking-[0.12em]">{c.joinCode}</div>
                </div>
                {rows.length > 0 && (
                  <div className="space-y-2 px-5 pt-4 pb-5">
                    <div className="text-[13px] text-ink-3">영역별 정답률</div>
                    {rows.map((s) => {
                      const r = rate(tally[s.id]);
                      const isWeak = s.id === weakest;
                      return (
                        <div key={s.id} className="grid grid-cols-[7.5rem_1fr_2.75rem] items-center gap-2.5 text-[13px]">
                          <span className={isWeak ? "font-semibold text-wrong" : "text-ink-2"}>{s.label}</span>
                          <div className="h-2 rounded-sm bg-sunken">
                            <div className={`h-2 rounded-sm ${isWeak ? "bg-wrong" : "bg-primary"}`} style={{ width: `${(r ?? 0) * 100}%` }} />
                          </div>
                          <span className="text-right font-semibold tabular-nums">{pct(r)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-col gap-2 border-t border-line px-5 py-4">
                  {weakest && (
                    <Link href={`/teacher/generate?focusSkill=${weakest}`} className={`${btn.secondary} w-full`}>
                      {skillLabel(weakest)} 복습 세트 만들기
                    </Link>
                  )}
                  <Link href={`/teacher/classes/${c.id}`} className={`${btn.ghost} w-full`}>
                    학생별 결과 보기
                  </Link>
                </div>
              </Panel>
            );
          })}
          <Panel title="새 반 만들기">
            <CreateClassForm />
          </Panel>
        </div>
      </div>
    </>
  );
}
