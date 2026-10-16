import type { ReactNode } from "react";
import { findEvidenceRanges, splitByRanges } from "@/lib/evidence";
import type { Passage } from "@/lib/types";
import { RightsBadge } from "./badges";

// 복합 지문에서 한 줄에 '(가)', '(나)'만 있는 줄은 작품 구분 표시입니다.
const LABEL_LINE = /^(\([가-힣]\))$/m;

function withLabels(text: string, key: string): ReactNode[] {
  return text.split(LABEL_LINE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={`${key}-${i}`} className="passage-label">
        {part}
      </span>
    ) : (
      <span key={`${key}-${i}`}>{part}</span>
    ),
  );
}

/** 복합 지문을 (가), (나) 작품별로 나눕니다. 복합 지문이 아니면 null */
export function splitComposite(passage: Passage): { label: string; text: string }[] | null {
  if (!passage.sources) return null;
  const pieces = passage.text.split(LABEL_LINE);
  const parts: { label: string; text: string }[] = [];
  for (let i = 1; i < pieces.length; i += 2) parts.push({ label: pieces[i], text: pieces[i + 1].trim() });
  return parts.length ? parts : null;
}

/** 지문 본문. highlights에 넣은 근거 문장을 노란색으로 표시합니다. */
export function PassageText({ passage, highlights = [] }: { passage: Passage; highlights?: string[] }) {
  const segments = splitByRanges(passage.text, findEvidenceRanges(passage.text, highlights));
  return (
    <div className="passage-text">
      {segments.map((s, i) =>
        s.highlighted ? (
          <mark key={i} className="evidence">
            {s.text}
          </mark>
        ) : (
          withLabels(s.text, String(i))
        ),
      )}
    </div>
  );
}

export function PassageView({
  passage,
  highlights = [],
  className = "",
  collapsible = false,
}: {
  passage: Passage;
  highlights?: string[];
  className?: string;
  /** 좁은 화면에서 지문을 접을 수 있게 합니다. */
  collapsible?: boolean;
}) {
  const head = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="font-serif text-[19px] font-bold">{passage.title}</h2>
        <span className="text-sm text-ink-2">{passage.author}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
        <span>{passage.genre}</span>
        {passage.sources && (
          <>
            <span aria-hidden>·</span>
            <span>{passage.sources.map((s) => `${s.label} ${s.title}(${s.author})`).join(", ")}</span>
          </>
        )}
      </div>
    </div>
  );
  const body = (
    <>
      <div className="text-[16px] sm:text-[17px]">
        <PassageText passage={passage} highlights={highlights} />
      </div>
      <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[13px] text-ink-3">
        <RightsBadge kind={passage.rights.kind} />
        <span>{passage.rights.note}</span>
      </footer>
    </>
  );
  if (collapsible) {
    return (
      <details open className={`group rounded-lg border border-line bg-surface ${className}`}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
          {head}
          <span className="shrink-0 pt-1 text-[13px] font-semibold text-primary">
            <span className="group-open:hidden">지문 펼치기</span>
            <span className="hidden group-open:inline">접기</span>
          </span>
        </summary>
        <div className="px-5 pb-5">{body}</div>
      </details>
    );
  }
  return (
    <article className={`rounded-lg border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <header className="mb-4">{head}</header>
      {body}
    </article>
  );
}
