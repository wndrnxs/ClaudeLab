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

export function choiceLabel(question: Question, index: number): string {
  if (question.type === "ox") return question.choices[index] ?? "?";
  return CHOICE_MARKS[index] ?? `${index + 1}`;
}
