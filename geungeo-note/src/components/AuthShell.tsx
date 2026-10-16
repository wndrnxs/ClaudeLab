import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen px-5 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="mb-8">
          <Wordmark size="lg" />
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            지문을 근거로 문항을 만들고 검증합니다.
            <br />
            학생이 답을 고른 이유까지 모아 수업에 씁니다.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6">
          <h1 className="mb-5 text-lg font-bold">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
