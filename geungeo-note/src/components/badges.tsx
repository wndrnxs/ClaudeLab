import { skillLabel } from "@/lib/skills";
import type { Confidence, RightsKind, SkillId, Verification } from "@/lib/types";

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

export function VerificationBadge({ v }: { v: Verification }) {
  switch (v.status) {
    case "passed":
      return <span className={`${base} bg-green-50 text-good-ink ring-1 ring-green-200`}>✓ 검증 통과</span>;
    case "flagged":
      return <span className={`${base} bg-red-50 text-critical-ink ring-1 ring-red-200`}>! 재검토 필요</span>;
    case "edited":
      return <span className={`${base} bg-amber-50 text-warning-ink ring-1 ring-amber-200`}>✎ 수정됨</span>;
    default:
      return <span className={`${base} bg-canvas text-ink-2 ring-1 ring-line`}>○ 미검증</span>;
  }
}

export function SkillBadge({ skill }: { skill: SkillId }) {
  return <span className={`${base} bg-brand-50 text-brand-800`}>{skillLabel(skill)}</span>;
}

const RIGHTS: Record<RightsKind, string> = {
  public_domain: "저작권 만료",
  original: "직접 작성",
  licensed: "이용 허락",
};

export function RightsBadge({ kind }: { kind: RightsKind }) {
  return <span className={`${base} bg-canvas text-ink-2 ring-1 ring-line`}>© {RIGHTS[kind]}</span>;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = { sure: "확실", unsure: "애매", guess: "찍음" };

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const tone =
    c === "sure" ? "bg-blue-50 text-blue-800" : c === "unsure" ? "bg-canvas text-ink-2" : "bg-canvas text-ink-3";
  return <span className={`${base} ${tone}`}>{CONFIDENCE_LABEL[c]}</span>;
}

export function ResultMark({ correct }: { correct: boolean }) {
  return correct ? (
    <span className={`${base} bg-green-50 text-good-ink`}>○ 정답</span>
  ) : (
    <span className={`${base} bg-red-50 text-critical-ink`}>✕ 오답</span>
  );
}
