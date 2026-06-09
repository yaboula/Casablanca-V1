import Link from "next/link";
import { SearchX } from "lucide-react";

export default function CheckInNotFound() {
  return (
    <article className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <SearchX aria-hidden="true" className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-black text-neutral-950">
        Check-in not found
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-600">
        We couldn&apos;t find this reservation check-in. The reservation may
        have been cancelled, or you may not have access to it.
      </p>
      <div className="mt-8">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800"
          href="/dashboard"
        >
          Go to dashboard
        </Link>
      </div>
    </article>
  );
}
