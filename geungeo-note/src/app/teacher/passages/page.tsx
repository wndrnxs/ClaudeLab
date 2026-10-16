import Link from "next/link";
import { RightsBadge } from "@/components/badges";
import { PageTitle, Panel, Tag, btn } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import type { Passage } from "@/lib/types";
import { CompositeForm } from "./CompositeForm";
import { PassageForm } from "./PassageForm";

function PassageRow({ p }: { p: Passage }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-serif text-[17px] font-bold">{p.title}</h3>
          <span className="text-sm text-ink-2">{p.author}</span>
          <span className="text-[13px] text-ink-3">{p.genre}</span>
          {p.sources && <Tag tone="primary">복합 지문</Tag>}
        </div>
        <p className="mt-1.5 line-clamp-2 font-serif text-sm leading-relaxed whitespace-pre-line text-ink-2">{p.text}</p>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-[13px] text-ink-3">
          <RightsBadge kind={p.rights.kind} />
          <span className="truncate">{p.rights.note}</span>
        </div>
      </div>
      <Link href={`/teacher/generate?passageId=${p.id}`} className={btn.small}>
        문항 만들기
      </Link>
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
      <PageTitle
        title="지문"
        sub="기본 라이브러리에는 저작권이 만료된 작품과 직접 쓴 지문만 넣었습니다. 교과서·EBS·모의고사 지문은 제공하지 않습니다."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title="기본 라이브러리" action={<span className="text-[13px] text-ink-3">{library.length}편</span>} bodyClassName="">
            <ul className="divide-y divide-line">
              {library.map((p) => (
                <PassageRow key={p.id} p={p} />
              ))}
            </ul>
          </Panel>
          <Panel
            title="내가 등록한 지문"
            action={<span className="text-[13px] text-ink-3">내 계정과 내 반에서만 쓰입니다</span>}
            bodyClassName=""
          >
            {mine.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-2">등록한 지문이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-line">
                {mine.map((p) => (
                  <PassageRow key={p.id} p={p} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="지문 등록">
            <PassageForm />
          </Panel>
          <Panel title="복합 지문 만들기">
            <p className="mb-3 text-[13px] text-ink-2">등록된 두 작품을 (가), (나)로 묶습니다. 권리 근거는 원래 지문을 따릅니다.</p>
            <CompositeForm
              passages={[...library, ...mine]
                .filter((p) => !p.sources)
                .map((p) => ({ id: p.id, title: p.title, author: p.author }))}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
