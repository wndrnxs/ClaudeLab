import type { Answer, Question } from "./types";

export function isCorrect(question: Question, answer: Answer | undefined): boolean {
  return !!answer && answer.choiceIndex === question.answerIndex;
}

export function grade(items: Question[], answers: Answer[]): { correctCount: number; total: number } {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const correctCount = items.filter((q) => isCorrect(q, byId.get(q.id))).length;
  return { correctCount, total: items.length };
}

export const CHOICE_MARKS = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

/** ①은, ②는, ③은 … 처럼 선지 번호를 읽는 소리에 맞는 조사 */
export function choiceTopic(question: Question, index: number): string {
  const label = choiceLabel(question, index);
  if (question.type === "ox") return `${label}는`;
  // 일(①)·삼(③)은 받침이 있어 '은', 이(②)·사(④)·오(⑤)는 '는'
  return `${label}${index === 0 || index === 2 || index === 5 ? "은" : "는"}`;
}

export function choiceLabel(question: Question, index: number): string {
  if (question.type === "ox") return question.choices[index] ?? "?";
  return CHOICE_MARKS[index] ?? `${index + 1}`;
}
