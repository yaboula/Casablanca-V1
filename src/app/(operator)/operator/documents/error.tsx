"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function OperatorDocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle aria-hidden="true" className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-black text-neutral-950">
        Document review unavailable
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-600">
        We encountered a problem loading the document review queue.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--nx-line)] bg-white px-6 font-bold text-neutral-950 transition hover:bg-neutral-50"
          href="/operator/dashboard"
        >
          Go to dashboard
        </Link>
      </div>
    </article>
  );
}
