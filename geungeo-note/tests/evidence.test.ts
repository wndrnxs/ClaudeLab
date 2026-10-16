import { describe, expect, it } from "vitest";
import { evidenceExists, findEvidenceRanges, splitByRanges } from "@/lib/evidence";
import { LIBRARY_PASSAGES, QUESTION_BANK } from "@/lib/library";

const poem = "나 보기가 역겨워\n가실 때에는\n말없이 고이 보내 드리우리다";

describe("근거 문장 대조", () => {
  it("줄바꿈·공백 차이는 무시하고 찾는다", () => {
    expect(evidenceExists(poem, "나 보기가 역겨워 가실 때에는")).toBe(true);
    expect(evidenceExists(poem, "  말없이   고이 ")).toBe(true);
  });

  it("지문에 없는 문장은 찾지 못한다", () => {
    expect(evidenceExists(poem, "나 보기가 좋아")).toBe(false);
    expect(evidenceExists(poem, "")).toBe(false);
  });

  it("정규식 특수문자가 있어도 글자 그대로 비교한다", () => {
    expect(evidenceExists("값은 (a+b)*2이다.", "(a+b)*2")).toBe(true);
  });

  it("겹치는 구간은 합쳐서 하이라이트한다", () => {
    const ranges = findEvidenceRanges(poem, ["가실 때에는", "때에는 말없이"]);
    expect(ranges).toHaveLength(1);
    const segments = splitByRanges(poem, ranges);
    expect(segments.filter((s) => s.highlighted).map((s) => s.text)).toEqual(["가실 때에는\n말없이"]);
    expect(segments.map((s) => s.text).join("")).toBe(poem);
  });

  it("라이브러리 예시 문항의 근거는 모두 지문에 실제로 있다", () => {
    for (const passage of LIBRARY_PASSAGES) {
      for (const q of QUESTION_BANK[passage.id] ?? []) {
        for (const e of q.evidence) {
          expect(evidenceExists(passage.text, e), `${q.id}: ${e}`).toBe(true);
        }
      }
    }
  });
});
