"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-6">
      <h2 className="text-xl font-semibold">문제가 발생했어요</h2>
      <button
        onClick={reset}
        className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      >
        다시 시도
      </button>
    </main>
  );
}
