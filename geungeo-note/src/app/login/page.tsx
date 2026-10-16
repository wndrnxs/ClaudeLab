import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "teacher" ? "/teacher" : "/student");
  return (
    <AuthShell title="로그인">
      <LoginForm />
      <p className="mt-5 text-center text-sm text-ink-2">
        처음이신가요?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          회원가입
        </Link>
      </p>
      <div className="mt-5 rounded-lg bg-canvas p-3 text-xs leading-relaxed text-ink-2">
        <div className="mb-1 font-semibold text-ink">데모 계정 (비밀번호 demo1234)</div>
        선생님: <code>teacher</code>
        <br />
        학생: <code>student1</code> ~ <code>student5</code> (student1은 아직 풀지 않은 과제가 있습니다)
      </div>
    </AuthShell>
  );
}
