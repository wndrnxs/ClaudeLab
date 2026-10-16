import Link from "next/link";
import type { ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-2 hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-critical-ink hover:bg-red-50 disabled:opacity-50",
};

export const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-2">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold">{children}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xs font-medium text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">{children}</p>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand-700 hover:underline">
      {children}
    </Link>
  );
}

export function pct(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 가로 막대. 단일 계열이므로 범례 대신 제목·값 라벨로 읽히게 하고,
 * 마우스를 올리면 정확한 수치를 보여 줍니다.
 */
export function Bar({
  value,
  label,
  detail,
  color = "var(--color-series-1)",
  marker,
  markerLabel,
}: {
  value: number | null;
  label: ReactNode;
  detail?: string;
  color?: string;
  /** 비교 기준선(예: 반 평균) 0~1 */
  marker?: number | null;
  markerLabel?: string;
}) {
  const width = value === null ? 0 : Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="group relative grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm" title={detail}>
      <div className="truncate text-ink-2">{label}</div>
      <div className="relative h-3 rounded-sm bg-grid">
        <div className="h-3 rounded-r-[4px]" style={{ width: `${width}%`, background: color }} />
        {marker !== undefined && marker !== null && (
          <div
            className="absolute -top-1 h-5 w-0.5 bg-series-2"
            style={{ left: `calc(${Math.max(0, Math.min(1, marker)) * 100}% - 1px)` }}
            aria-label={markerLabel}
          />
        )}
        {detail && (
          <div className="pointer-events-none absolute -top-9 left-0 z-10 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white shadow group-hover:block">
            {detail}
          </div>
        )}
      </div>
      <div className="text-right font-semibold tabular-nums">{value === null ? "–" : `${Math.round(value * 100)}%`}</div>
    </div>
  );
}
