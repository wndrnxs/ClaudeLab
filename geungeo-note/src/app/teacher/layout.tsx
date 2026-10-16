import { TeacherShell } from "@/components/AppHeader";
import { aiMode } from "@/lib/ai/pipeline";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("teacher");
  const classes = (await readDb()).classes.filter((c) => c.teacherId === user.id);
  return (
    <TeacherShell user={user} classes={classes} aiMode={aiMode()}>
      {children}
    </TeacherShell>
  );
}
