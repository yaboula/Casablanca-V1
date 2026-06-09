"use client";

import Link from "next/link";

export default function VehicleDetailRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Vehicle detail error
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Impossible de charger ce vehicule.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        {error.message || "La route de detail a recu une erreur inattendue."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="min-h-11 rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
          onClick={reset}
          type="button"
        >
          Reessayer
        </button>
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] px-5 py-3 text-sm font-bold text-neutral-950"
          href="/catalog"
        >
          Retour au catalogue
        </Link>
      </div>
    </section>
  );
}
