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
        return [{ id: u.id, name: u.name, role: u.role, hint: "문항 만들기 · AI 검증 확인 · 반에 배포 · 통계와 오답 분석" }];
      }
      const mine = db.assignments.filter((a) => u.classIds.includes(a.classId));
      const done = mine.filter((a) => db.submissions.some((s) => s.assignmentId === a.id && s.studentId === u.id)).length;
      const todo = mine.length - done;
      return [
        {
          id: u.id,
          name: u.name,
          role: u.role,
          hint: todo > 0 ? `풀 과제 ${todo}개 · 제출 ${done}개` : `제출 ${done}개 · 결과와 약점 분석 보기`,
        },
      ];
    });
  }

  return (
    <AuthShell title={demo ? "체험할 계정을 고르세요" : "로그인"}>
      {demo && (
        <>
          <p className="-mt-2 mb-4 text-sm text-ink-2">회원가입 없이 바로 들어가 볼 수 있어요. 언제든 &lsquo;역할 바꾸기&rsquo;로 돌아올 수 있습니다.</p>
          <DemoPicker accounts={accounts} />
        </>
      )}
      <details className={demo ? "mt-5 border-t border-line pt-4" : ""} open={!demo}>
        {demo && <summary className="cursor-pointer text-sm font-semibold text-ink-2">아이디로 로그인 / 회원가입</summary>}
        <div className={demo ? "mt-4" : ""}>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-ink-2">
            처음이신가요?{" "}
            <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </details>
    </AuthShell>
  );
}
