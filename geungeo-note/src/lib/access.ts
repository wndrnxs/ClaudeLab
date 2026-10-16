import { HttpError } from "./auth";
import type { Assignment, Database, Passage, QuestionSet, User } from "./types";

/** 교사는 기본 라이브러리와 본인이 등록한 지문만 볼 수 있습니다. */
export function passageForTeacher(db: Database, teacher: User, passageId: string): Passage {
  const p = db.passages.find((x) => x.id === passageId);
  if (!p || (p.ownerId !== null && p.ownerId !== teacher.id)) throw new HttpError(404, "지문을 찾을 수 없습니다.");
  return p;
}

export function setForTeacher(db: Database, teacher: User, setId: string): QuestionSet {
  const s = db.sets.find((x) => x.id === setId);
  if (!s || s.teacherId !== teacher.id) throw new HttpError(404, "문항 세트를 찾을 수 없습니다.");
  return s;
}

export function assignmentForTeacher(db: Database, teacher: User, id: string): Assignment {
  const a = db.assignments.find((x) => x.id === id);
  if (!a || a.teacherId !== teacher.id) throw new HttpError(404, "과제를 찾을 수 없습니다.");
  return a;
}

/** 학생은 본인이 속한 반에 배포된 과제만 볼 수 있습니다. */
export function assignmentForStudent(db: Database, student: User, id: string): Assignment {
  const a = db.assignments.find((x) => x.id === id);
  if (!a || !student.classIds.includes(a.classId)) throw new HttpError(404, "과제를 찾을 수 없습니다.");
  return a;
}
