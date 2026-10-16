import type { SkillId } from "./types";

export interface SkillInfo {
  id: SkillId;
  label: string;
  description: string;
  /** 약점일 때 학생에게 보여 줄 학습 방법 */
  studyTip: string;
}

export const SKILLS: SkillInfo[] = [
  {
    id: "fact",
    label: "사실적 이해",
    description: "지문에 드러난 정보를 정확히 확인하는 능력",
    studyTip:
      "선지의 핵심어를 지문에서 찾아 밑줄을 긋고, 한 글자씩 대조하는 연습을 해 보세요. '항상', '전혀' 같은 단정 표현은 특히 조심하세요.",
  },
  {
    id: "inference",
    label: "추론적 이해",
    description: "드러나지 않은 의미나 결과를 근거로부터 이끌어 내는 능력",
    studyTip:
      "선지를 고르기 전에 '지문의 어느 문장 때문에 그렇게 말할 수 있지?'라고 스스로 물어보세요. 근거 문장을 찾지 못하면 그 선지는 의심하세요.",
  },
  {
    id: "critical",
    label: "비판적 이해·적용",
    description: "내용의 타당성을 판단하고 새로운 사례에 적용하는 능력",
    studyTip:
      "<보기>의 사례를 지문의 핵심 원리와 1:1로 연결해 보세요. 지문이 단서를 달아 둔 부분(예: '다만', '~에 따라')이 정답의 근거가 되는 경우가 많습니다.",
  },
  {
    id: "structure",
    label: "표현·구조 파악",
    description: "글의 전개 방식, 표현 방법, 구성을 파악하는 능력",
    studyTip:
      "문단(연)마다 한 줄 요약을 적고, 반복·대조·열거처럼 글이 어떤 방식으로 짜여 있는지 표시해 보세요.",
  },
  {
    id: "vocab",
    label: "어휘·어법",
    description: "문맥 속 어휘의 의미와 쓰임을 파악하는 능력",
    studyTip:
      "모르는 어휘는 앞뒤 문장을 다시 읽고 바꿔 쓸 수 있는 말을 넣어 보세요. 바꿔 넣어도 문장의 뜻이 자연스러운지 확인하는 것이 핵심입니다.",
  },
  {
    id: "appreciation",
    label: "감상·해석",
    description: "작품의 정서, 상징, 주제를 해석하는 능력",
    studyTip:
      "시어·소재가 화자의 정서와 어떻게 연결되는지 '시어 → 의미 → 정서' 순서로 정리해 보세요. 겉으로 드러난 말과 속마음이 다른 반어적 표현도 확인하세요.",
  },
];

export const SKILL_MAP: Record<SkillId, SkillInfo> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
) as Record<SkillId, SkillInfo>;

export const SKILL_IDS = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

export function skillLabel(id: SkillId): string {
  return SKILL_MAP[id]?.label ?? id;
}
