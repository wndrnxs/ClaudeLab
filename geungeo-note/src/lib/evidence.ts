/**
 * 근거 문장 처리: AI가 인용한 근거가 실제 지문에 있는지 확인하고,
 * 화면에서 하이라이트할 위치를 찾습니다. 줄바꿈·공백 차이는 무시합니다.
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 공백 차이를 허용하는 정규식으로 변환 */
function flexiblePattern(quote: string): RegExp | null {
  const tokens = quote
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return null;
  return new RegExp(tokens.map(escapeRegExp).join("\\s+"), "g");
}

function normalizeQuotes(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

export function evidenceExists(passageText: string, quote: string): boolean {
  const re = flexiblePattern(quote);
  if (!re) return false;
  return re.test(normalizeQuotes(passageText));
}

export interface Range {
  start: number;
  end: number;
}

/** 근거 문장들이 지문의 어디에 있는지 찾아 겹치는 구간을 합쳐 반환 */
export function findEvidenceRanges(passageText: string, quotes: string[]): Range[] {
  // 따옴표 정규화는 글자 수를 바꾸지 않으므로 원문 인덱스를 그대로 쓸 수 있습니다.
  const text = normalizeQuotes(passageText);
  const ranges: Range[] = [];
  for (const quote of quotes) {
    const re = flexiblePattern(quote);
    if (!re) continue;
    for (const m of text.matchAll(re)) {
      if (m.index === undefined || m[0].length === 0) continue;
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  return merged;
}

export interface Segment {
  text: string;
  highlighted: boolean;
}

export function splitByRanges(text: string, ranges: Range[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), highlighted: false });
    segments.push({ text: text.slice(r.start, r.end), highlighted: true });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}
