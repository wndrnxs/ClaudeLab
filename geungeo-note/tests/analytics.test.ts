import { describe, expect, it } from "vitest";
import { assignmentStats, classSkillSummary, rate, studentReport, weakestSkill } from "@/lib/analytics";
import { buildSeedDatabase } from "@/lib/seed";

const db = buildSeedDatabase(Date.UTC(2026, 9, 16));

describe("과제 통계", () => {
  const a1 = db.assignments.find((a) => a.id === "a_jdl")!;
  const stats = assignmentStats(db, a1);

  it("제출 인원과 문항별 정답률을 계산한다", () => {
    expect(stats.classSize).toBe(5);
    expect(stats.submittedCount).toBe(5);
    // 5번(반어) 문항: 박지우·강도윤만 정답
    const q5 = stats.questions[4];
    expect(q5.correct).toBe(2);
    expect(q5.correctRate).toBeCloseTo(0.4);
  });

  it("선지별 인원과 이유를 모으고, 확신 오답을 센다", () => {
    const q5 = stats.questions[4];
    const choice1 = q5.choices[0];
    expect(choice1.count).toBe(2);
    expect(choice1.reasons.map((r) => r.studentName).sort()).toEqual(["이서준", "최민서"]);
    expect(q5.sureButWrong).toBe(2);
    expect(q5.choices.reduce((s, c) => s + c.count, 0)).toBe(q5.responses);
  });

  it("미제출 학생은 점수가 없다", () => {
    const a2 = db.assignments.find((a) => a.id === "a_hi")!;
    const s2 = assignmentStats(db, a2);
    expect(s2.submittedCount).toBe(4);
    expect(s2.students.find((r) => r.student.loginId === "student1")?.score).toBeNull();
  });
});

describe("학생 약점 분석", () => {
  const student1 = db.users.find((u) => u.loginId === "student1")!;
  const report = studentReport(db, student1);

  it("푼 문항과 영역별 정답률을 계산한다", () => {
    expect(report.solvedQuestions).toBe(7);
    expect(report.overall.correct).toBe(4);
    expect(rate(report.bySkill.find((s) => s.skill === "structure")!.mine)).toBe(1);
  });

  it("확신하고 틀린 문항을 오개념 후보로 분리한다", () => {
    expect(report.misconceptions.map((w) => w.question.id)).toEqual(["bank_jdl_5"]);
    expect(report.wrongNotes).toHaveLength(3);
  });

  it("반 평균은 같은 과제의 전체 제출로 계산한다", () => {
    const appreciation = report.bySkill.find((s) => s.skill === "appreciation")!;
    expect(appreciation.classAverage.total).toBe(5);
    expect(appreciation.classAverage.correct).toBe(3);
  });

  it("반 전체에서 가장 약한 영역을 찾는다", () => {
    const tally = classSkillSummary(db, "c_demo");
    const weak = weakestSkill(tally);
    expect(weak).not.toBeNull();
    for (const t of Object.values(tally)) {
      if (t.total >= 2) expect(rate(t)!).toBeGreaterThanOrEqual(rate(tally[weak!])!);
    }
  });
});
