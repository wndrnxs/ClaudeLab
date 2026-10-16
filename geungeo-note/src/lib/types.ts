export type Role = "teacher" | "student";

export interface User {
  id: string;
  role: Role;
  name: string;
  /** 로그인 아이디. 개인정보 최소 수집을 위해 이메일·전화번호는 받지 않습니다. */
  loginId: string;
  passwordHash: string;
  /** 학생이 속한 반 */
  classIds: string[];
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  teacherId: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

export type Genre = "문학" | "독서";

/**
 * 지문 이용 권리 근거.
 * - public_domain: 저작권 보호기간 만료
 * - original: 직접 작성
 * - licensed: 저작권자·신탁단체 이용 허락
 */
export type RightsKind = "public_domain" | "original" | "licensed";

export interface Passage {
  id: string;
  /** null이면 서비스 기본 라이브러리(저작권 만료·자체 제작 지문만) */
  ownerId: string | null;
  title: string;
  author: string;
  genre: Genre;
  text: string;
  /** 복합 지문이면 (가), (나) 각 작품의 출처 */
  sources?: { label: string; title: string; author: string }[];
  rights: {
    kind: RightsKind;
    note: string;
    confirmedAt: string;
  };
  createdAt: string;
}

export type SkillId =
  | "fact"
  | "inference"
  | "critical"
  | "structure"
  | "vocab"
  | "appreciation";

export type Difficulty = "하" | "중" | "상";
export type QuestionType = "mcq" | "ox";

export interface Verification {
  /**
   * passed: AI 풀이 결과와 정답 일치 + 근거 문장 확인
   * flagged: 재검토 필요(정답 불일치, 복수 정답 의심, 근거 미확인 등)
   * unverified: 검증 전(데모 모드 등)
   * edited: 교사가 수정해 재검증이 필요
   */
  status: "passed" | "flagged" | "unverified" | "edited";
  solverAnswerIndex: number | null;
  evidenceFound: boolean;
  issues: string[];
  checkedAt?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  /** <보기> 내용(없으면 undefined). 발문과 따로 두어 상자로 표시합니다. */
  bogi?: string;
  choices: string[];
  answerIndex: number;
  /** 정답 해설 */
  explanation: string;
  /** 선지별 판단 근거. 정답이 아닌 선지의 근거가 '오답 풀이'가 됩니다. */
  choiceNotes: string[];
  /** 지문에서 그대로 인용한 근거 문장 */
  evidence: string[];
  skill: SkillId;
  difficulty: Difficulty;
  verification: Verification;
}

export interface GenerationSpec {
  mcqCount: number;
  oxCount: number;
  difficulty: Difficulty;
  focusSkill?: SkillId;
  /** <보기>를 활용하는 문항 수 */
  bogiCount?: number;
  /** '적절하지 않은 것은?' 같은 부정 발문을 섞을지 */
  mixNegative?: boolean;
  note?: string;
}

export interface QuestionSet {
  id: string;
  teacherId: string;
  passageId: string;
  title: string;
  spec: GenerationSpec;
  source: "claude" | "demo";
  /** 교사가 모든 문항을 검토했는지. 검토 완료 후에만 배포할 수 있습니다. */
  reviewed: boolean;
  items: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  setId: string;
  classId: string;
  teacherId: string;
  title: string;
  passageId: string;
  /** 배포 시점의 문항 스냅샷. 이후 세트를 수정해도 통계가 흔들리지 않습니다. */
  items: Question[];
  requireReason: boolean;
  dueAt?: string;
  createdAt: string;
  insights?: AssignmentInsights;
}

export type Confidence = "sure" | "unsure" | "guess";

export interface Answer {
  questionId: string;
  choiceIndex: number;
  reason: string;
  confidence: Confidence;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Answer[];
  correctCount: number;
  total: number;
  submittedAt: string;
}

export interface Misconception {
  choiceIndex: number;
  pattern: string;
  studentCount: number;
}

export interface QuestionInsight {
  questionId: string;
  summary: string;
  misconceptions: Misconception[];
  teachingTip: string;
}

export interface AssignmentInsights {
  source: "claude" | "demo";
  generatedAt: string;
  submissionCount: number;
  questions: QuestionInsight[];
}

export interface Database {
  version: 1;
  users: User[];
  classes: ClassRoom[];
  passages: Passage[];
  sets: QuestionSet[];
  assignments: Assignment[];
  submissions: Submission[];
}
