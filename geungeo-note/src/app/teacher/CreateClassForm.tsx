"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";

export function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          await postJson("/api/classes", { name });
          setName("");
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="새 반 이름 (예: 고1 B반)" />
      <button type="submit" className={`${btn.secondary} shrink-0 whitespace-nowrap`} disabled={pending || !name.trim()}>
        반 만들기
      </button>
      {error && <p className="text-sm text-critical-ink">{error}</p>}
    </form>
  );
}
