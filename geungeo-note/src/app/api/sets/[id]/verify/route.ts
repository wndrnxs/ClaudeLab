import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { passageForTeacher, setForTeacher } from "@/lib/access";
import { verifyQuestions } from "@/lib/ai/pipeline";
import { type IdCtx, json, parseBody, route } from "@/lib/api";
import { readDb, updateDb } from "@/lib/db";

export const maxDuration = 300;

const Body = z.object({ questionId: z.string().optional() });

export const POST = route(async (req, { params }: IdCtx) => {
  const teacher = await requireApiRole("teacher");
  const { id } = await params;
  const { questionId } = await parseBody(req, Body);
  const db = await readDb();
  const set = setForTeacher(db, teacher, id);
  const passage = passageForTeacher(db, teacher, set.passageId);
  const targets = questionId ? set.items.filter((q) => q.id === questionId) : set.items;
  if (targets.length === 0) throw new HttpError(404, "문항을 찾을 수 없습니다.");

  // 다시 검증할 때는 이전 결과를 지우고 처음부터 확인합니다.
  const reset = targets.map((q) => ({
    ...q,
    verification: { status: "unverified" as const, solverAnswerIndex: null, evidenceFound: false, issues: [] },
  }));
  const verified = await verifyQuestions(passage, reset);
  const byId = new Map(verified.map((q) => [q.id, q]));

  const updated = await updateDb((fresh) => {
    const s = setForTeacher(fresh, teacher, id);
    // 검증하는 동안 교사가 문항을 고쳤다면 그 문항의 결과는 반영하지 않습니다.
    const original = new Map(targets.map((q) => [q.id, JSON.stringify([q.stem, q.choices, q.answerIndex])]));
    s.items = s.items.map((q) => {
      const v = byId.get(q.id);
      return v && original.get(q.id) === JSON.stringify([q.stem, q.choices, q.answerIndex])
        ? { ...q, verification: v.verification }
        : q;
    });
    s.updatedAt = new Date().toISOString();
    return s;
  });
  return json(updated);
});
