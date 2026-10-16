"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PassageView } from "@/components/PassageView";
import { Card, SectionTitle, TextLink, btn } from "@/components/ui";
import { postJson } from "@/lib/client";
import type { ClassRoom, Passage, Question, QuestionSet } from "@/lib/types";
import { AssignPanel } from "./AssignPanel";
import { QuestionCard } from "./QuestionCard";
import { QuestionEditForm } from "./QuestionEditForm";

export function SetEditor({
  initialSet,
  passage,
  classes,
  assignments,
}: {
  initialSet: QuestionSet;
  passage: Passage;
  classes: ClassRoom[];
  assignments: { id: string; title: string; className: string }[];
}) {
  const router = useRouter();
  const [set, setSet] = useState(initialSet);
  const [items, setItems] = useState<Question[]>(initialSet.items);
  const [title, setTitle] = useState(initialSet.title);
  const [dirty, setDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSet.items[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((q) => q.id === selectedId);
  const flaggedCount = items.filter((q) => q.verification.status === "flagged").length;
  const passedCount = items.filter((q) => q.verification.status === "passed").length;

  function applyServer(next: QuestionSet) {
    setSet(next);
    setItems(next.items);
    setTitle(next.title);
    setDirty(false);
  }

  async function run(key: string, task: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const save = () =>
    run("save", async () => {
      applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}`, { title, items }, "PATCH"));
    });

  const setReviewed = (reviewed: boolean) =>
    run("review", async () => {
      if (reviewed && flaggedCount > 0) {
        const ok = window.confirm(
          `재검토가 필요한 문항이 ${flaggedCount}개 있습니다. 내용을 직접 확인하셨다면 그대로 검토 완료로 표시할까요?`,
        );
        if (!ok) return;
      }
      applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}`, { reviewed }, "PATCH"));
    });

  const assignDisabledReason = dirty
    ? "저장하지 않은 변경 사항이 있어요. 먼저 저장해 주세요."
    : !set.reviewed
      ? "검토를 마치고 '검토 완료'를 체크하면 배포할 수 있어요."
      : classes.length === 0
        ? "먼저 대시보드에서 반을 만들어 주세요."
        : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs text-ink-3">
            <TextLink href="/teacher">대시보드</TextLink> / 문항 세트 · {set.source === "claude" ? "Claude 생성" : "데모 생성"}
          </div>
          <input
            className="w-full rounded-md border border-transparent bg-transparent px-1 text-2xl font-bold hover:border-line focus:border-brand-600 focus:outline-none"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            aria-label="세트 제목"
          />
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/sets/${set.id}/print`} className={btn.secondary} target="_blank">
            학생용 인쇄
          </Link>
          <Link href={`/teacher/sets/${set.id}/print?answers=1`} className={btn.secondary} target="_blank">
            교사용(정답·해설)
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-critical-ink">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_18rem]">
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <PassageView passage={passage} highlights={selected?.evidence ?? []} />
          <p className="mt-2 text-xs text-ink-3">문항을 누르면 그 문항의 근거 문장이 지문에 노란색으로 표시됩니다.</p>
        </div>

        <div className="space-y-4">
          {items.map((q, i) =>
            editingId === q.id ? (
              <QuestionEditForm
                key={q.id}
                q={q}
                number={i + 1}
                onCancel={() => setEditingId(null)}
                onDone={(next) => {
                  setItems((list) => list.map((x) => (x.id === q.id ? next : x)));
                  setEditingId(null);
                  setDirty(true);
                }}
              />
            ) : (
              <QuestionCard
                key={q.id}
                q={q}
                number={i + 1}
                selected={selectedId === q.id}
                busy={busy}
                locked={dirty}
                onSelect={() => setSelectedId(q.id)}
                onEdit={() => {
                  setSelectedId(q.id);
                  setEditingId(q.id);
                }}
                onVerify={() =>
                  run(`verify:${q.id}`, async () =>
                    applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}/verify`, { questionId: q.id })),
                  )
                }
                onRegenerate={() =>
                  run(`regen:${q.id}`, async () =>
                    applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}/regenerate`, { questionId: q.id })),
                  )
                }
                onDelete={() => {
                  if (!window.confirm(`${i + 1}번 문항을 삭제할까요?`)) return;
                  setItems((list) => list.filter((x) => x.id !== q.id));
                  setDirty(true);
                }}
              />
            ),
          )}
          {items.length === 0 && <p className="text-sm text-ink-3">문항이 없습니다.</p>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card className="!p-4">
            <SectionTitle>검증 요약</SectionTitle>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">전체 문항</dt>
                <dd className="font-semibold">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-good-ink">✓ 검증 통과</dt>
                <dd className="font-semibold">{passedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-critical-ink">! 재검토 필요</dt>
                <dd className="font-semibold">{flaggedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">수정·미검증</dt>
                <dd className="font-semibold">{items.length - passedCount - flaggedCount}</dd>
              </div>
            </dl>
            <button
              type="button"
              className={`${btn.secondary} mt-3 w-full`}
              disabled={!!busy || dirty || items.length === 0}
              onClick={() =>
                run("verify:all", async () => applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}/verify`, {})))
              }
            >
              {busy === "verify:all" ? "전체 검증 중…" : "↻ 전체 다시 검증"}
            </button>
          </Card>

          <Card className="!p-4">
            <SectionTitle>저장 · 검토</SectionTitle>
            <button type="button" className={`${btn.primary} w-full`} disabled={!dirty || !!busy} onClick={save}>
              {busy === "save" ? "저장 중…" : dirty ? "변경 사항 저장" : "저장됨"}
            </button>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={set.reviewed}
                disabled={dirty || !!busy}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              <span>
                <b>검토 완료</b>
                <span className="block text-xs text-ink-2">모든 문항의 정답·해설·근거를 확인했습니다.</span>
              </span>
            </label>
          </Card>

          <Card className="!p-4">
            <SectionTitle>반에 배포</SectionTitle>
            <AssignPanel setId={set.id} defaultTitle={title} classes={classes} disabledReason={assignDisabledReason} />
            {assignments.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <TextLink href={`/teacher/assignments/${a.id}`}>{a.title}</TextLink>{" "}
                    <span className="text-ink-3">({a.className})</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <button
            type="button"
            className={`${btn.danger} w-full`}
            disabled={!!busy}
            onClick={() =>
              run("delete", async () => {
                if (!window.confirm("이 문항 세트를 삭제할까요? 이미 배포한 과제는 그대로 남습니다.")) return;
                await postJson(`/api/sets/${set.id}`, undefined, "DELETE");
                router.push("/teacher");
                router.refresh();
              })
            }
          >
            세트 삭제
          </button>
        </aside>
      </div>
    </>
  );
}
