import { isCorrect } from "./grading";
import { SKILLS } from "./skills";
import type {
  Assignment,
  Confidence,
  Database,
  Genre,
  Question,
  SkillId,
  Submission,
  User,
} from "./types";

export interface Tally {
  correct: number;
  total: number;
}

export function rate(t: Tally): number | null {
  return t.total === 0 ? null : t.correct / t.total;
}

function emptySkillTally(): Record<SkillId, Tally> {
  return Object.fromEntries(SKILLS.map((s) => [s.id, { correct: 0, total: 0 }])) as Record<SkillId, Tally>;
}

/* ───────────────────────── 교사용: 과제 통계 ───────────────────────── */

export interface ReasonEntry {
  studentId: string;
  studentName: string;
  reason: string;
  confidence: Confidence;
}

export interface ChoiceStat {
  index: number;
  count: number;
  isAnswer: boolean;
  reasons: ReasonEntry[];
}

export interface QuestionStat {
  question: Question;
  number: number;
  responses: number;
  correct: number;
  correctRate: number | null;
  choices: ChoiceStat[];
  /** 확신했는데 틀린 학생 수: 오개념 신호 */
  sureButWrong: number;
  /** 찍어서 맞힌 학생 수: 운으로 맞힌 정답 */
  guessedRight: number;
}

export interface StudentRow {
  student: User;
  submission: Submission | null;
  score: number | null;
  skill: Record<SkillId, Tally>;
}

export interface AssignmentStats {
  assignment: Assignment;
  classSize: number;
  submittedCount: number;
  averageRate: number | null;
  questions: QuestionStat[];
  students: StudentRow[];
  skill: Record<SkillId, Tally>;
}

export function assignmentStats(db: Database, assignment: Assignment): AssignmentStats {
  const students = db.users.filter((u) => u.role === "student" && u.classIds.includes(assignment.classId));
  const subs = db.submissions.filter((s) => s.assignmentId === assignment.id);
  const subByStudent = new Map(subs.map((s) => [s.studentId, s]));
  const nameOf = new Map(db.users.map((u) => [u.id, u.name]));

  const questions: QuestionStat[] = assignment.items.map((q, i) => {
    const choices: ChoiceStat[] = q.choices.map((_, idx) => ({
      index: idx,
      count: 0,
      isAnswer: idx === q.answerIndex,
      reasons: [],
    }));
    let correct = 0;
    let responses = 0;
    let sureButWrong = 0;
    let guessedRight = 0;
    for (const sub of subs) {
      const ans = sub.answers.find((a) => a.questionId === q.id);
      if (!ans || !choices[ans.choiceIndex]) continue;
      responses++;
      const ok = isCorrect(q, ans);
      if (ok) correct++;
      if (!ok && ans.confidence === "sure") sureButWrong++;
      if (ok && ans.confidence === "guess") guessedRight++;
      choices[ans.choiceIndex].count++;
      choices[ans.choiceIndex].reasons.push({
        studentId: sub.studentId,
        studentName: nameOf.get(sub.studentId) ?? "(알 수 없음)",
        reason: ans.reason,
        confidence: ans.confidence,
      });
    }
    return {
      question: q,
      number: i + 1,
      responses,
      correct,
      correctRate: responses ? correct / responses : null,
      choices,
      sureButWrong,
      guessedRight,
    };
  });

  const classSkill = emptySkillTally();
  const rows: StudentRow[] = students.map((student) => {
    const sub = subByStudent.get(student.id) ?? null;
    const skill = emptySkillTally();
    if (sub) {
      for (const q of assignment.items) {
        const ok = isCorrect(q, sub.answers.find((a) => a.questionId === q.id));
        for (const t of [skill[q.skill], classSkill[q.skill]]) {
          t.total++;
          if (ok) t.correct++;
        }
      }
    }
    return { student, submission: sub, score: sub ? sub.correctCount / sub.total : null, skill };
  });

  const submitted = rows.filter((r) => r.score !== null);
  const averageRate = submitted.length
    ? submitted.reduce((sum, r) => sum + (r.score ?? 0), 0) / submitted.length
    : null;

  return {
    assignment,
    classSize: students.length,
    submittedCount: submitted.length,
    averageRate,
    questions,
    students: rows,
    skill: classSkill,
  };
}

/* ───────────────────────── 학생용: 약점 분석 ───────────────────────── */

export interface WrongNote {
  assignmentId: string;
  assignmentTitle: string;
  question: Question;
  number: number;
  myChoice: number;
  myReason: string;
  confidence: Confidence;
  submittedAt: string;
}

export interface SkillInsight {
  skill: SkillId;
  mine: Tally;
  classAverage: Tally;
}

export interface StudentReport {
  solvedQuestions: number;
  overall: Tally;
  bySkill: SkillInsight[];
  byGenre: Record<Genre, Tally>;
  calibration: Record<Confidence, Tally>;
  /** 확신했는데 틀린 문항: 잘못 알고 있을 가능성이 큰 부분 */
  misconceptions: WrongNote[];
  wrongNotes: WrongNote[];
  /** 정답률이 낮은 순서의 약점 영역(2문항 이상 푼 영역만) */
  weakest: SkillInsight[];
  history: { assignmentId: string; title: string; rate: number; submittedAt: string }[];
}

export function studentReport(db: Database, student: User): StudentReport {
  const passageGenre = new Map(db.passages.map((p) => [p.id, p.genre]));
  const assignmentsById = new Map(db.assignments.map((a) => [a.id, a]));
  const mySubs = db.submissions
    .filter((s) => s.studentId === student.id)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const mine = emptySkillTally();
  const classTally = emptySkillTally();
  const byGenre: Record<Genre, Tally> = { 문학: { correct: 0, total: 0 }, 독서: { correct: 0, total: 0 } };
  const calibration: Record<Confidence, Tally> = {
    sure: { correct: 0, total: 0 },
    unsure: { correct: 0, total: 0 },
    guess: { correct: 0, total: 0 },
  };
  const overall: Tally = { correct: 0, total: 0 };
  const wrongNotes: WrongNote[] = [];
  const history: StudentReport["history"] = [];

  for (const sub of mySubs) {
    const assignment = assignmentsById.get(sub.assignmentId);
    if (!assignment) continue;
    history.push({
      assignmentId: assignment.id,
      title: assignment.title,
      rate: sub.correctCount / sub.total,
      submittedAt: sub.submittedAt,
    });
    const genre = passageGenre.get(assignment.passageId);
    assignment.items.forEach((q, i) => {
      const ans = sub.answers.find((a) => a.questionId === q.id);
      if (!ans) return;
      const ok = isCorrect(q, ans);
      for (const t of [mine[q.skill], overall, calibration[ans.confidence], genre ? byGenre[genre] : null]) {
        if (!t) continue;
        t.total++;
        if (ok) t.correct++;
      }
      if (!ok) {
        wrongNotes.push({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          question: q,
          number: i + 1,
          myChoice: ans.choiceIndex,
          myReason: ans.reason,
          confidence: ans.confidence,
          submittedAt: sub.submittedAt,
        });
      }
    });
  }

  // 반 평균: 내가 속한 반 학생들이 같은 과제에서 받은 결과(개인 식별 정보 없이 합계만)
  const myAssignmentIds = new Set(mySubs.map((s) => s.assignmentId));
  for (const sub of db.submissions) {
    if (!myAssignmentIds.has(sub.assignmentId)) continue;
    const assignment = assignmentsById.get(sub.assignmentId);
    if (!assignment) continue;
    for (const q of assignment.items) {
      const ans = sub.answers.find((a) => a.questionId === q.id);
      if (!ans) continue;
      classTally[q.skill].total++;
      if (isCorrect(q, ans)) classTally[q.skill].correct++;
    }
  }

  const bySkill: SkillInsight[] = SKILLS.map((s) => ({
    skill: s.id,
    mine: mine[s.id],
    classAverage: classTally[s.id],
  }));

  const weakest = bySkill
    .filter((s) => s.mine.total >= 2 && (rate(s.mine) ?? 1) < 0.8)
    .sort((a, b) => (rate(a.mine) ?? 1) - (rate(b.mine) ?? 1));

  wrongNotes.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return {
    solvedQuestions: overall.total,
    overall,
    bySkill,
    byGenre,
    calibration,
    misconceptions: wrongNotes.filter((w) => w.confidence === "sure"),
    wrongNotes,
    weakest,
    history,
  };
}

/* ───────────────────────── 교사용: 반 전체 약점 ───────────────────────── */

export function classSkillSummary(db: Database, classId: string): Record<SkillId, Tally> {
  const tally = emptySkillTally();
  const assignments = db.assignments.filter((a) => a.classId === classId);
  for (const assignment of assignments) {
    for (const sub of db.submissions.filter((s) => s.assignmentId === assignment.id)) {
      for (const q of assignment.items) {
        const ans = sub.answers.find((a) => a.questionId === q.id);
        if (!ans) continue;
        tally[q.skill].total++;
        if (isCorrect(q, ans)) tally[q.skill].correct++;
      }
    }
  }
  return tally;
}

export function weakestSkill(tally: Record<SkillId, Tally>): SkillId | null {
  let worst: SkillId | null = null;
  let worstRate = Infinity;
  for (const s of SKILLS) {
    const r = rate(tally[s.id]);
    if (r !== null && tally[s.id].total >= 2 && r < worstRate) {
      worst = s.id;
      worstRate = r;
    }
  }
  return worst;
}
