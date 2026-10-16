import { StudentHeader } from "@/components/AppHeader";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    <>
      <StudentHeader user={user} />
      <main className="mx-auto max-w-[1180px] px-5 py-7 lg:px-8 lg:py-10">{children}</main>
    </>
  );
}
