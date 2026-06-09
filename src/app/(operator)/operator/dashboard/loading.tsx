export default function OperatorDashboardLoading() {
  return (
    <section className="mx-auto w-full max-w-6xl animate-pulse px-6 py-10 md:py-14">
      {/* Header */}
      <div className="mb-10">
        <div className="h-3 w-32 rounded bg-neutral-200" />
        <div className="mt-2 h-10 w-64 rounded bg-neutral-200" />
        <div className="mt-1 h-3 w-40 rounded bg-neutral-100" />
      </div>
      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-lg border border-[var(--nx-line)] bg-white p-5">
            <div className="h-3 w-20 rounded bg-neutral-200" />
            <div className="mt-2 h-8 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      {/* Queue */}
      <div className="rounded-lg border border-[var(--nx-line)] bg-white">
        <div className="border-b border-[var(--nx-line)] px-6 py-4">
          <div className="h-4 w-40 rounded bg-neutral-200" />
        </div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-start gap-4 border-b border-[var(--nx-line)] px-6 py-5">
            <div className="h-10 w-10 rounded-md bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-neutral-200" />
              <div className="h-3 w-32 rounded bg-neutral-100" />
              <div className="h-3 w-56 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
