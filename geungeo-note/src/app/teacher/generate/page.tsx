import { PageTitle } from "@/components/ui";
import { aiMode } from "@/lib/ai/pipeline";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { SKILL_IDS } from "@/lib/skills";
import type { SkillId } from "@/lib/types";
import { GenerateForm } from "./GenerateForm";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ passageId?: string; focusSkill?: string }>;
}) {
  const teacher = await requireRole("teacher");
  const { passageId, focusSkill } = await searchParams;
  const db = await readDb();
  const passages = db.passages.filter((p) => p.ownerId === null || p.ownerId === teacher.id);
  const initialSkill = SKILL_IDS.includes(focusSkill as SkillId) ? (focusSkill as SkillId) : undefined;

  return (
    <>
      <PageTitle
        title="문항 만들기"
        sub="AI가 만든 문항을 정답을 가린 채 다시 풀어 보고, 근거 문장과 복수 정답 여부를 확인합니다."
      />
      <GenerateForm
        passages={passages}
        initialPassageId={passages.some((p) => p.id === passageId) ? passageId : passages[0]?.id}
        initialSkill={initialSkill}
        mode={aiMode()}
      />
    </>
  );
}
