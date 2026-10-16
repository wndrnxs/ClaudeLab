"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn } from "@/components/ui";
import { postJson } from "@/lib/client";

export function InsightsButton({
  assignmentId,
  hasInsights,
  disabled,
}: {
  assignmentId: string;
  hasInsights: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="text-right">
      <button
        type="button"
        className={btn.primary}
        disabled={pending || disabled}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await postJson(`/api/assignments/${assignmentId}/insights`);
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "분석 중…" : hasInsights ? "다시 분석" : "오답 이유 분석하기"}
      </button>
      {error && <p className="mt-1 text-xs text-critical-ink">{error}</p>}
    </div>
  );
}
