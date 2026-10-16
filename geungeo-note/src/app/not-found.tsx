import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="font-serif text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-ink-2">주소가 바뀌었거나 볼 수 있는 권한이 없는 페이지입니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          처음으로
        </Link>
      </div>
    </main>
  );
}
