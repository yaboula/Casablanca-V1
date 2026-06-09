export default function BookingLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading booking page"
      className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14"
    >
      {/* Page header skeleton */}
      <div className="mb-8 max-w-2xl space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-72 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-neutral-200" />
      </div>

      {/* Progress indicator skeleton */}
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3].map((i) => (
          <div className="flex items-center gap-2" key={i}>
            <div className="h-7 w-7 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-4 w-14 animate-pulse rounded bg-neutral-200" />
            {i < 3 && (
              <div className="mx-2 h-px w-10 bg-neutral-200" />
            )}
          </div>
        ))}
      </div>

      {/* Main layout skeleton */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Form skeleton */}
        <div className="rounded-lg border border-[var(--nx-line)] bg-white p-6 md:p-8">
          <div className="grid gap-6">
            <div className="h-px bg-neutral-200" />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                <div className="h-12 animate-pulse rounded-md bg-neutral-100" />
              </div>
              <div className="grid gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                <div className="h-12 animate-pulse rounded-md bg-neutral-100" />
              </div>
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="grid gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="h-12 animate-pulse rounded-md bg-neutral-100" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
                <div className="h-12 animate-pulse rounded-md bg-neutral-100" />
              </div>
              <div className="grid gap-2">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-12 animate-pulse rounded-md bg-neutral-100" />
              </div>
            </div>
            <div className="h-12 animate-pulse rounded-md bg-neutral-200" />
          </div>
        </div>

        {/* Summary panel skeleton */}
        <div className="rounded-lg border border-[var(--nx-line)] bg-white">
          <div className="h-44 animate-pulse rounded-t-lg bg-neutral-200" />
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
              <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="h-10 animate-pulse rounded bg-neutral-100" />
            <div className="h-px bg-neutral-200" />
            <div className="h-16 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
