export default function CheckInLoading() {
  return (
    <article className="mx-auto w-full max-w-3xl animate-pulse px-6 py-10 md:py-14">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="mt-3 h-10 w-3/4 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-neutral-100" />
        <div className="mt-2 h-3 w-1/3 rounded bg-neutral-100" />
      </div>
      {/* Document cards skeleton */}
      <div className="space-y-5">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="rounded-lg border border-[var(--nx-line)] bg-white"
          >
            <div className="flex items-center gap-2 border-b border-[var(--nx-line)] px-6 py-4">
              <div className="h-4 w-4 rounded bg-neutral-200" />
              <div className="h-4 w-24 rounded bg-neutral-200" />
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="h-4 w-full rounded bg-neutral-100" />
              <div className="h-10 w-full rounded bg-neutral-100" />
              <div className="h-12 w-full rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
