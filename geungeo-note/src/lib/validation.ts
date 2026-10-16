import { z } from "zod";
import { SKILL_IDS } from "./skills";

export const SpecSchema = z.object({
  mcqCount: z.number().int().min(0).max(10),
  oxCount: z.number().int().min(0).max(10),
  difficulty: z.enum(["하", "중", "상"]),
  focusSkill: z.enum(SKILL_IDS).optional(),
  note: z.string().max(300).optional(),
});

/** 교사가 편집기에서 저장하는 문항 */
export const EditableQuestionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["mcq", "ox"]),
    stem: z.string().trim().min(1, "발문을 입력해 주세요.").max(2000),
    choices: z.array(z.string().trim().min(1, "빈 선지가 있습니다.").max(500)).min(2).max(5),
    answerIndex: z.number().int().min(0),
    explanation: z.string().max(2000),
    choiceNotes: z.array(z.string().max(500)),
    evidence: z.array(z.string().trim().max(1000)),
    skill: z.enum(SKILL_IDS),
    difficulty: z.enum(["하", "중", "상"]),
  })
  .refine((q) => q.answerIndex < q.choices.length, { message: "정답 번호가 선지 범위를 벗어났습니다." })
  .refine((q) => (q.type === "mcq" ? q.choices.length === 5 : q.choices.length === 2), {
    message: "5지선다는 선지 5개, OX는 2개여야 합니다.",
  });

export type EditableQuestion = z.infer<typeof EditableQuestionSchema>;
