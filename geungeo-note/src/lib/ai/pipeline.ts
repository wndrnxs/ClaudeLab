import type { AssignmentStats } from "../analytics";
import { evidenceExists } from "../evidence";
import { choiceLabel } from "../grading";
import { newId } from "../ids";
import type { AssignmentInsights, GenerationSpec, Passage, Question, Verification } from "../types";
import { callStructured, hasClaudeKey } from "./claude";
import { demoGenerate, demoInsight } from "./demo";
import {
  GENERATE_SYSTEM,
  INSIGHTS_SYSTEM,
  VERIFY_SYSTEM,
  generateUserPrompt,
  verifyUserPrompt,
} from "./prompts";
import {
  type GeneratedQuestion,
  GenerationOutputSchema,
  InsightsOutputSchema,
  VerificationOutputSchema,
} from "./schemas";

/**
 * 문항 생성 파이프라인
 *   1) 생성: Claude가 구조화된 JSON으로 문항·선지·정답·해설·근거를 만듭니다.
 *   2) 형식 검사: 선지 개수, 정답 번호, 선지별 근거 개수를 확인합니다.
 *   3) 근거 확인: 인용한 근거 문장이 실제 지문에 있는지 코드로 대조합니다.
 *   4) 풀이 검증: 정답을 숨긴 채 Claude가 다시 풀어 보고, 정답 불일치·복수 정답을 찾아냅니다.
 */

export function aiMode(): "claude" | "demo" {
  return hasClaudeKey() ? "claude" : "demo";
}

export function checkEvidence(passage: Passage, q: Pick<Question, "evidence">): boolean {
  return q.evidence.length > 0 && q.evidence.every((e) => evidenceExists(passage.text, e));
}

/** AI 출력을 앱의 문항 형식으로 맞추고, 형식 문제를 issues로 기록합니다. */
export function normalizeGenerated(g: GeneratedQuestion): { question: Question; issues: string[] } {
  const issues: string[] = [];
  let choices = g.choices.map((c) => c.trim()).filter(Boolean);
  if (g.type === "ox") {
    if (choices.length !== 2 || choices[0] !== "O" || choices[1] !== "X") choices = ["O", "X"];
  } else if (choices.length !== 5) {
    issues.push(`선지가 ${choices.length}개입니다(5개 필요).`);
  }
  let answerIndex = g.answerIndex;
  if (answerIndex < 0 || answerIndex >= choices.length) {
    issues.push("정답 번호가 선지 범위를 벗어났습니다.");
    answerIndex = 0;
  }
  const choiceNotes = choices.map((_, i) => g.choiceNotes[i]?.trim() ?? "");
  if (g.choiceNotes.length !== choices.length) issues.push("선지별 근거 개수가 선지 수와 다릅니다.");
  const question: Question = {
    id: newId("q"),
    type: g.type,
    stem: g.stem.trim(),
    choices,
    answerIndex,
    explanation: g.explanation.trim(),
    choiceNotes,
    evidence: g.evidence.map((e) => e.trim()).filter(Boolean),
    skill: g.skill,
    difficulty: g.difficulty,
    verification: { status: "unverified", solverAnswerIndex: null, evidenceFound: false, issues: [] },
  };
  return { question, issues };
}

/** 정답을 숨긴 풀이 결과와 근거 확인 결과를 합쳐 검증 상태를 정합니다. */
export function combineVerification(
  q: Question,
  evidenceFound: boolean,
  solver: { chosenIndex: number; alsoDefensible: number[]; issue: string } | null,
  formatIssues: string[] = [],
): Verification {
  const issues = [...formatIssues];
  if (!evidenceFound) issues.push("근거 문장이 지문에서 그대로 확인되지 않습니다.");
  if (solver) {
    if (solver.chosenIndex !== q.answerIndex) {
      issues.push(`AI 풀이에서 ${choiceLabel(q, solver.chosenIndex)}을(를) 정답으로 골랐습니다(출제 정답: ${choiceLabel(q, q.answerIndex)}).`);
    }
    const others = [...new Set(solver.alsoDefensible)].filter(
      (i) => i !== q.answerIndex && i >= 0 && i < q.choices.length,
    );
    if (others.length) {
      issues.push(`복수 정답 의심: ${others.map((i) => choiceLabel(q, i)).join(", ")}도 정답으로 볼 여지가 있습니다.`);
    }
    if (solver.issue.trim()) issues.push(solver.issue.trim());
  }
  return {
    status: solver ? (issues.length ? "flagged" : "passed") : issues.length ? "flagged" : "unverified",
    solverAnswerIndex: solver?.chosenIndex ?? null,
    evidenceFound,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

/** 문항들을 검증합니다. 데모 모드에서는 근거 확인만 하고 기존 상태를 유지합니다. */
export async function verifyQuestions(
  passage: Passage,
  items: Question[],
  formatIssues: Map<string, string[]> = new Map(),
): Promise<Question[]> {
  if (items.length === 0) return items;
  if (aiMode() === "demo") {
    return items.map((q) => {
      const evidenceFound = checkEvidence(passage, q);
      if (q.verification.status === "passed" && evidenceFound) return q;
      const base = combineVerification(q, evidenceFound, null, formatIssues.get(q.id));
      const demoNote = "데모 모드: AI 풀이 검증을 실행하지 않았습니다. API 키를 설정하면 자동 검증됩니다.";
      return { ...q, verification: { ...base, issues: [...base.issues, demoNote] } };
    });
  }
  const output = await callStructured({
    system: VERIFY_SYSTEM,
    user: verifyUserPrompt(passage, items),
    schema: VerificationOutputSchema,
    effort: "medium",
  });
  return items.map((q, i) => {
    const result = output.results.find((r) => r.number === i + 1) ?? null;
    const solver = result ?? { chosenIndex: -1, alsoDefensible: [], issue: "검토 결과가 누락되었습니다." };
    return { ...q, verification: combineVerification(q, checkEvidence(passage, q), solver, formatIssues.get(q.id)) };
  });
}

export interface GenerationResult {
  title: string;
  items: Question[];
  source: "claude" | "demo";
  warnings: string[];
}

export async function generateSet(passage: Passage, spec: GenerationSpec): Promise<GenerationResult> {
  if (aiMode() === "demo") {
    const demo = demoGenerate(passage, spec);
    return { ...demo, items: await verifyQuestions(passage, demo.items), source: "demo" };
  }
  const output = await callStructured({
    system: GENERATE_SYSTEM,
    user: generateUserPrompt(passage, spec),
    schema: GenerationOutputSchema,
    effort: "high",
  });
  const formatIssues = new Map<string, string[]>();
  const items = output.questions.map((g) => {
    const { question, issues } = normalizeGenerated(g);
    if (issues.length) formatIssues.set(question.id, issues);
    return question;
  });
  const warnings: string[] = [];
  if (items.length !== spec.mcqCount + spec.oxCount) {
    warnings.push(`요청한 ${spec.mcqCount + spec.oxCount}문항 중 ${items.length}문항이 생성되었습니다.`);
  }
  return {
    title: output.title.trim() || `${passage.title} 문항 세트`,
    items: await verifyQuestions(passage, items, formatIssues),
    source: "claude",
    warnings,
  };
}

/** 문항 하나를 같은 유형·평가 요소로 다시 만듭니다. */
export async function regenerateQuestion(passage: Passage, target: Question, siblings: Question[]): Promise<Question> {
  const spec: GenerationSpec = {
    mcqCount: target.type === "mcq" ? 1 : 0,
    oxCount: target.type === "ox" ? 1 : 0,
    difficulty: target.difficulty,
    focusSkill: target.skill,
  };
  const avoid = siblings.map((q) => q.stem);
  if (aiMode() === "demo") {
    const demo = demoGenerate(passage, spec, avoid);
    const next = demo.items[0];
    if (!next) throw new Error("데모 모드에서 새 문항을 더 만들 수 없습니다. API 키를 설정해 주세요.");
    const [verified] = await verifyQuestions(passage, [next]);
    return verified;
  }
  const output = await callStructured({
    system: GENERATE_SYSTEM,
    user: generateUserPrompt(passage, spec, avoid),
    schema: GenerationOutputSchema,
    effort: "high",
  });
  const first = output.questions[0];
  if (!first) throw new Error("새 문항이 생성되지 않았습니다. 다시 시도해 주세요.");
  const { question, issues } = normalizeGenerated(first);
  const [verified] = await verifyQuestions(passage, [question], new Map([[question.id, issues]]));
  return verified;
}

/** 오답 이유 분석: 학생 이름은 빼고 이유만 보냅니다. */
export async function buildInsights(stats: AssignmentStats): Promise<AssignmentInsights> {
  const targets = stats.questions.filter((s) => s.choices.some((c) => !c.isAnswer && c.count > 0));
  const base = { generatedAt: new Date().toISOString(), submissionCount: stats.submittedCount };
  if (aiMode() === "demo" || targets.length === 0) {
    return {
      ...base,
      source: "demo",
      questions: targets.map(demoInsight).filter((x): x is NonNullable<typeof x> => x !== null),
    };
  }
  const confidenceLabel = { sure: "확신", unsure: "애매", guess: "찍음" } as const;
  const user = targets
    .map((s) => {
      const q = s.question;
      const choices = q.choices.map((c, i) => `  (${i}) ${c}${i === q.answerIndex ? "  ← 정답" : ""}`).join("\n");
      const wrong = s.choices
        .filter((c) => !c.isAnswer && c.count > 0)
        .map(
          (c) =>
            `  선지 (${c.index})를 고른 학생 ${c.count}명의 이유:\n` +
            c.reasons.map((r) => `    - [${confidenceLabel[r.confidence]}] ${r.reason || "(이유 없음)"}`).join("\n"),
        )
        .join("\n");
      return `문항 ${s.number}. ${q.stem}\n${choices}\n해설: ${q.explanation}\n응답 ${s.responses}명, 정답 ${s.correct}명\n${wrong}`;
    })
    .join("\n\n");
  const output = await callStructured({
    system: INSIGHTS_SYSTEM,
    user,
    schema: InsightsOutputSchema,
    effort: "medium",
  });
  return {
    ...base,
    source: "claude",
    questions: output.questions
      .map((o) => {
        const stat = stats.questions.find((s) => s.number === o.number);
        if (!stat) return null;
        return {
          questionId: stat.question.id,
          summary: o.summary,
          misconceptions: o.misconceptions,
          teachingTip: o.teachingTip,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  };
}
