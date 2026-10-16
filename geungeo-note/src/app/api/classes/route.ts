import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { newId, newJoinCode } from "@/lib/ids";

const Body = z.object({ name: z.string().trim().min(1, "반 이름을 입력해 주세요.").max(40) });

export const POST = route(async (req) => {
  const teacher = await requireApiRole("teacher");
  const { name } = await parseBody(req, Body);
  const cls = await updateDb((db) => {
    let joinCode = newJoinCode();
    while (db.classes.some((c) => c.joinCode === joinCode)) joinCode = newJoinCode();
    const created = { id: newId("c"), teacherId: teacher.id, name, joinCode, createdAt: new Date().toISOString() };
    db.classes.push(created);
    return created;
  });
  return json(cls, 201);
});
