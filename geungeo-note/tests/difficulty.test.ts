import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoGenerate } from "../src/lib/ai/demo";
import { readDb } from "../src/lib/db";
import { compareDifficulty, normalizeDifficulty } from "../src/lib/difficulty";
import { LIBRARY_PASSAGES } from "../src/lib/library";
import { buildSeedDatabase } from "../src/lib/seed";

describe("난이도", () => {
  it("실제 정답률을 예상 범위와 비교한다", () => {
    expect(compareDifficulty("csat", 0.39)).toBe("harder");
    expect(compareDifficulty("csat", 0.4)).toBe("as_expected");
    expect(compareDifficulty("csat", 0.6)).toBe("as_expected");
    expect(compareDifficulty("csat", 0.61)).toBe("easier");
    // 범위 끝: 기본은 100%도 예상 범위, 고난도는 0%도 예상 범위
    expect(compareDifficulty("basic", 1)).toBe("as_expected");
    expect(compareDifficulty("hard", 0)).toBe("as_expected");
  });

  it("예전 하/중/상 값을 새 난이도로 바꾼다", () => {
    expect(normalizeDifficulty("하")).toBe("basic");
    expect(normalizeDifficulty("중")).toBe("school");
    expect(normalizeDifficulty("상")).toBe("csat");
    expect(normalizeDifficulty("hard")).toBe("hard");
  });

  it("예전 형식으로 저장된 데이터를 읽을 때 난이도를 바꾼다", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "classpick-"));
    const legacy = buildSeedDatabase();
    for (const set of legacy.sets) {
      (set.spec as { difficulty: string }).difficulty = "상";
      for (const q of set.items) (q as { difficulty: string }).difficulty = "하";
    }
    writeFileSync(path.join(dir, "db.json"), JSON.stringify(legacy));
    const prev = process.env.DATA_DIR;
    process.env.DATA_DIR = dir;
    try {
      const db = await readDb();
      expect(db.sets.every((s) => s.spec.difficulty === "csat")).toBe(true);
      expect(db.sets.every((s) => s.items.every((q) => q.difficulty === "basic"))).toBe(true);
    } finally {
      process.env.DATA_DIR = prev;
    }
  });

  it("데모 모드는 요청한 난이도에 가까운 예시 문항부터 고른다", () => {
    const passage = LIBRARY_PASSAGES.find((p) => p.id === "lib_jdl_seosi")!;
    const hard = demoGenerate(passage, { mcqCount: 2, oxCount: 0, difficulty: "hard" });
    expect(hard.items.map((q) => q.difficulty)).toEqual(["hard", "hard"]);
    const basic = demoGenerate(passage, { mcqCount: 0, oxCount: 2, difficulty: "basic" });
    expect(basic.items.every((q) => q.difficulty === "basic")).toBe(true);
  });
});
