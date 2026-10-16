"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** 사이드바 메뉴 */
export function SideNavLink({ href, icon, children, exact = false }: { href: string; icon: ReactNode; children: ReactNode; exact?: boolean }) {
  const active = isActive(usePathname(), href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
        active ? "bg-primary-tint font-semibold text-primary" : "text-ink-2 hover:bg-sunken hover:text-ink"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

/** 상단 탭 메뉴 (학생 화면, 좁은 화면의 선생님 화면) */
export function TabLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const active = isActive(usePathname(), href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 px-1 py-3 text-sm whitespace-nowrap ${
        active ? "border-primary font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
