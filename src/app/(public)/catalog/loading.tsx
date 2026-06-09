export default function CatalogLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading vehicle catalog"
      className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16"
    >
      <div className="mb-8 max-w-3xl space-y-4">
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-12 w-full max-w-xl animate-pulse rounded bg-neutral-200" />
        <div className="h-6 w-full max-w-2xl animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white"
            key={index}
          >
            <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
            <div className="space-y-4 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 animate-pulse rounded bg-neutral-100" />
                <div className="h-12 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="h-10 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
