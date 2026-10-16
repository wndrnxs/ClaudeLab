import { notFound } from "next/navigation";
import { StudentReportView } from "@/components/StudentReportView";
import { PageTitle } from "@/components/ui";
import { studentReport } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";

export default async function TeacherStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("teacher");
  const { id } = await params;
  const db = await readDb();
  const myClassIds = new Set(db.classes.filter((c) => c.teacherId === teacher.id).map((c) => c.id));
  const student = db.users.find((u) => u.id === id && u.role === "student" && u.classIds.some((c) => myClassIds.has(c)));
  if (!student) notFound();
  const classNames = db.classes.filter((c) => student.classIds.includes(c.id) && myClassIds.has(c.id)).map((c) => c.name);

  return (
    <>
      <PageTitle eyebrow={`${classNames.join(", ")} · 학생 화면과 같은 분석`} title={`${student.name} 학생`} />
      <StudentReportView report={studentReport(db, student)} viewer="teacher" />
    </>
  );
}
