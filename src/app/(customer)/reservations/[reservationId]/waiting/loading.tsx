export default function WaitingLoading() {
  return (
    <article className="mx-auto w-full max-w-3xl animate-pulse px-6 py-10 md:py-14">
      <div className="mb-8">
        <div className="h-4 w-28 rounded bg-neutral-200" />
        <div className="mt-4 h-10 w-2/3 rounded bg-neutral-200" />
        <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100" />
      </div>
      <div className="mb-6 rounded-lg border border-[var(--nx-line)] bg-white p-5">
        <div className="h-4 w-48 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-full rounded bg-neutral-100" />
      </div>
      <div className="rounded-lg border border-[var(--nx-line)] bg-white">
        <div className="border-b border-[var(--nx-line)] px-6 py-4">
          <div className="h-4 w-32 rounded bg-neutral-200" />
        </div>
        <div className="divide-y divide-[var(--nx-line)] px-6">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center justify-between py-4">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="h-5 w-24 rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
