import { z } from "zod";
import { SKILL_IDS } from "../skills";

/** Claude가 돌려줄 문항 형식(구조화 출력). 최종 검사는 normalize 단계에서 다시 합니다. */
export const GeneratedQuestionSchema = z.object({
  type: z.enum(["mcq", "ox"]),
  stem: z.string().describe("발문. <보기>가 필요하면 발문 안에 함께 씁니다."),
  choices: z.array(z.string()).describe("mcq는 선지 5개, ox는 [\"O\", \"X\"]"),
  answerIndex: z.number().int().describe("정답 선지의 0부터 시작하는 번호"),
  explanation: z.string().describe("학생용 해설 2~3문장"),
  choiceNotes: z.array(z.string()).describe("선지별 판단 근거. choices와 같은 순서·개수"),
  evidence: z.array(z.string()).describe("지문에서 글자 그대로 복사한 근거 구절 1~3개"),
  skill: z.enum(SKILL_IDS),
  difficulty: z.enum(["하", "중", "상"]),
});

export const GenerationOutputSchema = z.object({
  title: z.string().describe("문항 세트 제목 제안"),
  questions: z.array(GeneratedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

export const VerificationOutputSchema = z.object({
  results: z.array(
    z.object({
      number: z.number().int().describe("문항 번호(1부터)"),
      chosenIndex: z.number().int().describe("직접 풀어 고른 선지의 0부터 시작하는 번호"),
      alsoDefensible: z
        .array(z.number().int())
        .describe("고른 답 외에 정답으로 볼 여지가 있는 선지 번호(0부터). 없으면 빈 배열"),
      issue: z.string().describe("발문·선지·근거의 문제점 한 문장. 없으면 빈 문자열"),
    }),
  ),
});

export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;

export const InsightsOutputSchema = z.object({
  questions: z.array(
    z.object({
      number: z.number().int(),
      summary: z.string().describe("이 문항에서 학생들이 어떻게 틀렸는지 1~2문장 요약"),
      misconceptions: z.array(
        z.object({
          choiceIndex: z.number().int().describe("오답 선지의 0부터 시작하는 번호"),
          pattern: z.string().describe("학생들이 그 선지를 고른 공통된 생각(오개념)"),
          studentCount: z.number().int(),
        }),
      ),
      teachingTip: z.string().describe("다음 수업에서 교사가 짚어 줄 내용 1~2문장"),
    }),
  ),
});

export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;
