import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { DEMO_USER_IDS, demoLoginEnabled } from "@/lib/demo";
import { type DemoAccount, DemoPicker } from "./DemoPicker";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "teacher" ? "/teacher" : "/student");

  const demo = demoLoginEnabled();
  let accounts: DemoAccount[] = [];
  if (demo) {
    const db = await readDb();
    accounts = DEMO_USER_IDS.flatMap((id): DemoAccount[] => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return [];
      if (u.role === "teacher") {
        return [{ id: u.id, name: u.name, role: u.role, hint: "문항 만들기, 검증 확인, 배포, 통계" }];
      }
      const mine = db.assignments.filter((a) => u.classIds.includes(a.classId));
      const done = mine.filter((a) => db.submissions.some((s) => s.assignmentId === a.id && s.studentId === u.id)).length;
      const todo = mine.length - done;
      return [
        {
          id: u.id,
          name: u.name,
          role: u.role,
          hint: todo > 0 ? `풀 과제 ${todo}개 남음` : `과제 ${done}개 제출 완료`,
        },
      ];
    });
  }

  return (
    <AuthShell title={demo ? "체험 계정으로 들어가기" : "로그인"}>
      {demo && <DemoPicker accounts={accounts} />}
      <details className={demo ? "mt-5 border-t border-line pt-4" : ""} open={!demo}>
        {demo && <summary className="cursor-pointer text-sm font-semibold text-ink-2">아이디로 로그인 / 회원가입</summary>}
        <div className={demo ? "mt-4" : ""}>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-ink-2">
            처음이신가요?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
        </div>
      </details>
    </AuthShell>
  );
}
