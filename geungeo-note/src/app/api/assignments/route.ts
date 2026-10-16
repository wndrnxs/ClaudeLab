import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { setForTeacher } from "@/lib/access";
import { json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Assignment } from "@/lib/types";

const Body = z.object({
  setId: z.string().min(1),
  classId: z.string().min(1),
  title: z.string().trim().min(1, "과제 제목을 입력해 주세요.").max(100),
  dueAt: z.string().datetime({ offset: true }).optional(),
  requireReason: z.boolean(),
});

export const POST = route(async (req) => {
  const teacher = await requireApiRole("teacher");
  const body = await parseBody(req, Body);
  const assignment = await updateDb((db) => {
    const set = setForTeacher(db, teacher, body.setId);
    if (!set.reviewed) {
      throw new HttpError(400, "AI가 만든 문항은 선생님 검토 후에 배포할 수 있습니다. '검토 완료'를 먼저 체크해 주세요.");
    }
    const cls = db.classes.find((c) => c.id === body.classId && c.teacherId === teacher.id);
    if (!cls) throw new HttpError(404, "반을 찾을 수 없습니다.");
    const created: Assignment = {
      id: newId("a"),
      setId: set.id,
      classId: cls.id,
      teacherId: teacher.id,
      title: body.title,
      passageId: set.passageId,
      items: structuredClone(set.items),
      requireReason: body.requireReason,
      dueAt: body.dueAt,
      createdAt: new Date().toISOString(),
    };
    db.assignments.push(created);
    return created;
  });
  return json({ id: assignment.id }, 201);
});
