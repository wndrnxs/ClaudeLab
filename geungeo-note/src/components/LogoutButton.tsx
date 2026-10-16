"use client";

import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";
import { btn } from "./ui";

export function LogoutButton({ label = "로그아웃" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={btn.ghost}
      onClick={async () => {
        await postJson("/api/auth/logout");
        router.push("/login");
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
