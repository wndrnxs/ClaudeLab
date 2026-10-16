import { z } from "zod";
import { HttpError, requireApiRole } from "@/lib/auth";
import { passageForTeacher } from "@/lib/access";
import { json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Passage, RightsKind } from "@/lib/types";

const Body = z.object({
  passageIds: z.array(z.string()).min(2, "지문을 2개 이상 골라 주세요.").max(3),
  title: z.string().trim().max(100).optional(),
});

const LABELS = ["(가)", "(나)", "(다)"];

/** 두 작품의 권리 근거 중 더 엄격한 쪽을 따릅니다. */
function combinedRights(kinds: RightsKind[]): RightsKind {
  if (kinds.every((k) => k === "public_domain")) return "public_domain";
  if (kinds.includes("licensed")) return "licensed";
  return "original";
}

/** 여러 지문을 (가), (나)로 묶은 복합 지문을 만듭니다. 원래 지문의 권리 근거를 그대로 이어받습니다. */
export const POST = route(async (req) => {
  const teacher = await requireApiRole("teacher");
  const { passageIds, title } = await parseBody(req, Body);
  if (new Set(passageIds).size !== passageIds.length) throw new HttpError(400, "서로 다른 지문을 골라 주세요.");

  const created = await updateDb((db) => {
    const parts = passageIds.map((id) => passageForTeacher(db, teacher, id));
    if (parts.some((p) => p.sources)) throw new HttpError(400, "이미 묶은 복합 지문은 다시 묶을 수 없습니다.");
    const now = new Date().toISOString();
    const passage: Passage = {
      id: newId("p"),
      ownerId: teacher.id,
      title: title || `${parts.map((p) => p.title).join(" · ")} (복합)`,
      author: parts.map((p) => p.author).join(" · "),
      genre: parts.every((p) => p.genre === "문학") ? "문학" : "독서",
      text: parts.map((p, i) => `${LABELS[i]}\n${p.text}`).join("\n\n"),
      sources: parts.map((p, i) => ({ label: LABELS[i], title: p.title, author: p.author })),
      rights: {
        kind: combinedRights(parts.map((p) => p.rights.kind)),
        note: parts.map((p, i) => `${LABELS[i]} ${p.rights.note}`).join(" "),
        confirmedAt: now,
      },
      createdAt: now,
    };
    db.passages.push(passage);
    return passage;
  });
  return json({ id: created.id }, 201);
});
