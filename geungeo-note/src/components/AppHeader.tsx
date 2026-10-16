import Link from "next/link";
import { demoLoginEnabled } from "@/lib/demo";
import type { User } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";

const NAV = {
  teacher: [
    { href: "/teacher", label: "대시보드" },
    { href: "/teacher/passages", label: "지문" },
    { href: "/teacher/generate", label: "문항 만들기" },
  ],
  student: [
    { href: "/student", label: "내 과제" },
    { href: "/student/report", label: "약점 분석" },
  ],
} as const;

export function AppHeader({ user, aiMode }: { user: User; aiMode?: "claude" | "demo" }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
        <Link
          href={user.role === "teacher" ? "/teacher" : "/student"}
          className="flex items-center gap-2 font-bold whitespace-nowrap"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-700 text-sm text-white">근</span>
          <span>근거노트</span>
          <span className="hidden text-xs font-normal text-ink-3 sm:inline">(가칭)</span>
        </Link>
        <nav className="order-last -mx-3 flex w-full gap-1 overflow-x-auto text-sm whitespace-nowrap sm:order-none sm:mx-0 sm:w-auto">
          {NAV[user.role].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-1.5 text-ink-2 hover:bg-canvas hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm whitespace-nowrap">
          {aiMode === "demo" && (
            <span
              className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-warning-ink ring-1 ring-amber-200 sm:inline"
              title="ANTHROPIC_API_KEY가 없어 예시 문항과 규칙 기반 생성으로 동작합니다."
            >
              데모 모드
            </span>
          )}
          <span className="hidden text-ink-2 sm:inline">
            {user.name} {user.role === "teacher" ? "선생님" : "학생"}
          </span>
          <LogoutButton label={demoLoginEnabled() ? "⇄ 역할 바꾸기" : "로그아웃"} />
        </div>
      </div>
    </header>
  );
}
