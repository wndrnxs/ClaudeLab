"use client";

import { ArrowLeftRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";

/** 체험 모드에서는 '역할 바꾸기', 운영 시에는 '로그아웃' */
export function LogoutButton({ demo, className = "" }: { demo: boolean; className?: string }) {
  const router = useRouter();
  const Icon = demo ? ArrowLeftRight : LogOut;
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-sunken hover:text-ink ${className}`}
      onClick={async () => {
        await postJson("/api/auth/logout");
        router.push("/login");
        router.refresh();
      }}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {demo ? "역할 바꾸기" : "로그아웃"}
    </button>
  );
}
