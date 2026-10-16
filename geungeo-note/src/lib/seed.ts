import { grade } from "./grading";
import { LIBRARY_PASSAGES, QUESTION_BANK } from "./library";
import { hashPassword } from "./password";
import type { Answer, Assignment, Confidence, Database, Question, QuestionSet, Submission, User } from "./types";

/**
 * 데모용 초기 데이터. 로그인 정보:
 *   교사  teacher / demo1234
 *   학생  student1 ~ student5 / demo1234
 */

export const DEMO_PASSWORD = "demo1234";

const DAY = 24 * 60 * 60 * 1000;

function pick(passageId: string, ids: string[]): Question[] {
  const bank = QUESTION_BANK[passageId] ?? [];
  return ids.map((id) => {
    const q = bank.find((b) => b.id === id);
    if (!q) throw new Error(`seed: unknown bank question ${id}`);
    return structuredClone(q);
  });
}

type Row = [choiceIndex: number, confidence: Confidence, reason: string];

function submission(
  id: string,
  assignment: Assignment,
  studentId: string,
  rows: Row[],
  submittedAt: string,
): Submission {
  const answers: Answer[] = assignment.items.map((q, i) => ({
    questionId: q.id,
    choiceIndex: rows[i][0],
    confidence: rows[i][1],
    reason: rows[i][2],
  }));
  return { id, assignmentId: assignment.id, studentId, answers, ...grade(assignment.items, answers), submittedAt };
}

export function buildSeedDatabase(now = Date.now()): Database {
  const iso = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString();
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const teacher: User = {
    id: "u_teacher",
    role: "teacher",
    name: "김하늘",
    loginId: "teacher",
    passwordHash,
    classIds: [],
    createdAt: iso(-30),
  };

  const classId = "c_demo";
  const studentNames = ["이서준", "박지우", "최민서", "정하윤", "강도윤"];
  const students: User[] = studentNames.map((name, i) => ({
    id: `u_student${i + 1}`,
    role: "student",
    name,
    loginId: `student${i + 1}`,
    passwordHash,
    classIds: [classId],
    createdAt: iso(-29),
  }));

  const jdlItems = pick("lib_jindallae", [
    "bank_jdl_1",
    "bank_jdl_2",
    "bank_jdl_3",
    "bank_jdl_4",
    "bank_jdl_5",
    "bank_jdl_ox1",
    "bank_jdl_ox2",
  ]);
  const hiItems = pick("lib_heat_island", [
    "bank_hi_1",
    "bank_hi_2",
    "bank_hi_3",
    "bank_hi_4",
    "bank_hi_5",
    "bank_hi_ox1",
    "bank_hi_ox2",
  ]);

  // 검토 중인 세트: AI 검증에서 '복수 정답 의심'으로 걸린 문항을 포함해 검증 기능을 보여 줍니다.
  const flagged: Question = {
    id: "q_draft_flagged",
    type: "mcq",
    stem: "윗글에 대한 설명으로 적절한 것은?",
    choices: [
      "임과의 이별 상황을 가정하여 시상을 전개하고 있다.",
      "화자는 임에게 원망의 말을 직접 쏟아 내고 있다.",
      "화자는 이별의 슬픔을 절제된 태도로 표현하고 있다.",
      "도시적 공간을 배경으로 현대인의 고독을 그리고 있다.",
      "임이 떠난 뒤의 상황을 과거형으로 회상하고 있다.",
    ],
    answerIndex: 0,
    explanation: "'가실 때에는'처럼 아직 일어나지 않은 이별을 가정하여 말하고 있습니다.",
    choiceNotes: [
      "'~때에는'이라는 가정의 표현이 쓰였습니다.",
      "원망을 직접 드러내지 않습니다.",
      "절제된 태도도 지문에서 확인됩니다.",
      "도시적 공간은 나오지 않습니다.",
      "과거형 회상이 아니라 미래의 이별을 가정합니다.",
    ],
    evidence: ["나 보기가 역겨워 가실 때에는"],
    skill: "appreciation",
    difficulty: "school",
    verification: {
      status: "flagged",
      solverAnswerIndex: 2,
      evidenceFound: true,
      issues: [
        "AI 풀이에서 ③을 정답으로 골랐습니다.",
        "③도 '말없이 고이 보내 드리우리다', '죽어도 아니 눈물 흘리우리다'를 근거로 적절하여 정답이 2개일 수 있습니다.",
      ],
      checkedAt: iso(-1),
    },
  };

  const sets: QuestionSet[] = [
    {
      id: "s_jdl",
      teacherId: teacher.id,
      passageId: "lib_jindallae",
      title: "진달래꽃 형성평가",
      spec: { mcqCount: 5, oxCount: 2, difficulty: "school" },
      source: "demo",
      reviewed: true,
      items: jdlItems,
      createdAt: iso(-10),
      updatedAt: iso(-10),
    },
    {
      id: "s_hi",
      teacherId: teacher.id,
      passageId: "lib_heat_island",
      title: "도시 열섬 현상 독해",
      spec: { mcqCount: 5, oxCount: 2, difficulty: "school" },
      source: "demo",
      reviewed: true,
      items: hiItems,
      createdAt: iso(-4),
      updatedAt: iso(-4),
    },
    {
      id: "s_compare",
      teacherId: teacher.id,
      passageId: "lib_jdl_seosi",
      title: "진달래꽃 · 서시 비교 (수능형)",
      spec: { mcqCount: 5, oxCount: 2, difficulty: "csat", bogiCount: 1, mixNegative: true },
      source: "demo",
      reviewed: true,
      items: pick("lib_jdl_seosi", [
        "bank_cmp_1",
        "bank_cmp_2",
        "bank_cmp_3",
        "bank_cmp_4",
        "bank_cmp_5",
        "bank_cmp_ox1",
        "bank_cmp_ox2",
      ]),
      createdAt: iso(-2),
      updatedAt: iso(-2),
    },
    {
      id: "s_jdl_draft",
      teacherId: teacher.id,
      passageId: "lib_jindallae",
      title: "진달래꽃 복습 세트 (검토 중)",
      spec: { mcqCount: 3, oxCount: 1, difficulty: "school", focusSkill: "appreciation" },
      source: "demo",
      reviewed: false,
      items: [
        ...pick("lib_jindallae", ["bank_jdl_4", "bank_jdl_5"]).map((q) => ({ ...q, id: `${q.id}_d` })),
        flagged,
        ...pick("lib_jindallae", ["bank_jdl_ox3"]).map((q) => ({ ...q, id: `${q.id}_d` })),
      ],
      createdAt: iso(-1),
      updatedAt: iso(-1),
    },
  ];

  const a1: Assignment = {
    id: "a_jdl",
    setId: "s_jdl",
    classId,
    teacherId: teacher.id,
    title: "진달래꽃 형성평가",
    passageId: "lib_jindallae",
    items: structuredClone(jdlItems),
    requireReason: true,
    dueAt: iso(-3),
    createdAt: iso(-9),
  };
  const a2: Assignment = {
    id: "a_hi",
    setId: "s_hi",
    classId,
    teacherId: teacher.id,
    title: "도시 열섬 현상 독해",
    passageId: "lib_heat_island",
    items: structuredClone(hiItems),
    requireReason: true,
    dueAt: iso(3),
    createdAt: iso(-3),
  };

  // 진달래꽃: [표현, 태도, 어휘, 진달래꽃 의미, 반어, OX 꽃, OX 영변]
  const jdl: Record<string, Row[]> = {
    u_student1: [
      [0, "sure", "1연과 4연이 거의 똑같아서"],
      [1, "sure", "눈물 흘리지 않겠다고 하니까 슬픔을 참는 것 같음"],
      [0, "unsure", "밟는다는 말이 들어 있어서"],
      [2, "unsure", "임한테 받은 꽃을 다시 뿌리는 거라고 생각함"],
      [0, "sure", "죽어도 눈물 안 흘린다고 했으니 안 슬픈 것"],
      [0, "sure", "2연에 꽃을 뿌린다고 나옴"],
      [0, "guess", "약산이 집 이름 같아서"],
    ],
    u_student2: [
      [0, "sure", "처음과 끝이 반복되는 수미상관"],
      [1, "sure", "말없이 보내고 울지 않겠다고 함"],
      [0, "sure", "짓눌러 밟는다는 뜻"],
      [1, "sure", "아름 따다 뿌리는 건 정성을 다하는 것"],
      [1, "sure", "말로는 안 운다지만 실제로는 너무 슬퍼서 반어"],
      [0, "sure", "가실 길에 뿌리우리다"],
      [1, "sure", "약산은 지명이라서"],
    ],
    u_student3: [
      [3, "unsure", "'역겨워'가 원망하는 말 같아서"],
      [1, "unsure", "울지 않는다고 해서"],
      [1, "guess", "모르겠어서 찍음"],
      [1, "unsure", "사랑하는 마음 같아서"],
      [0, "sure", "울지 않겠다고 했으므로 슬프지 않음"],
      [0, "sure", "꽃을 뿌린다고 했음"],
      [1, "unsure", "집이라는 말은 없어서"],
    ],
    u_student4: [
      [0, "sure", "1연이랑 마지막 연이 같아서"],
      [0, "unsure", "꽃을 뿌리는 게 가지 말라고 붙잡는 행동 같아서"],
      [0, "sure", "즈려밟다 = 눌러 밟다"],
      [1, "sure", "임을 위해서 꽃을 따니까"],
      [4, "unsure", "마지막 연에서 감정이 바뀌는 것 같아서"],
      [0, "sure", "2연 내용"],
      [1, "sure", "영변은 지역 이름"],
    ],
    u_student5: [
      [0, "sure", "수미상관 구조"],
      [1, "sure", "슬픔을 참고 보내 줌"],
      [0, "sure", "꽃을 밟고 가라는 뜻"],
      [0, "sure", "역겨워서 떠나는 거니까 분노"],
      [1, "unsure", "진짜로는 슬픈데 참는 것 같아서"],
      [0, "sure", "꽃을 길에 뿌림"],
      [0, "unsure", "함께 살던 곳이라 꽃을 딴 것 같음"],
    ],
  };

  // 열섬: [불일치, 추론, 서술 방식, 어휘, 보기 적용, OX 이름, OX 수증기]
  const hi: Record<string, Row[]> = {
    u_student2: [
      [1, "sure", "낮보다 밤이라고 했는데 반대로 써 있음"],
      [1, "sure", "흙은 열을 덜 저장하니까 빨리 식음"],
      [0, "sure", "정의 다음에 원인, 해결 방법"],
      [0, "sure", "흡수 = 빨아들임"],
      [1, "sure", "마지막 문단에 지역 따라 다르다고 함"],
      [0, "sure", "섬처럼 보여서"],
      [0, "sure", "수증기가 나오면 더워질 것 같아서"],
    ],
    u_student3: [
      [1, "sure", "밤이 아니라 낮이라고 바꿔 놓음"],
      [4, "unsure", "밝은색이 열을 더 받을 것 같아서"],
      [0, "sure", "개념부터 설명함"],
      [0, "sure", "빨아들이다"],
      [0, "sure", "효과가 있다고 했으니 바로 도입하면 됨"],
      [0, "sure", "1문단"],
      [0, "guess", "잘 모르겠음"],
    ],
    u_student4: [
      [0, "unsure", "아스팔트가 흙보다 덜 흡수할 것 같았음"],
      [1, "sure", "교외는 열을 덜 저장하니까"],
      [0, "sure", "정의-원인-방안"],
      [2, "unsure", "햇빛을 받는 거라 반사인 줄"],
      [1, "sure", "기후에 따라 다르다고 했음"],
      [0, "sure", "등온선 지도 얘기"],
      [1, "sure", "열을 흡수해서 식는다고 했음"],
    ],
    u_student5: [
      [1, "sure", "낮이랑 밤이 바뀜"],
      [3, "sure", "바람이 불면 열이 이동해서 더 더워질 것 같음"],
      [3, "unsure", "통계 얘기가 있는 줄"],
      [0, "sure", "흡수는 빨아들이는 것"],
      [1, "sure", "다만 검토가 필요하다고 함"],
      [0, "sure", "이름 유래 설명"],
      [1, "unsure", "공기가 식는다고 했던 것 같음"],
    ],
  };

  const submissions: Submission[] = [
    ...Object.entries(jdl).map(([sid, rows], i) => submission(`sub_jdl_${i + 1}`, a1, sid, rows, iso(-8 + i * 0.1))),
    ...Object.entries(hi).map(([sid, rows], i) => submission(`sub_hi_${i + 1}`, a2, sid, rows, iso(-2 + i * 0.1))),
  ];

  return {
    version: 1,
    users: [teacher, ...students],
    classes: [{ id: classId, teacherId: teacher.id, name: "고2 국어 A반", joinCode: "KOR2A1", createdAt: iso(-30) }],
    passages: structuredClone(LIBRARY_PASSAGES),
    sets,
    assignments: [a1, a2],
    submissions,
  };
}
