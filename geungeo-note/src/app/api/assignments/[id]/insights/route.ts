import { HttpError, requireApiRole } from "@/lib/auth";
import { assignmentForTeacher } from "@/lib/access";
import { buildInsights } from "@/lib/ai/pipeline";
import { assignmentStats } from "@/lib/analytics";
import { type IdCtx, json, route } from "@/lib/api";
import { readDb, updateDb } from "@/lib/db";

export const maxDuration = 300;

export const POST = route(async (_req, { params }: IdCtx) => {
  const teacher = await requireApiRole("teacher");
  const { id } = await params;
  const db = await readDb();
  const assignment = assignmentForTeacher(db, teacher, id);
  const stats = assignmentStats(db, assignment);
  if (stats.submittedCount === 0) throw new HttpError(400, "아직 제출한 학생이 없습니다.");

  const insights = await buildInsights(stats);
  await updateDb((fresh) => {
    const a = assignmentForTeacher(fresh, teacher, id);
    a.insights = insights;
  });
  return json(insights);
});
