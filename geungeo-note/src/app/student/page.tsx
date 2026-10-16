import Link from "next/link";
import { Card, Empty, PageTitle, SectionTitle, Stat, btn, formatDate, pct } from "@/components/ui";
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
      <PageTitle title={`${student.name}님, 안녕하세요`} sub="선생님이 보낸 과제를 풀고, 내가 어디서 자주 틀리는지 확인해 보세요." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="풀어야 할 과제" value={todo.length} />
        <Stat label="전체 정답률" value={pct(rate(report.overall))} sub={`${report.solvedQuestions}문항 풀이`} />
        <Stat
          label="보완할 영역"
          value={weakest ? skillLabel(weakest.skill) : "–"}
          sub={weakest ? `정답률 ${pct(rate(weakest.mine))}` : "과제를 풀면 분석해 드려요"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>풀어야 할 과제</SectionTitle>
          {todo.length === 0 ? (
            <Empty>지금은 풀 과제가 없어요.</Empty>
          ) : (
            <ul className="space-y-2">
              {todo.map((a) => {
                const passage = db.passages.find((p) => p.id === a.passageId);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-ink-3">
                        {passage?.title} · {a.items.length}문항 · 마감 {formatDate(a.dueAt)}
                      </div>
                    </div>
                    <Link href={`/student/assignments/${a.id}`} className={btn.primary}>
                      풀기
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle>제출한 과제</SectionTitle>
          {done.length === 0 ? (
            <Empty>아직 제출한 과제가 없어요.</Empty>
          ) : (
            <ul className="space-y-2">
              {done.map((a) => {
                const sub = subByAssignment.get(a.id)!;
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-ink-3">{formatDate(sub.submittedAt)} 제출</div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {sub.correctCount}/{sub.total}
                    </span>
                    <Link href={`/student/assignments/${a.id}`} className={btn.secondary}>
                      결과 보기
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/student/report" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            내 약점 분석 보기 →
          </Link>
        </Card>
      </div>
    </>
  );
}
