import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { json, parseBody, route } from "@/lib/api";
import { updateDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Passage } from "@/lib/types";

const Body = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(100),
  author: z.string().trim().min(1, "지은이(또는 작성자)를 입력해 주세요.").max(60),
  genre: z.enum(["문학", "독서"]),
  text: z.string().trim().min(30, "지문은 30자 이상이어야 합니다.").max(8000, "지문은 8,000자 이하로 입력해 주세요."),
  rightsKind: z.enum(["public_domain", "original", "licensed"]),
  rightsNote: z.string().trim().min(2, "출처와 권리 근거를 적어 주세요.").max(300),
  confirm: z.literal(true, { error: "지문 이용 권리 확인에 동의해 주세요." }),
});

export const POST = route(async (req) => {
  const teacher = await requireApiRole("teacher");
  const body = await parseBody(req, Body);
  const now = new Date().toISOString();
  const passage: Passage = {
    id: newId("p"),
    ownerId: teacher.id,
    title: body.title,
    author: body.author,
    genre: body.genre,
    text: body.text.replace(/\r\n/g, "\n"),
    rights: { kind: body.rightsKind, note: body.rightsNote, confirmedAt: now },
    createdAt: now,
  };
  await updateDb((db) => {
    db.passages.push(passage);
  });
  return json({ id: passage.id }, 201);
});
