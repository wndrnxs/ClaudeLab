import { StudentReportView } from "@/components/StudentReportView";
import { PageTitle } from "@/components/ui";
import { studentReport } from "@/lib/analytics";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";

export default async function StudentReportPage() {
  const student = await requireRole("student");
  const db = await readDb();
  return (
    <>
      <PageTitle eyebrow={student.name} title="약점 분석" sub="제출한 과제를 평가 요소별로 나누어 보고, 확신했는데 틀린 문항을 먼저 보여 줍니다." />
      <StudentReportView report={studentReport(db, student)} viewer="student" />
    </>
  );
}
