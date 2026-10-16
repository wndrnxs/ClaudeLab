import { notFound } from "next/navigation";
import { TextLink } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { ResultView } from "./ResultView";
import { TakeAssignment } from "./TakeAssignment";

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await requireRole("student");
  const { id } = await params;
  const db = await readDb();
  const assignment = db.assignments.find((a) => a.id === id && student.classIds.includes(a.classId));
  if (!assignment) notFound();
  const passage = db.passages.find((p) => p.id === assignment.passageId);
  if (!passage) notFound();
  const submission = db.submissions.find((s) => s.assignmentId === id && s.studentId === student.id);

  return (
    <>
      <div className="mb-1 text-xs text-ink-3">
        <TextLink href="/student">내 과제</TextLink> / {assignment.title}
      </div>
      {submission ? (
        <ResultView title={assignment.title} passage={passage} items={assignment.items} submission={submission} />
      ) : (
        <TakeAssignment
          assignmentId={assignment.id}
          title={assignment.title}
          passage={passage}
          requireReason={assignment.requireReason}
          // 제출 전에는 정답·해설·근거를 브라우저로 보내지 않습니다.
          items={assignment.items.map((q) => ({ id: q.id, type: q.type, stem: q.stem, choices: q.choices }))}
        />
      )}
    </>
  );
}
