import { findEvidenceRanges, splitByRanges } from "@/lib/evidence";
import type { Passage } from "@/lib/types";
import { RightsBadge } from "./badges";

/** 지문 표시. highlights에 넣은 근거 문장을 노란색으로 표시합니다. */
export function PassageView({
  passage,
  highlights = [],
  className = "",
}: {
  passage: Passage;
  highlights?: string[];
  className?: string;
}) {
  const segments = splitByRanges(passage.text, findEvidenceRanges(passage.text, highlights));
  return (
    <article className={`rounded-xl border border-line bg-white p-5 ${className}`}>
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{passage.title}</h2>
        <span className="text-sm text-ink-2">{passage.author}</span>
        <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-ink-2">{passage.genre}</span>
      </header>
      <div className="passage-text text-[15px]">
        {segments.map((s, i) =>
          s.highlighted ? (
            <mark key={i} className="evidence">
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </div>
      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-3">
        <RightsBadge kind={passage.rights.kind} />
        <span>{passage.rights.note}</span>
      </footer>
    </article>
  );
}
