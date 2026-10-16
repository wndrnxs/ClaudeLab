import Link from "next/link";
import { notFound } from "next/navigation";
import { Bar, Card, PageTitle, SectionTitle, TextLink, btn, pct } from "@/components/ui";
import { classSkillSummary, rate, studentReport, weakestSkill } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { SKILLS, skillLabel } from "@/lib/skills";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const db = await readDb();
  const cls = db.classes.find((c) => c.id === id && c.teacherId === teacher.id);
  if (!cls) notFound();
  const students = db.users.filter((u) => u.role === "student" && u.classIds.includes(cls.id));
  const tally = classSkillSummary(db, cls.id);
  const weak = weakestSkill(tally);

  return (
    <>
      <div className="mb-1 text-xs text-ink-3">
        <TextLink href="/teacher">대시보드</TextLink> / 반
      </div>
      <PageTitle title={cls.name} sub={`학생 ${students.length}명 · 참여 코드 ${cls.joinCode}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="이 반에 배포한 모든 과제를 합친 결과입니다.">반 전체 평가 요소별 정답률</SectionTitle>
          <div className="space-y-2.5">
            {SKILLS.filter((s) => tally[s.id].total > 0).map((s) => (
              <Bar key={s.id} label={s.label} value={rate(tally[s.id])} detail={`${tally[s.id].correct}/${tally[s.id].total}개 응답 정답`} />
            ))}
          </div>
          {weak && (
            <Link href={`/teacher/generate?focusSkill=${weak}`} className={`${btn.primary} mt-4`}>
              {skillLabel(weak)} 복습 세트 만들기
            </Link>
          )}
        </Card>
        <Card>
          <SectionTitle hint="이름을 누르면 학생별 약점 분석을 볼 수 있어요.">학생</SectionTitle>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-3">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">이름</th>
                <th className="py-2 text-right font-medium">정답률</th>
                <th className="py-2 pl-4 font-medium">가장 약한 영역</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const r = studentReport(db, s);
                return (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="py-2.5">
                      <TextLink href={`/teacher/students/${s.id}`}>{s.name}</TextLink>
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{pct(rate(r.overall))}</td>
                    <td className="py-2.5 pl-4 text-ink-2">
                      {r.weakest[0] ? `${skillLabel(r.weakest[0].skill)} (${pct(rate(r.weakest[0].mine))})` : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
