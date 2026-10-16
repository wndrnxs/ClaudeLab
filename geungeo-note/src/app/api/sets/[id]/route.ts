import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { passageForTeacher, setForTeacher } from "@/lib/access";
import { checkEvidence } from "@/lib/ai/pipeline";
import { type IdCtx, json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import type { Question } from "@/lib/types";
import { EditableQuestionSchema } from "@/lib/validation";

const Body = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  items: z.array(EditableQuestionSchema).max(30).optional(),
  reviewed: z.boolean().optional(),
});

function contentKey(q: Pick<Question, "stem" | "bogi" | "choices" | "answerIndex" | "evidence" | "type">): string {
  return JSON.stringify([q.type, q.stem, q.bogi ?? "", q.choices, q.answerIndex, q.evidence]);
}

export const PATCH = route(async (req, { params }: IdCtx) => {
  const teacher = await requireApiRole("teacher");
  const { id } = await params;
  const body = await parseBody(req, Body);
  const updated = await updateDb((db) => {
    const set = setForTeacher(db, teacher, id);
    const passage = passageForTeacher(db, teacher, set.passageId);
    if (body.title !== undefined) set.title = body.title;
    if (body.items) {
      const previous = new Map(set.items.map((q) => [q.id, q]));
      set.items = body.items.map((edited) => {
        const before = previous.get(edited.id);
        const changed = !before || contentKey(before) !== contentKey(edited);
        const evidenceFound = checkEvidence(passage, edited);
        return {
          ...edited,
          // 내용이 바뀐 문항은 이전 검증 결과가 더 이상 유효하지 않습니다.
          verification: changed
            ? {
                status: "edited",
                solverAnswerIndex: null,
                evidenceFound,
                issues: [
                  "교사가 수정한 문항입니다. '재검증'을 눌러 다시 확인할 수 있습니다.",
                  ...(evidenceFound ? [] : ["근거 문장이 지문에서 그대로 확인되지 않습니다."]),
                ],
              }
            : before.verification,
        } satisfies Question;
      });
      // 문항이 바뀌면 검토 완료 표시를 다시 받습니다.
      if (body.reviewed === undefined) set.reviewed = false;
    }
    if (body.reviewed !== undefined) set.reviewed = body.reviewed;
    set.updatedAt = new Date().toISOString();
    return set;
  });
  return json(updated);
});

export const DELETE = route(async (_req, { params }: IdCtx) => {
  const teacher = await requireApiRole("teacher");
  const { id } = await params;
  await updateDb((db) => {
    setForTeacher(db, teacher, id);
    db.sets = db.sets.filter((s) => s.id !== id);
  });
  return json({ ok: true });
});
