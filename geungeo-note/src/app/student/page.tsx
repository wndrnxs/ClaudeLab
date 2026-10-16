import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Empty, PageTitle, Panel, Tag, btn, dday, formatDate, pct } from "@/components/ui";
import { rate, studentReport } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { skillLabel } from "@/lib/skills";

export default async function StudentHome() {
  const student = await requireRole("student");
  const db = await readDb();
  const assignments = db.assignments
    .filter((a) => student.classIds.includes(a.classId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const subByAssignment = new Map(
    db.submissions.filter((s) => s.studentId === student.id).map((s) => [s.assignmentId, s]),
  );
  const todo = assignments.filter((a) => !subByAssignment.has(a.id));
  const done = assignments.filter((a) => subByAssignment.has(a.id));
  const report = studentReport(db, student);
  const weakest = report.weakest[0];

  return (
    <>
      <PageTitle
        eyebrow={`${student.name} · 고2 국어 A반`}
        title={todo.length ? `풀어야 할 과제 ${todo.length}개` : "남은 과제가 없습니다"}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="풀어야 할 과제" bodyClassName="">
            {todo.length === 0 ? (
              <div className="p-5">
                <Empty>새 과제가 오면 여기에 표시됩니다.</Empty>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {todo.map((a) => {
                  const passage = db.passages.find((p) => p.id === a.passageId);
                  const due = dday(a.dueAt);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{a.title}</div>
                        <div className="mt-0.5 text-[13px] text-ink-3">
                          {passage?.title} · {a.items.length}문항{a.dueAt ? ` · ${formatDate(a.dueAt)}까지` : ""}
                        </div>
                      </div>
                      {due && <Tag tone={due.open ? "caution" : "neutral"}>{due.label}</Tag>}
                      <Link href={`/student/assignments/${a.id}`} className={btn.primary}>
                        문제 풀기
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="제출한 과제" bodyClassName="">
            {done.length === 0 ? (
              <div className="p-5">
                <Empty>아직 제출한 과제가 없습니다.</Empty>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {done.map((a) => {
                  const sub = subByAssignment.get(a.id)!;
                  return (
                    <li key={a.id}>
                      <Link href={`/student/assignments/${a.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-paper">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{a.title}</div>
                          <div className="mt-0.5 text-[13px] text-ink-3">{formatDate(sub.submittedAt)} 제출 · 결과와 해설 보기</div>
                        </div>
                        <span className="text-lg font-bold tabular-nums">
                          {sub.correctCount}
                          <span className="text-sm font-medium text-ink-3"> / {sub.total}</span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-ink-3" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <aside>
          <Panel title="지금까지의 기록" bodyClassName="p-5 space-y-4">
            <div>
              <div className="text-[13px] text-ink-3">전체 정답률</div>
              <div className="text-[26px] font-bold tabular-nums">{pct(rate(report.overall))}</div>
              <div className="text-[13px] text-ink-3">{report.solvedQuestions}문항 풀이</div>
            </div>
            {weakest && (
              <div className="border-t border-line pt-4">
                <div className="text-[13px] text-ink-3">먼저 보완할 영역</div>
                <div className="mt-0.5 font-semibold text-wrong">
                  {skillLabel(weakest.skill)} {pct(rate(weakest.mine))}
                </div>
              </div>
            )}
            <Link href="/student/report" className={`${btn.secondary} w-full`}>
              약점 분석 보기
            </Link>
          </Panel>
        </aside>
      </div>
    </>
  );
}
