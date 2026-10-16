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
      <PageTitle
        title="약점 분석"
        sub="지금까지 푼 문항을 평가 요소별로 나눠 보고, 확신하고 틀린 문항(잘못 알고 있는 개념)을 찾아 줍니다."
      />
      <StudentReportView report={studentReport(db, student)} viewer="student" />
    </>
  );
}
