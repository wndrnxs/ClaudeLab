import { BookOpen, FilePenLine, Home, Users } from "lucide-react";
import Link from "next/link";
import { demoLoginEnabled } from "@/lib/demo";
import type { ClassRoom, User } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { SideNavLink, TabLink } from "./NavLink";
import { Wordmark } from "./Wordmark";

const ico = "h-[18px] w-[18px] shrink-0";

/** 선생님 화면: 넓은 화면에서는 왼쪽 메뉴, 좁은 화면에서는 상단 탭 */
export function TeacherShell({
  user,
  classes,
  aiMode,
  children,
}: {
  user: User;
  classes: ClassRoom[];
  aiMode: "claude" | "demo";
  children: React.ReactNode;
}) {
  const demo = demoLoginEnabled();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)] print:block">
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-line bg-surface px-4 pt-7 pb-5 lg:flex">
        <Link href="/teacher" className="mb-8 px-2">
          <Wordmark />
        </Link>
        <nav className="space-y-0.5" aria-label="주 메뉴">
          <SideNavLink href="/teacher" exact icon={<Home className={ico} aria-hidden />}>
            홈
          </SideNavLink>
          <SideNavLink href="/teacher/passages" icon={<BookOpen className={ico} aria-hidden />}>
            지문
          </SideNavLink>
          <SideNavLink href="/teacher/generate" icon={<FilePenLine className={ico} aria-hidden />}>
            문항 만들기
          </SideNavLink>
        </nav>
        {classes.length > 0 && (
          <div className="mt-6">
            <div className="mb-1 px-3 text-[13px] text-ink-3">내 반</div>
            <nav className="space-y-0.5" aria-label="반">
              {classes.map((c) => (
                <SideNavLink key={c.id} href={`/teacher/classes/${c.id}`} icon={<Users className={ico} aria-hidden />}>
                  {c.name}
                </SideNavLink>
              ))}
            </nav>
          </div>
        )}
        <div className="mt-auto border-t border-line pt-4">
          <div className="px-2 text-sm font-semibold">{user.name} 선생님</div>
          {aiMode === "demo" && (
            <div className="px-2 text-[13px] text-caution" title="ANTHROPIC_API_KEY가 없어 예시 문항과 규칙 기반 생성으로 동작합니다.">
              데모 모드 (AI 키 없음)
            </div>
          )}
          <LogoutButton demo={demo} className="mt-2" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-surface lg:hidden">
          <div className="flex h-14 items-center justify-between px-5">
            <Link href="/teacher">
              <Wordmark size="sm" />
            </Link>
            <LogoutButton demo={demo} />
          </div>
          <nav className="flex gap-5 overflow-x-auto px-5" aria-label="주 메뉴">
            <TabLink href="/teacher" exact>
              홈
            </TabLink>
            <TabLink href="/teacher/passages">지문</TabLink>
            <TabLink href="/teacher/generate">문항 만들기</TabLink>
            {classes.map((c) => (
              <TabLink key={c.id} href={`/teacher/classes/${c.id}`}>
                {c.name}
              </TabLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[1180px] px-5 py-8 lg:px-12 lg:py-10 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}

/** 학생 화면 상단 바 */
export function StudentHeader({ user }: { user: User }) {
  const demo = demoLoginEnabled();
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1180px] items-center gap-8 px-5 lg:px-8">
        <Link href="/student" className="py-4">
          <Wordmark size="sm" />
        </Link>
        <nav className="hidden gap-6 sm:flex" aria-label="주 메뉴">
          <TabLink href="/student" exact>
            내 과제
          </TabLink>
          <TabLink href="/student/report">약점 분석</TabLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-ink-2 sm:inline">{user.name}</span>
          <LogoutButton demo={demo} />
        </div>
      </div>
      <nav className="flex gap-6 border-t border-line px-5 sm:hidden" aria-label="주 메뉴">
        <TabLink href="/student" exact>
          내 과제
        </TabLink>
        <TabLink href="/student/report">약점 분석</TabLink>
      </nav>
    </header>
  );
}
