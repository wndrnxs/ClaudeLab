"use client";

import { Printer, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PassageView } from "@/components/PassageView";
import { Notice, btn } from "@/components/ui";
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
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[13px] text-ink-3">
            문항 세트 · {passage.title} · {set.source === "claude" ? "Claude 생성" : "데모 생성"}
          </div>
          <input
            className="-ml-1 w-full rounded-md border border-transparent bg-transparent px-1 font-serif text-[26px] font-bold hover:border-line focus:border-primary focus:outline-none"
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
            <Printer className="h-4 w-4" aria-hidden />
            학생용 인쇄
          </Link>
          <Link href={`/teacher/sets/${set.id}/print?answers=1`} className={btn.secondary} target="_blank">
            교사용(정답·해설)
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="wrong">{error}</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)_17rem]">
        <aside className="order-first grid gap-4 md:grid-cols-3 lg:col-span-2 xl:order-none xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-6 xl:h-fit xl:grid-cols-1">
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold">검증 결과</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">전체 문항</dt>
                <dd className="font-semibold tabular-nums">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-correct">검증 통과</dt>
                <dd className="font-semibold tabular-nums">{passedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-wrong">재검토</dt>
                <dd className="font-semibold tabular-nums">{flaggedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">수정·미검증</dt>
                <dd className="font-semibold tabular-nums">{items.length - passedCount - flaggedCount}</dd>
              </div>
            </dl>
            <button
              type="button"
              className={`${btn.secondary} mt-4 w-full`}
              disabled={!!busy || dirty || items.length === 0}
              onClick={() =>
                run("verify:all", async () => applyServer(await postJson<QuestionSet>(`/api/sets/${set.id}/verify`, {})))
              }
            >
              <RefreshCw className={`h-4 w-4 ${busy === "verify:all" ? "animate-spin" : ""}`} aria-hidden />
              {busy === "verify:all" ? "검증하는 중" : "전체 다시 검증"}
            </button>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold">저장 · 검토</h2>
            <button type="button" className={`${btn.primary} w-full`} disabled={!dirty || !!busy} onClick={save}>
              {busy === "save" ? "저장하는 중" : dirty ? "변경 사항 저장" : "저장됨"}
            </button>
            <label className="mt-4 flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary"
                checked={set.reviewed}
                disabled={dirty || !!busy}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              <span>
                <b>검토 완료</b>
                <span className="block text-[13px] text-ink-2">모든 문항의 정답·해설·근거를 확인했습니다.</span>
              </span>
            </label>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold">반에 배포</h2>
            <AssignPanel setId={set.id} defaultTitle={title} classes={classes} disabledReason={assignDisabledReason} />
            {assignments.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[13px]">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/teacher/assignments/${a.id}`} className="font-semibold underline decoration-line-strong underline-offset-4">
                      {a.title}
                    </Link>{" "}
                    <span className="text-ink-3">{a.className}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className={`${btn.danger} mt-3 -ml-2.5`}
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
              <Trash2 className="h-4 w-4" aria-hidden />
              세트 삭제
            </button>
          </section>
        </aside>

        <div className="lg:sticky lg:top-6 lg:h-fit xl:col-start-1 xl:row-start-1">
          <PassageView passage={passage} highlights={selected?.evidence ?? []} />
          <p className="mt-2 text-[13px] text-ink-3">문항을 누르면 그 문항의 근거 문장을 지문에 표시합니다.</p>
        </div>

        <div className="space-y-5 xl:col-start-2 xl:row-start-1">
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
      </div>
    </>
  );
}
