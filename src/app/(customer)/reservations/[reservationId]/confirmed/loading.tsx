export default function ConfirmationLoading() {
  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14 animate-pulse">
      <div className="mb-10">
        <div className="h-8 w-8 rounded-full bg-neutral-200" />
        <div className="mt-4 h-10 w-3/4 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-1/2 rounded bg-neutral-200" />
        <div className="mt-4 h-4 w-1/4 rounded bg-neutral-200" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="h-[400px] rounded-lg border border-[var(--nx-line)] bg-white p-6">
          <div className="h-4 w-1/4 rounded bg-neutral-200 mb-8" />
          <div className="space-y-6">
            <div className="h-10 w-full rounded bg-neutral-100" />
            <div className="h-10 w-full rounded bg-neutral-100" />
            <div className="h-10 w-full rounded bg-neutral-100" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-lg border border-[var(--nx-line)] bg-white p-5" />
          <div className="h-64 rounded-lg border border-[var(--nx-line)] bg-white p-5" />
        </div>
      </div>
    </article>
  );
}
