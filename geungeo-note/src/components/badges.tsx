import { AlertTriangle, Check, CheckCircle2, CircleDashed, PencilLine, X } from "lucide-react";
import type { DifficultyFit } from "@/lib/difficulty";
import { skillLabel } from "@/lib/skills";
import type { Confidence, RightsKind, SkillId, Verification } from "@/lib/types";
import { Tag } from "./ui";

const ic = "h-3.5 w-3.5";

export function VerificationBadge({ v }: { v: Verification }) {
  switch (v.status) {
    case "passed":
      return (
        <Tag tone="correct" icon={<CheckCircle2 className={ic} aria-hidden />}>
          검증 통과
        </Tag>
      );
    case "flagged":
      return (
        <Tag tone="wrong" icon={<AlertTriangle className={ic} aria-hidden />}>
          재검토
        </Tag>
      );
    case "edited":
      return (
        <Tag tone="caution" icon={<PencilLine className={ic} aria-hidden />}>
          수정됨
        </Tag>
      );
    default:
      return (
        <Tag tone="neutral" icon={<CircleDashed className={ic} aria-hidden />}>
          미검증
        </Tag>
      );
  }
}

export function SkillBadge({ skill }: { skill: SkillId }) {
  return <Tag tone="outline">{skillLabel(skill)}</Tag>;
}

const RIGHTS: Record<RightsKind, string> = {
  public_domain: "저작권 만료",
  original: "직접 작성",
  licensed: "이용 허락",
};

export function RightsBadge({ kind }: { kind: RightsKind }) {
  return <Tag tone="outline">{RIGHTS[kind]}</Tag>;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = { sure: "확실", unsure: "애매", guess: "찍음" };

export function ConfidenceBadge({ c }: { c: Confidence }) {
  return <Tag tone={c === "sure" ? "primary" : "neutral"}>{CONFIDENCE_LABEL[c]}</Tag>;
}

export function ResultMark({ correct }: { correct: boolean }) {
  return correct ? (
    <Tag tone="correct" icon={<Check className={ic} aria-hidden />}>
      정답
    </Tag>
  ) : (
    <Tag tone="wrong" icon={<X className={ic} aria-hidden />}>
      오답
    </Tag>
  );
}

/** 예상 정답률과 실제 정답률 비교 결과 */
export function DifficultyFitTag({ fit }: { fit: DifficultyFit }) {
  if (fit === "harder") return <Tag tone="wrong">예상보다 어려움</Tag>;
  if (fit === "easier") return <Tag tone="primary">예상보다 쉬움</Tag>;
  return <Tag tone="neutral">예상 범위</Tag>;
}
