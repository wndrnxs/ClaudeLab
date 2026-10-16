import { describe, expect, it } from "vitest";
import { demoGenerate, negate } from "@/lib/ai/demo";
import { combineVerification, normalizeGenerated } from "@/lib/ai/pipeline";
import { evidenceExists } from "@/lib/evidence";
import { LIBRARY_PASSAGES } from "@/lib/library";
import type { Passage, Question } from "@/lib/types";

const base: Question = {
  id: "q1",
  type: "mcq",
  stem: "윗글의 내용으로 적절한 것은?",
  choices: ["가", "나", "다", "라", "마"],
  answerIndex: 1,
  explanation: "",
  choiceNotes: ["", "", "", "", ""],
  evidence: ["근거"],
  skill: "fact",
  difficulty: "중",
  verification: { status: "unverified", solverAnswerIndex: null, evidenceFound: false, issues: [] },
};

describe("검증 결과 판정", () => {
  it("풀이가 정답과 같고 근거가 있으면 통과", () => {
    const v = combineVerification(base, true, { chosenIndex: 1, alsoDefensible: [], issue: "" });
    expect(v.status).toBe("passed");
    expect(v.issues).toEqual([]);
  });

  it("풀이가 다른 답을 고르면 재검토", () => {
    const v = combineVerification(base, true, { chosenIndex: 3, alsoDefensible: [], issue: "" });
    expect(v.status).toBe("flagged");
    expect(v.issues[0]).toContain("④");
  });

  it("복수 정답 의심이면 재검토(정답 번호 자체는 제외)", () => {
    const v = combineVerification(base, true, { chosenIndex: 1, alsoDefensible: [1, 2], issue: "" });
    expect(v.status).toBe("flagged");
    expect(v.issues.join(" ")).toContain("③");
    expect(v.issues.join(" ")).not.toContain("②도");
  });

  it("근거 문장을 지문에서 못 찾으면 재검토", () => {
    const v = combineVerification(base, false, { chosenIndex: 1, alsoDefensible: [], issue: "" });
    expect(v.status).toBe("flagged");
  });
});

describe("AI 출력 정리", () => {
  const gen = { ...base, bogi: "" };

  it("<보기>가 비어 있으면 없는 것으로, 있으면 따로 보관한다", () => {
    expect(normalizeGenerated(gen).question.bogi).toBeUndefined();
    expect(normalizeGenerated({ ...gen, bogi: "  관점 설명  " }).question.bogi).toBe("관점 설명");
  });

  it("선지 수가 틀리면 형식 문제로 기록한다", () => {
    const { issues } = normalizeGenerated({ ...gen, choices: ["가", "나", "다"], choiceNotes: ["", "", ""] });
    expect(issues.join(" ")).toContain("3개");
  });

  it("OX 선지는 항상 O, X로 맞춘다", () => {
    const { question } = normalizeGenerated({ ...gen, type: "ox", choices: ["참", "거짓"], answerIndex: 1, choiceNotes: ["", ""] });
    expect(question.choices).toEqual(["O", "X"]);
  });

  it("범위를 벗어난 정답 번호를 잡아낸다", () => {
    const { issues } = normalizeGenerated({ ...gen, answerIndex: 7 });
    expect(issues.join(" ")).toContain("범위");
  });
});

describe("데모 생성기", () => {
  it("라이브러리 지문은 검수된 예시 문항에서 요청 수만큼 고른다", () => {
    const passage = LIBRARY_PASSAGES.find((p) => p.id === "lib_heat_island")!;
    const result = demoGenerate(passage, { mcqCount: 3, oxCount: 2, difficulty: "중", focusSkill: "inference" });
    expect(result.items.filter((q) => q.type === "mcq")).toHaveLength(3);
    expect(result.items.filter((q) => q.type === "ox")).toHaveLength(2);
    expect(result.items.some((q) => q.skill === "inference")).toBe(true);
    expect(new Set(result.items.map((q) => q.id)).size).toBe(5);
  });

  it("<보기> 문항 수를 요청하면 <보기>가 있는 예시 문항을 포함한다", () => {
    const passage = LIBRARY_PASSAGES.find((p) => p.id === "lib_jdl_seosi")!;
    const result = demoGenerate(passage, { mcqCount: 3, oxCount: 0, difficulty: "상", bogiCount: 1 });
    expect(result.items.filter((q) => q.bogi)).toHaveLength(1);
  });

  it("직접 등록한 지문은 규칙 기반 문항을 만들고 근거는 지문에 있다", () => {
    const passage: Passage = {
      ...LIBRARY_PASSAGES[2],
      id: "p_custom",
      ownerId: "u_t",
      text: "바다는 지구 표면의 대부분을 덮고 있다. 바닷물은 염분이 높다. 해류는 열을 운반한다. 깊은 바다는 빛이 거의 없다. 산호초는 많은 생물의 서식지이다. 조류는 달의 인력과 관계가 있다.",
    };
    const result = demoGenerate(passage, { mcqCount: 1, oxCount: 2, difficulty: "하" });
    expect(result.items.length).toBeGreaterThan(0);
    for (const q of result.items) {
      expect(q.answerIndex).toBeLessThan(q.choices.length);
      for (const e of q.evidence) expect(evidenceExists(passage.text, e)).toBe(true);
      expect(q.verification.status).toBe("unverified");
    }
  });

  it("규칙 기반 5지선다는 문항마다 다른 문장을 정답으로 쓴다", () => {
    const passage: Passage = {
      ...LIBRARY_PASSAGES[2],
      id: "p_custom2",
      ownerId: "u_t",
      text: "바다는 지구 표면의 대부분을 덮고 있다. 바닷물은 염분이 높다. 해류는 열을 운반한다. 깊은 바다는 빛이 거의 없다. 산호초는 많은 생물의 서식지이다. 조류는 달의 인력과 관계가 있다.",
    };
    const { items } = demoGenerate(passage, { mcqCount: 3, oxCount: 0, difficulty: "하" });
    const answers = items.map((q) => q.choices[q.answerIndex]);
    expect(new Set(answers).size).toBe(items.length);
    for (const q of items) expect(q.choices.some((c) => c.includes("거의 있다"))).toBe(false);
  });

  it("문장을 반대로 바꾼다", () => {
    expect(negate("바닷물은 염분이 높다.")).toBe("바닷물은 염분이 낮다.");
    expect(negate("해류는 열을 운반한다.")).toBe("해류는 열을 운반하지 않는다.");
  });
});
