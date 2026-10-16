import Link from "next/link";
import { aiMode } from "@/lib/ai/pipeline";
import { classSkillSummary, rate, weakestSkill } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { skillLabel } from "@/lib/skills";
import { Card, Empty, PageTitle, SectionTitle, Stat, TextLink, btn, formatDate, pct } from "@/components/ui";
import { CreateClassForm } from "./CreateClassForm";

export default async function TeacherDashboard() {
  const teacher = await requireRole("teacher");
  const db = await readDb();
  const classes = db.classes.filter((c) => c.teacherId === teacher.id);
  const sets = db.sets.filter((s) => s.teacherId === teacher.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const assignments = db.assignments
    .filter((a) => a.teacherId === teacher.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const studentsIn = (classId: string) => db.users.filter((u) => u.role === "student" && u.classIds.includes(classId));
  const totalStudents = new Set(classes.flatMap((c) => studentsIn(c.id).map((s) => s.id))).size;
  const pendingReview = sets.filter((s) => !s.reviewed).length;

  return (
    <>
      <PageTitle
        title={`안녕하세요, ${teacher.name} 선생님`}
        sub="지문을 고르고 문항을 만든 뒤, 검토를 마치면 반에 바로 배포할 수 있어요."
        action={
          <Link href="/teacher/generate" className={btn.primary}>
            + 새 문항 만들기
          </Link>
        }
      />

      {aiMode() === "demo" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning-ink">
          <b>데모 모드로 실행 중입니다.</b> Claude API 키(<code>ANTHROPIC_API_KEY</code>)가 없어서 라이브러리 지문은 미리 검수한
          예시 문항을, 직접 등록한 지문은 규칙 기반 문항을 만들어요. 키를 설정하면 AI 생성과 자동 풀이 검증이 켜집니다.
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="운영 중인 반" value={classes.length} />
        <Stat label="학생" value={`${totalStudents}명`} />
        <Stat label="배포한 과제" value={assignments.length} />
        <Stat label="검토 대기 세트" value={pendingReview} sub={pendingReview ? "검토 후 배포할 수 있어요" : "모두 검토 완료"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <SectionTitle hint="정답률과 학생들이 답을 고른 이유를 과제별로 확인하세요.">과제 현황</SectionTitle>
            {assignments.length === 0 ? (
              <Empty>아직 배포한 과제가 없습니다.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-ink-3">
                    <tr className="border-b border-line">
                      <th className="py-2 font-medium">과제</th>
                      <th className="py-2 font-medium">반</th>
                      <th className="py-2 text-right font-medium">제출</th>
                      <th className="py-2 text-right font-medium">평균 정답률</th>
                      <th className="py-2 text-right font-medium">마감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => {
                      const subs = db.submissions.filter((s) => s.assignmentId === a.id);
                      const avg = subs.length
                        ? subs.reduce((sum, s) => sum + s.correctCount / s.total, 0) / subs.length
                        : null;
                      const cls = classes.find((c) => c.id === a.classId);
                      return (
                        <tr key={a.id} className="border-b border-line last:border-0">
                          <td className="py-2.5">
                            <TextLink href={`/teacher/assignments/${a.id}`}>{a.title}</TextLink>
                          </td>
                          <td className="py-2.5 text-ink-2">{cls?.name}</td>
                          <td className="py-2.5 text-right tabular-nums">
                            {subs.length}/{cls ? studentsIn(cls.id).length : 0}
                          </td>
                          <td className="py-2.5 text-right font-semibold tabular-nums">{pct(avg)}</td>
                          <td className="py-2.5 text-right text-ink-2">{formatDate(a.dueAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle hint="AI가 만든 문항은 검증 결과를 확인하고 '검토 완료'를 체크해야 배포할 수 있어요.">문항 세트</SectionTitle>
            {sets.length === 0 ? (
              <Empty>아직 만든 문항 세트가 없습니다.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {sets.map((s) => {
                  const flagged = s.items.filter((q) => q.verification.status === "flagged").length;
                  const passed = s.items.filter((q) => q.verification.status === "passed").length;
                  const passage = db.passages.find((p) => p.id === s.passageId);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <TextLink href={`/teacher/sets/${s.id}`}>{s.title}</TextLink>
                        <div className="mt-0.5 text-xs text-ink-3">
                          {passage?.title} · {s.items.length}문항 · 검증 통과 {passed}
                          {flagged > 0 && <span className="font-semibold text-critical-ink"> · 재검토 {flagged}</span>}
                        </div>
                      </div>
                      {s.reviewed ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-good-ink">✓ 검토 완료</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-warning-ink">검토 대기</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle hint="학생은 회원가입할 때 참여 코드를 입력해 반에 들어와요.">내 반</SectionTitle>
            <ul className="space-y-3">
              {classes.map((c) => {
                const tally = classSkillSummary(db, c.id);
                const weak = weakestSkill(tally);
                return (
                  <li key={c.id} className="rounded-lg border border-line bg-white p-3">
                    <div className="flex items-center justify-between">
                      <TextLink href={`/teacher/classes/${c.id}`}>{c.name}</TextLink>
                      <span className="text-xs text-ink-2">학생 {studentsIn(c.id).length}명</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-ink-2">
                        참여 코드 <code className="rounded bg-canvas px-1.5 py-0.5 font-bold text-ink">{c.joinCode}</code>
                      </span>
                      {weak && (
                        <span className="text-critical-ink">
                          약점: {skillLabel(weak)} {pct(rate(tally[weak]))}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4">
              <CreateClassForm />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
