import { CHOICE_MARKS, choiceLabel } from "../grading";
import { newId } from "../ids";
import { QUESTION_BANK } from "../library";
import { SKILL_MAP } from "../skills";
import type { GenerationSpec, Passage, Question, QuestionInsight, QuestionType } from "../types";
import type { QuestionStat } from "../analytics";

/**
 * 데모 모드(API 키 없음)용 생성기.
 * - 라이브러리 지문: 미리 검수한 문항 은행에서 골라 줍니다.
 * - 그 밖의 지문: 문장을 바꿔 쓰는 규칙 기반 '내용 일치' 문항을 만듭니다(품질은 실제 AI보다 낮습니다).
 */

const DEMO_ISSUE = "데모 모드: AI 풀이 검증을 실행하지 않았습니다. API 키를 설정하면 자동 검증됩니다.";

function cloneWithNewId(q: Question): Question {
  return { ...structuredClone(q), id: newId("q") };
}

function fromBank(passageId: string, type: QuestionType, count: number, spec: GenerationSpec, excludeStems: Set<string>): Question[] {
  const bank = (QUESTION_BANK[passageId] ?? []).filter((q) => q.type === type && !excludeStems.has(q.stem));
  const focused = spec.focusSkill ? bank.filter((q) => q.skill === spec.focusSkill) : [];
  const rest = bank.filter((q) => !focused.includes(q));
  return [...focused, ...rest].slice(0, count).map(cloneWithNewId);
}

/* ── 규칙 기반 생성 ── */

const NEGATIONS: [RegExp, string][] = [
  [/높(?=[게다은아])/, "낮"],
  [/낮(?=[게다은아])/, "높"],
  [/많(?=[이다은아])/, "적"],
  [/크게/, "작게"],
  [/있다(?=[.]?$)/, "없다"],
  [/없다(?=[.]?$)/, "있다"],
  [/한다(?=[.]?$)/, "하지 않는다"],
  [/된다(?=[.]?$)/, "되지 않는다"],
  [/이다(?=[.]?$)/, "이 아니다"],
  [/보다/, "만큼"],
];

export function negate(sentence: string): string | null {
  for (const [re, replacement] of NEGATIONS) {
    // '거의 없다'를 '거의 있다'로 바꾸면 어색한 문장이 되므로 건너뜁니다.
    if (replacement === "있다" && /거의\s*없다/.test(sentence)) continue;
    if (re.test(sentence)) {
      const changed = sentence.replace(re, replacement);
      if (changed !== sentence) return changed;
    }
  }
  return null;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 140);
}

function unverified(evidence: string[]): Question["verification"] {
  return { status: "unverified", solverAnswerIndex: null, evidenceFound: evidence.length > 0, issues: [DEMO_ISSUE] };
}

function heuristicOx(sentences: string[], count: number, offset: number): Question[] {
  const out: Question[] = [];
  for (let i = 0; i < sentences.length && out.length < count; i++) {
    const original = sentences[(i + offset) % sentences.length];
    const makeFalse = out.length % 2 === 1;
    const changed = makeFalse ? negate(original) : null;
    const statement = changed ?? original;
    const isTrue = changed === null;
    out.push({
      id: newId("q"),
      type: "ox",
      stem: `윗글의 내용과 일치한다: "${statement}"`,
      choices: ["O", "X"],
      answerIndex: isTrue ? 0 : 1,
      explanation: isTrue
        ? `지문에 "${original}"라고 나와 있습니다.`
        : `지문에는 "${original}"라고 되어 있어 진술과 다릅니다.`,
      choiceNotes: isTrue ? ["지문과 일치합니다.", "지문에 같은 내용이 있습니다."] : ["지문과 다릅니다.", "지문의 표현이 바뀌었습니다."],
      evidence: [original],
      skill: "fact",
      difficulty: "하",
      verification: unverified([original]),
    });
  }
  return out;
}

function heuristicMcq(sentences: string[], count: number, offset: number): Question[] {
  const out: Question[] = [];
  const negatable = sentences.map((s) => ({ s, neg: negate(s) })).filter((x) => x.neg);
  for (let n = 0; n < count && n < sentences.length; n++) {
    // 문항마다 서로 다른 문장을 정답으로 씁니다.
    const correct = sentences[(offset + n) % sentences.length];
    const candidates = negatable.filter((x) => x.s !== correct);
    if (!correct || candidates.length < 4) break;
    const start = (n * 4) % candidates.length;
    const pool = [...candidates.slice(start), ...candidates.slice(0, start)].slice(0, 4);
    const answerIndex = (offset + n) % 5;
    const wrong = pool.map((x) => x.neg as string);
    const choices = [...wrong];
    choices.splice(answerIndex, 0, correct);
    out.push({
      id: newId("q"),
      type: "mcq",
      stem: "윗글의 내용과 일치하는 것은?",
      choices,
      answerIndex,
      explanation: `${CHOICE_MARKS[answerIndex]}은 지문의 "${correct}"와 일치합니다. 나머지 선지는 지문의 표현을 반대로 바꾼 것입니다.`,
      choiceNotes: choices.map((c, i) =>
        i === answerIndex ? "지문과 일치합니다." : `지문에는 "${pool[i < answerIndex ? i : i - 1].s}"라고 되어 있습니다.`,
      ),
      evidence: [correct],
      skill: "fact",
      difficulty: "하",
      verification: unverified([correct]),
    });
  }
  return out;
}

export interface DemoResult {
  title: string;
  items: Question[];
  warnings: string[];
}

export function demoGenerate(passage: Passage, spec: GenerationSpec, existingStems: string[] = []): DemoResult {
  const exclude = new Set(existingStems);
  const warnings: string[] = [];
  const mcq = fromBank(passage.id, "mcq", spec.mcqCount, spec, exclude);
  const ox = fromBank(passage.id, "ox", spec.oxCount, spec, exclude);
  const sentences = splitSentences(passage.text);
  const offset = existingStems.length;
  if (mcq.length < spec.mcqCount) mcq.push(...heuristicMcq(sentences, spec.mcqCount - mcq.length, offset));
  if (ox.length < spec.oxCount) ox.push(...heuristicOx(sentences, spec.oxCount - ox.length, offset + mcq.length));
  const made = mcq.length + ox.length;
  if (made < spec.mcqCount + spec.oxCount) {
    warnings.push(
      `데모 모드에서는 지문 길이 때문에 ${made}문항만 만들었습니다. API 키를 설정하면 요청한 수만큼 생성됩니다.`,
    );
  }
  return { title: `${passage.title} 문항 세트`, items: [...mcq, ...ox], warnings };
}

export function demoInsight(stat: QuestionStat): QuestionInsight | null {
  const q = stat.question;
  const wrong = stat.choices.filter((c) => !c.isAnswer && c.count > 0).sort((a, b) => b.count - a.count);
  if (wrong.length === 0) return null;
  const top = wrong[0];
  const pct = stat.correctRate === null ? 0 : Math.round(stat.correctRate * 100);
  const summaryParts = [
    `정답률 ${pct}%. 가장 많이 고른 오답은 ${choiceLabel(q, top.index)}(${top.count}명)입니다.`,
  ];
  if (stat.sureButWrong > 0) {
    summaryParts.push(`확신하고 틀린 학생이 ${stat.sureButWrong}명으로, 개념을 잘못 이해하고 있을 가능성이 큽니다.`);
  }
  return {
    questionId: q.id,
    summary: summaryParts.join(" "),
    misconceptions: wrong.map((c) => {
      const said = c.reasons.map((r) => r.reason.trim()).filter((r) => r.length > 0 && !/찍|모르/.test(r));
      return {
        choiceIndex: c.index,
        pattern: said.length
          ? `학생 응답: "${said.slice(0, 2).join('", "')}" — ${q.choiceNotes[c.index] ?? ""}`
          : "근거를 적지 않았거나 추측으로 고른 응답입니다.",
        studentCount: c.count,
      };
    }),
    teachingTip: `${SKILL_MAP[q.skill].label} 문항입니다. 가장 많이 고른 오답 ${choiceLabel(q, top.index)}의 문제점(${q.choiceNotes[top.index] || "선지 근거 확인"})을 지문의 "${q.evidence[0] ?? ""}" 부분과 대조해 다시 짚어 주세요.`,
  };
}
