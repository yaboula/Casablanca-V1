import Link from "next/link";

export function CatalogEmptyState() {
  return (
    <div
      className="rounded-lg border border-dashed border-[var(--nx-line)] bg-white p-8 text-center"
      role="status"
    >
      <h2 className="text-xl font-black text-neutral-950">
        No vehicles available.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
        The backend returned no public vehicles for this catalog view. No demo
        vehicles are rendered as a replacement.
      </p>
    </div>
  );
}

export function CatalogErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-[var(--nx-line)] bg-white p-8"
      role="alert"
    >
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Catalog unavailable
      </p>
      <h2 className="mt-3 text-2xl font-black text-neutral-950">
        Vehicles could not be loaded.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        {message}
      </p>
    </div>
  );
}

export function VehicleNotFoundState() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        404
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Vehicle not found.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        This vehicle is missing from the public backend catalog, or it is no
        longer accessible.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        href="/catalog"
      >
        Return to catalog
      </Link>
    </section>
  );
}
