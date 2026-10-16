import Link from "next/link";
import { RightsBadge } from "@/components/badges";
import { Card, PageTitle, SectionTitle, btn } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import type { Passage } from "@/lib/types";
import { CompositeForm } from "./CompositeForm";
import { PassageForm } from "./PassageForm";

function PassageCard({ p }: { p: Passage }) {
  return (
    <li className="flex flex-col rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold">{p.title}</h3>
        <span className="text-sm text-ink-2">{p.author}</span>
        <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-ink-2">{p.genre}</span>
        {p.sources && <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-800">복합 지문</span>}
      </div>
      <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-line text-sm text-ink-2">{p.text}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-ink-3">
          <RightsBadge kind={p.rights.kind} />
          <span className="truncate">{p.rights.note}</span>
        </span>
        <Link href={`/teacher/generate?passageId=${p.id}`} className={`${btn.secondary} shrink-0 !px-3 !py-1.5`}>
          문항 만들기
        </Link>
      </div>
    </li>
  );
}

export default async function PassagesPage() {
  const teacher = await requireRole("teacher");
  const db = await readDb();
  const library = db.passages.filter((p) => p.ownerId === null);
  const mine = db.passages.filter((p) => p.ownerId === teacher.id);

  return (
    <>
      <PageTitle title="지문" sub="기본 라이브러리에는 저작권이 만료된 작품과 직접 집필한 지문만 있습니다." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section>
            <SectionTitle hint="교과서·EBS·모의고사 지문은 저작권 문제로 제공하지 않습니다.">기본 라이브러리</SectionTitle>
            <ul className="grid gap-3 md:grid-cols-2">
              {library.map((p) => (
                <PassageCard key={p.id} p={p} />
              ))}
            </ul>
          </section>
          <section>
            <SectionTitle hint="선생님이 등록한 지문은 선생님 계정과 선생님 반에서만 쓰입니다.">내가 등록한 지문</SectionTitle>
            {mine.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
                오른쪽에서 지문을 등록해 보세요.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {mine.map((p) => (
                  <PassageCard key={p.id} p={p} />
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="h-fit space-y-6">
          <Card>
            <SectionTitle hint="이미 등록된 두 작품을 (가), (나)로 묶습니다. 권리 근거는 원래 지문을 그대로 따릅니다.">
              복합 지문 만들기
            </SectionTitle>
            <CompositeForm
              passages={[...library, ...mine]
                .filter((p) => !p.sources)
                .map((p) => ({ id: p.id, title: p.title, author: p.author }))}
            />
          </Card>
          <Card>
            <SectionTitle>지문 등록</SectionTitle>
            <PassageForm />
          </Card>
        </div>
      </div>
    </>
  );
}
