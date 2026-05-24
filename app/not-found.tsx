import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-6">
      <h2 className="text-xl font-semibold">페이지를 찾을 수 없어요</h2>
      <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        홈으로
      </Link>
    </main>
  );
}
