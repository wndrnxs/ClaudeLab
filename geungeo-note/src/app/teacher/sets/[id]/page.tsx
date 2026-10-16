import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { SetEditor } from "./SetEditor";

export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const db = await readDb();
  const set = db.sets.find((s) => s.id === id && s.teacherId === teacher.id);
  if (!set) notFound();
  const passage = db.passages.find((p) => p.id === set.passageId);
  if (!passage) notFound();
  const classes = db.classes.filter((c) => c.teacherId === teacher.id);
  const assignments = db.assignments
    .filter((a) => a.setId === set.id)
    .map((a) => ({ id: a.id, title: a.title, className: classes.find((c) => c.id === a.classId)?.name ?? "" }));

  return <SetEditor initialSet={set} passage={passage} classes={classes} assignments={assignments} />;
}
