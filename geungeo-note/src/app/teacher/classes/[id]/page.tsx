import Link from "next/link";
import { notFound } from "next/navigation";
import { Bar, PageTitle, Panel, btn, pct } from "@/components/ui";
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
      <PageTitle
        eyebrow={`반 · 참여 코드 ${cls.joinCode}`}
        title={cls.name}
        sub={`학생 ${students.length}명. 학생은 회원가입할 때 참여 코드를 입력해 이 반에 들어옵니다.`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="영역별 정답률" action={<span className="text-[13px] text-ink-3">이 반의 모든 과제 합계</span>} bodyClassName="p-5">
          <div className="space-y-3">
            {SKILLS.filter((s) => tally[s.id].total > 0).map((s) => (
              <Bar
                key={s.id}
                label={s.label}
                value={rate(tally[s.id])}
                color={s.id === weak ? "var(--color-wrong)" : undefined}
                detail={`응답 ${tally[s.id].total}개 중 ${tally[s.id].correct}개 정답`}
              />
            ))}
          </div>
          {weak && (
            <Link href={`/teacher/generate?focusSkill=${weak}`} className={`${btn.secondary} mt-5 w-full`}>
              {skillLabel(weak)} 복습 세트 만들기
            </Link>
          )}
        </Panel>
        <Panel title="학생" bodyClassName="">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-left text-[13px] text-ink-2">
              <tr>
                <th className="px-5 py-2.5 font-medium">이름</th>
                <th className="px-3 py-2.5 text-right font-medium">정답률</th>
                <th className="px-5 py-2.5 font-medium">가장 약한 영역</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => {
                const r = studentReport(db, s);
                return (
                  <tr key={s.id} className="hover:bg-paper">
                    <td className="px-5 py-3">
                      <Link href={`/teacher/students/${s.id}`} className="font-semibold underline decoration-line-strong underline-offset-4">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{pct(rate(r.overall))}</td>
                    <td className="px-5 py-3 text-ink-2">
                      {r.weakest[0] ? `${skillLabel(r.weakest[0].skill)} ${pct(rate(r.weakest[0].mine))}` : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
