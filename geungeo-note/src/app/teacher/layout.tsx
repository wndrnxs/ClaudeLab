import { AppHeader } from "@/components/AppHeader";
import { aiMode } from "@/lib/ai/pipeline";
import { requireRole } from "@/lib/auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("teacher");
  return (
    <>
      <AppHeader user={user} aiMode={aiMode()} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
