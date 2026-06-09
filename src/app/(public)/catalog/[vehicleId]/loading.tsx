export default function VehicleDetailLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading vehicle details"
      className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14"
    >
      <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="aspect-[16/10] animate-pulse rounded-lg bg-neutral-100" />
          <div className="grid grid-cols-3 gap-3">
            <div className="aspect-[4/3] animate-pulse rounded-md bg-neutral-100" />
            <div className="aspect-[4/3] animate-pulse rounded-md bg-neutral-100" />
            <div className="aspect-[4/3] animate-pulse rounded-md bg-neutral-100" />
          </div>
        </div>
        <div className="space-y-6 rounded-lg border border-[var(--nx-line)] bg-white p-6">
          <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-6 w-52 animate-pulse rounded bg-neutral-100" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-16 animate-pulse rounded bg-neutral-100" key={index} />
            ))}
          </div>
          <div className="h-11 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </section>
  );
}
