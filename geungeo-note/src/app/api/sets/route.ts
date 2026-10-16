import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { passageForTeacher } from "@/lib/access";
import { generateSet } from "@/lib/ai/pipeline";
import { json, parseBody, route } from "@/lib/api";
import { readDb, updateDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { QuestionSet } from "@/lib/types";
import { SpecSchema } from "@/lib/validation";

// 실제 AI 생성은 1~2분 걸릴 수 있습니다.
export const maxDuration = 300;

const Body = z.object({ passageId: z.string().min(1), spec: SpecSchema });

export const POST = route(async (req) => {
  const teacher = await requireApiRole("teacher");
  const { passageId, spec } = await parseBody(req, Body);
  if (spec.mcqCount + spec.oxCount === 0) throw new HttpError(400, "문항 수를 1개 이상 선택해 주세요.");
  const passage = passageForTeacher(await readDb(), teacher, passageId);

  const result = await generateSet(passage, spec);
  if (result.items.length === 0) throw new HttpError(422, "문항을 만들지 못했습니다. 지문 길이나 요청을 확인해 주세요.");

  const now = new Date().toISOString();
  const set: QuestionSet = {
    id: newId("s"),
    teacherId: teacher.id,
    passageId,
    title: result.title,
    spec,
    source: result.source,
    reviewed: false,
    items: result.items,
    createdAt: now,
    updatedAt: now,
  };
  await updateDb((db) => {
    db.sets.push(set);
  });
  return json({ id: set.id, warnings: result.warnings }, 201);
});
