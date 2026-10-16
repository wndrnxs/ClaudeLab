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
}: {
  passage: Passage;
  highlights?: string[];
  className?: string;
}) {
  return (
    <article className={`rounded-xl border border-line bg-white p-5 ${className}`}>
      <header className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{passage.title}</h2>
          <span className="text-sm text-ink-2">{passage.author}</span>
          <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-ink-2">{passage.genre}</span>
          {passage.sources && <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-800">복합 지문</span>}
        </div>
        {passage.sources && (
          <p className="mt-1 text-xs text-ink-2">
            {passage.sources.map((s) => `${s.label} ${s.title} — ${s.author}`).join(" · ")}
          </p>
        )}
      </header>
      <div className="text-[15px]">
        <PassageText passage={passage} highlights={highlights} />
      </div>
      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-3">
        <RightsBadge kind={passage.rights.kind} />
        <span>{passage.rights.note}</span>
      </footer>
    </article>
  );
}
