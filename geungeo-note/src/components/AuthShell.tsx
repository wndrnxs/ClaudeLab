import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-700 text-lg font-bold text-white">근</div>
          <h1 className="text-xl font-bold">근거노트 <span className="text-sm font-normal text-ink-3">(가칭)</span></h1>
          <p className="mt-1 text-sm text-ink-2">지문 근거로 검증하는 국어 문항과 학습 분석</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">{title}</h2>
          {children}
        </div>
      </div>
    </main>
  );
}
