export default function TicketLoading() {
  return (
    <article className="mx-auto w-full max-w-2xl animate-pulse px-6 py-10 md:py-14">
      <div className="mb-8">
        <div className="h-4 w-24 rounded bg-neutral-200" />
        <div className="mt-3 h-10 w-1/2 rounded bg-neutral-200" />
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white">
        <div className="border-b border-[var(--nx-line)] bg-neutral-950 px-6 py-5">
          <div className="h-4 w-32 rounded bg-neutral-800" />
          <div className="mt-1 h-6 w-48 rounded bg-neutral-700" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-10 w-48 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
        </div>
      </div>
    </article>
  );
}
