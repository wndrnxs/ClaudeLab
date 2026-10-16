"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PassageView } from "@/components/PassageView";
import { Card, btn, input } from "@/components/ui";
import { postJson } from "@/lib/client";
import { SKILLS } from "@/lib/skills";
import type { Difficulty, Passage, SkillId } from "@/lib/types";

const STEPS = ["지문 분석", "문항·선지 생성", "근거 문장 대조", "정답 가리고 다시 풀기"];

export function GenerateForm({
  passages,
  initialPassageId,
  initialSkill,
  mode,
}: {
  passages: Passage[];
  initialPassageId?: string;
  initialSkill?: SkillId;
  mode: "claude" | "demo";
}) {
  const router = useRouter();
  const [passageId, setPassageId] = useState(initialPassageId ?? "");
  const [mcqCount, setMcqCount] = useState(3);
  const [oxCount, setOxCount] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>("중");
  const [focusSkill, setFocusSkill] = useState<SkillId | "">(initialSkill ?? "");
  const [bogiCount, setBogiCount] = useState(1);
  const [mixNegative, setMixNegative] = useState(true);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const passage = passages.find((p) => p.id === passageId);

  // 실제 진행 상황을 받지 않으므로, 대기 중에 단계 안내만 순서대로 보여 줍니다.
  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), mode === "demo" ? 400 : 12000);
    return () => clearInterval(timer);
  }, [pending, mode]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card className="h-fit">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const { id } = await postJson<{ id: string; warnings: string[] }>("/api/sets", {
                passageId,
                spec: {
                  mcqCount,
                  oxCount,
                  difficulty,
                  focusSkill: focusSkill || undefined,
                  bogiCount: Math.min(bogiCount, mcqCount),
                  mixNegative,
                  note: note || undefined,
                },
              });
              router.push(`/teacher/sets/${id}`);
            } catch (err) {
              setError((err as Error).message);
              setPending(false);
            }
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">지문</span>
            <select className={input} value={passageId} onChange={(e) => setPassageId(e.target.value)}>
              {passages.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.genre}] {p.title} — {p.author}
                  {p.ownerId ? " (내 지문)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">5지선다</span>
              <input className={input} type="number" min={0} max={10} value={mcqCount} onChange={(e) => setMcqCount(Number(e.target.value))} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">OX</span>
              <input className={input} type="number" min={0} max={10} value={oxCount} onChange={(e) => setOxCount(Number(e.target.value))} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">난이도</span>
              <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                <option value="하">하</option>
                <option value="중">중</option>
                <option value="상">상</option>
              </select>
            </label>
          </div>

          <fieldset className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-lg border border-line p-3 text-sm">
            <legend className="px-1 font-semibold">수능형 출제 옵션</legend>
            <label htmlFor="bogiCount" className="text-ink-2">&lt;보기&gt; 활용 문항</label>
            <select id="bogiCount" className={input} value={bogiCount} onChange={(e) => setBogiCount(Number(e.target.value))}>
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "넣지 않음" : `${n}문항`}
                </option>
              ))}
            </select>
            <label className="col-span-2 flex items-center gap-2 text-ink-2">
              <input type="checkbox" checked={mixNegative} onChange={(e) => setMixNegative(e.target.checked)} />
              &lsquo;적절하지 않은 것은?&rsquo; 발문 섞기
            </label>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">집중할 평가 요소 (선택)</span>
            <select className={input} value={focusSkill} onChange={(e) => setFocusSkill(e.target.value as SkillId | "")}>
              <option value="">고르게 출제</option>
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {s.description}
                </option>
              ))}
            </select>
            {initialSkill && (
              <span className="mt-1 block text-xs text-brand-700">반의 약점 영역에 맞춰 미리 선택했어요.</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">추가 요청 (선택)</span>
            <textarea
              className={`${input} min-h-20`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 화자의 정서 변화를 묻는 문항을 꼭 넣어 주세요."
              maxLength={300}
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-critical-ink">{error}</p>}

          {pending ? (
            <ol className="space-y-1.5 rounded-lg bg-brand-50 p-3 text-sm" aria-live="polite">
              {STEPS.map((label, i) => (
                <li key={label} className={i <= step ? "font-semibold text-brand-800" : "text-ink-3"}>
                  {i < step ? "✓" : i === step ? "…" : "·"} {label}
                </li>
              ))}
              {mode === "claude" && <li className="pt-1 text-xs text-ink-2">문항 수에 따라 1~2분 정도 걸릴 수 있어요.</li>}
            </ol>
          ) : (
            <button type="submit" className={`${btn.primary} w-full`} disabled={!passageId || mcqCount + oxCount === 0}>
              문항 만들기
            </button>
          )}
          <p className="text-xs leading-relaxed text-ink-3">
            만들어진 문항은 바로 학생에게 가지 않아요. 검증 결과를 확인하고 필요하면 고친 뒤 &lsquo;검토 완료&rsquo;를 체크해야 배포할 수
            있습니다.
          </p>
        </form>
      </Card>
      {passage && <PassageView passage={passage} className="h-fit" />}
    </div>
  );
}
