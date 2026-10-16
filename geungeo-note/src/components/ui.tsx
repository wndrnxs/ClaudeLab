import Link from "next/link";
import type { ReactNode } from "react";

const btnBase =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export const btn = {
  primary: `${btnBase} h-10 bg-primary px-4 text-white hover:bg-primary-hover`,
  secondary: `${btnBase} h-10 border border-line-strong bg-surface px-4 text-ink hover:bg-sunken`,
  ghost: `${btnBase} h-9 px-2.5 font-medium text-ink-2 hover:bg-sunken hover:text-ink`,
  danger: `${btnBase} h-9 px-2.5 font-medium text-wrong hover:bg-wrong-tint`,
  /** 표·목록 안의 작은 버튼 */
  small: `${btnBase} h-8 border border-line-strong bg-surface px-3 text-[13px] text-ink hover:bg-sunken`,
};

const field =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const input = `${field} h-10`;
export const textarea = `${field} py-2.5 leading-relaxed`;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

/** 머리줄이 있는 패널. 머리줄과 본문은 선으로 나눕니다. */
export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-surface ${className}`}>
      <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="text-[17px] font-bold">{title}</h2>
        {action}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageTitle({
  title,
  eyebrow,
  sub,
  action,
}: {
  title: string;
  eyebrow?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[13px] text-ink-3">{eyebrow}</div>}
        <h1 className="font-serif text-[26px] font-bold leading-tight sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm text-ink-2">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-[17px] font-bold">{children}</h2>
      {hint && <p className="mt-0.5 text-[13px] text-ink-3">{hint}</p>}
    </div>
  );
}

export interface SummaryItem {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "wrong";
}

/** 핵심 수치를 한 줄에 나란히 보여 주는 띠. 칸 사이는 세로선으로 나눕니다. */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`px-5 py-4 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
        >
          <div className="text-[13px] text-ink-2">{it.label}</div>
          <div className="mt-1 text-[26px] font-bold leading-tight tabular-nums">{it.value}</div>
          {it.sub && <div className={`mt-0.5 text-[13px] ${it.tone === "wrong" ? "text-wrong" : "text-ink-3"}`}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-sunken px-4 py-5 text-center text-sm text-ink-2">{children}</p>;
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-primary ${className}`}>
      {children}
    </Link>
  );
}

type Tone = "neutral" | "primary" | "correct" | "wrong" | "caution" | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  primary: "bg-primary-tint text-primary",
  correct: "bg-correct-tint text-correct",
  wrong: "bg-wrong-tint text-wrong",
  caution: "bg-caution-tint text-caution",
  outline: "border border-line-strong text-ink-2",
};

/** 상태·분류 표시. 색만으로 뜻을 전하지 않도록 항상 글자와 함께 씁니다. */
export function Tag({ tone = "neutral", icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 text-[13px] font-semibold ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

/** 안내·경고 상자 */
export function Notice({ tone = "neutral", children }: { tone?: "neutral" | "caution" | "wrong" | "correct"; children: ReactNode }) {
  const cls = {
    neutral: "border-line bg-sunken text-ink-2",
    caution: "border-[#f0d58a] bg-caution-tint text-caution",
    wrong: "border-[#efc2bd] bg-wrong-tint text-wrong",
    correct: "border-[#bcdcc6] bg-correct-tint text-correct",
  }[tone];
  return <div className={`rounded-md border px-4 py-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

export function pct(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 마감까지 남은 날 (D-3, D-day, 마감) */
export function dday(iso: string | undefined, now = Date.now()): { label: string; open: boolean } | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - now) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: "마감", open: false };
  return { label: days === 0 ? "오늘 마감" : `D-${days}`, open: true };
}

/**
 * 가로 막대. 단일 계열이라 범례 대신 라벨과 값으로 읽히게 하고,
 * 마우스를 올리면 정확한 수치를 보여 줍니다.
 */
export function Bar({
  value,
  label,
  detail,
  color = "var(--color-series-1)",
  marker,
  markerLabel,
  range,
  labelWidth = "9rem",
}: {
  value: number | null;
  label: ReactNode;
  detail?: string;
  color?: string;
  /** 비교 기준선(예: 반 평균) 0~1 */
  marker?: number | null;
  markerLabel?: string;
  /** 기대 범위(예: 예상 정답률) [최소, 최대] 0~1. 점선 상자로 표시합니다. */
  range?: [number, number];
  labelWidth?: string;
}) {
  const width = value === null ? 0 : Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className="group relative grid items-center gap-3 text-sm"
      style={{ gridTemplateColumns: `${labelWidth} 1fr 3rem` }}
      title={detail}
    >
      <div className="truncate text-ink-2">{label}</div>
      <div className="relative h-2.5 rounded-sm bg-sunken">
        <div className="h-2.5 rounded-sm" style={{ width: `${width}%`, background: color }} />
        {range && (
          <div
            className="absolute -inset-y-1 rounded-sm border border-dashed border-ink-2"
            style={{ left: `${range[0] * 100}%`, width: `${(range[1] - range[0]) * 100}%` }}
            aria-hidden
          />
        )}
        {marker !== undefined && marker !== null && (
          <div
            className="absolute -top-1.5 h-[22px] w-0.5 bg-series-2"
            style={{ left: `calc(${Math.max(0, Math.min(1, marker)) * 100}% - 1px)` }}
            aria-label={markerLabel}
          />
        )}
        {detail && (
          <div className="pointer-events-none absolute -top-9 left-0 z-10 hidden whitespace-nowrap rounded bg-ink px-2 py-1 text-[13px] text-white group-hover:block">
            {detail}
          </div>
        )}
      </div>
      <div className="text-right font-semibold tabular-nums">{value === null ? "–" : `${Math.round(value * 100)}%`}</div>
    </div>
  );
}
