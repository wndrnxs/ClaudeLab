import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { assignmentForStudent } from "@/lib/access";
import { type IdCtx, json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { grade } from "@/lib/grading";
import { newId } from "@/lib/ids";
import type { Submission } from "@/lib/types";

const Body = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      choiceIndex: z.number().int().min(0),
      reason: z.string().trim().max(300),
      confidence: z.enum(["sure", "unsure", "guess"]),
    }),
  ),
});

export const POST = route(async (req, { params }: IdCtx) => {
  const student = await requireApiRole("student");
  const { id } = await params;
  const { answers } = await parseBody(req, Body);
  await updateDb((db) => {
    const assignment = assignmentForStudent(db, student, id);
    if (db.submissions.some((s) => s.assignmentId === id && s.studentId === student.id)) {
      throw new HttpError(409, "이미 제출한 과제입니다.");
    }
    const byId = new Map(answers.map((a) => [a.questionId, a]));
    assignment.items.forEach((q, i) => {
      const ans = byId.get(q.id);
      if (!ans || ans.choiceIndex >= q.choices.length) throw new HttpError(400, `${i + 1}번 문항의 답을 선택해 주세요.`);
      if (assignment.requireReason && ans.reason.length < 2) {
        throw new HttpError(400, `${i + 1}번 문항에 답을 고른 이유를 적어 주세요.`);
      }
    });
    const ordered = assignment.items.map((q) => byId.get(q.id)!);
    const submission: Submission = {
      id: newId("sub"),
      assignmentId: id,
      studentId: student.id,
      answers: ordered,
      ...grade(assignment.items, ordered),
      submittedAt: new Date().toISOString(),
    };
    db.submissions.push(submission);
    // 새 제출이 생기면 이전 오답 분석은 오래된 결과가 됩니다.
    if (assignment.insights) assignment.insights = undefined;
  });
  return json({ ok: true }, 201);
});
