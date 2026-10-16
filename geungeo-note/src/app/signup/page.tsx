import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell title="회원가입">
      <SignupForm />
      <p className="mt-5 text-center text-sm text-ink-2">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
