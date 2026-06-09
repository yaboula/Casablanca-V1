"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const vehicleId = typeof params?.vehicleId === "string" ? params.vehicleId : null;

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Booking error
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        This booking page could not be loaded.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        {error.message || "An unexpected error occurred while loading the booking page."}
      </p>
      {error.digest && (
        <p className="mt-2 text-sm text-neutral-500">
          Error reference: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="min-h-11 rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
        {vehicleId && (
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] px-5 py-3 text-sm font-bold text-neutral-950"
            href={`/catalog/${vehicleId}`}
          >
            Back to vehicle detail
          </Link>
        )}
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] px-5 py-3 text-sm font-bold text-neutral-950"
          href="/catalog"
        >
          Browse fleet
        </Link>
      </div>
    </section>
  );
}
