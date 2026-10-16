/**
 * 난이도: 고등학교 수업에서 쓰는 말(기본 / 내신 / 수능 / 수능 고난도)과 예상 정답률을 함께 씁니다.
 * 예상 정답률은 출제 시 목표로 삼는 값이며, 배포 후에는 반의 실제 정답률과 비교해 보여 줍니다.
 */

export const DIFFICULTIES = ["basic", "school", "csat", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface DifficultyInfo {
  label: string;
  /** 어떤 수준인지 한 줄 설명 */
  description: string;
  /** 예상 정답률 범위(0~1). 양 끝을 포함합니다. */
  min: number;
  max: number;
  /** 화면 표시용 예상 정답률 */
  range: string;
  /** 출제 AI에게 주는 기준 */
  guide: string;
}

export const DIFFICULTY_INFO: Record<Difficulty, DifficultyInfo> = {
  basic: {
    label: "기본",
    description: "교과서 기본 개념과 내용 확인",
    min: 0.8,
    max: 1,
    range: "80% 이상",
    guide: "지문에 드러난 내용을 확인하는 수준. 선지가 지문 문장과 거의 그대로 대응하고, 오답 선지는 지문과 분명히 어긋납니다.",
  },
  school: {
    label: "내신",
    description: "학교 시험(중간·기말) 수준",
    min: 0.6,
    max: 0.8,
    range: "60~80%",
    guide: "문단 간 관계, 표현상 특징, 한 단계 추론을 묻는 수준. 선지는 지문 표현을 바꿔 말하고, 오답 선지 하나는 그럴듯하게 만듭니다.",
  },
  csat: {
    label: "수능",
    description: "수능·모의평가 수준",
    min: 0.4,
    max: 0.6,
    range: "40~60%",
    guide: "여러 문단의 정보를 종합하거나 <보기>에 적용하는 수준. 일부만 맞는 매력적인 오답 선지를 2개 이상 둡니다.",
  },
  hard: {
    label: "수능 고난도",
    description: "변별력이 필요한 문항",
    min: 0,
    max: 0.4,
    range: "40% 이하",
    guide: "여러 조건을 동시에 따져야 하거나 <보기>의 새로운 사례에 적용하는 수준. 정답과 매력적인 오답의 차이가 지문의 한 구절에서 갈립니다. 그래도 지문과 <보기>만으로 풀 수 있어야 합니다.",
  },
};

/** '수능 (예상 정답률 40~60%)' */
export function difficultyText(d: Difficulty): string {
  const info = DIFFICULTY_INFO[d];
  return `${info.label} (예상 정답률 ${info.range})`;
}

/** 실제 정답률을 비교할 최소 응답 수. 이보다 적으면 우연의 영향이 커서 비교하지 않습니다. */
export const MIN_RESPONSES_TO_COMPARE = 3;

export type DifficultyFit = "harder" | "as_expected" | "easier";

/** 실제 정답률이 예상 범위보다 낮으면 'harder', 높으면 'easier'. 범위 끝값(예: 60~80%의 80%)은 범위 안으로 봅니다. */
export function compareDifficulty(d: Difficulty, actualRate: number): DifficultyFit {
  const { min, max } = DIFFICULTY_INFO[d];
  if (actualRate < min) return "harder";
  if (actualRate > max) return "easier";
  return "as_expected";
}

/** 예전 데이터('하'/'중'/'상')를 새 난이도로 바꿉니다. */
const LEGACY: Record<string, Difficulty> = { 하: "basic", 중: "school", 상: "csat" };

export function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value === "string") {
    if ((DIFFICULTIES as readonly string[]).includes(value)) return value as Difficulty;
    if (value in LEGACY) return LEGACY[value];
  }
  return "school";
}
