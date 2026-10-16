import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { passageForTeacher, setForTeacher } from "@/lib/access";
import { regenerateQuestion } from "@/lib/ai/pipeline";
import { type IdCtx, json, parseBody, route } from "@/lib/api";
import { readDb, updateDb } from "@/lib/db";

export const maxDuration = 300;

const Body = z.object({ questionId: z.string().min(1) });

export const POST = route(async (req, { params }: IdCtx) => {
  const teacher = await requireApiRole("teacher");
  const { id } = await params;
  const { questionId } = await parseBody(req, Body);
  const db = await readDb();
  const set = setForTeacher(db, teacher, id);
  const passage = passageForTeacher(db, teacher, set.passageId);
  const target = set.items.find((q) => q.id === questionId);
  if (!target) throw new HttpError(404, "문항을 찾을 수 없습니다.");

  const replacement = await regenerateQuestion(passage, target, set.items);

  const updated = await updateDb((fresh) => {
    const s = setForTeacher(fresh, teacher, id);
    const index = s.items.findIndex((q) => q.id === questionId);
    if (index === -1) throw new HttpError(409, "그사이 문항이 삭제되었습니다.");
    s.items[index] = replacement;
    s.reviewed = false;
    s.updatedAt = new Date().toISOString();
    return s;
  });
  return json(updated);
});
