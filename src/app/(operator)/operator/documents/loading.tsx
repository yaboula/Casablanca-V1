export default function OperatorDocumentsLoading() {
  return (
    <article className="mx-auto w-full max-w-3xl animate-pulse px-6 py-10 md:py-14">
      <div className="mb-8">
        <div className="h-3 w-28 rounded bg-neutral-200" />
        <div className="mt-4 h-10 w-48 rounded bg-neutral-200" />
        <div className="mt-2 h-3 w-full max-w-md rounded bg-neutral-100" />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-36 rounded bg-neutral-200" />
        <div className="h-8 w-20 rounded bg-neutral-100" />
      </div>
      {[1, 2].map((n) => (
        <div key={n} className="mb-4 overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--nx-line)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-neutral-200" />
              <div>
                <div className="h-4 w-28 rounded bg-neutral-200" />
                <div className="mt-1 h-3 w-20 rounded bg-neutral-100" />
              </div>
            </div>
            <div className="h-6 w-24 rounded-full bg-neutral-200" />
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="h-8 w-24 rounded bg-neutral-100" />
              <div className="h-9 w-32 rounded bg-neutral-200" />
            </div>
          </div>
          <div className="flex gap-2 border-t border-[var(--nx-line)] px-5 py-4">
            <div className="h-10 w-24 rounded bg-neutral-200" />
            <div className="h-10 w-20 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </article>
  );
}
