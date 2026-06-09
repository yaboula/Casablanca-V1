export default function HomePage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
      <div className="space-y-8">
        <div className="inline-flex rounded-full border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-600">
          Commit A runtime migration
        </div>
        <div className="space-y-5">
          <h1 className="max-w-3xl text-4xl font-black tracking-normal text-neutral-950 md:text-6xl">
            Next App Router is the production frontend foundation.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-neutral-700">
            This placeholder proves the production runtime without mounting the
            Emergent SPA, React Router, AppStore, or mock reservation state.
          </p>
        </div>
        <div className="flex flex-wrap gap-3" aria-label="Foundation status">
          <span className="rounded-full border border-[var(--nx-line)] px-4 py-2 text-sm font-semibold">
            App Router mounted
          </span>
          <span className="rounded-full border border-[var(--nx-line)] px-4 py-2 text-sm font-semibold">
            Mock business state quarantined
          </span>
          <span className="rounded-full border border-[var(--nx-line)] px-4 py-2 text-sm font-semibold">
            API/session shell mounted
          </span>
          <span className="rounded-full border border-[var(--nx-line)] px-4 py-2 text-sm font-semibold">
            Auth UI shells mounted
          </span>
        </div>
      </div>

      <aside
        aria-label="Phase 1 boundary"
        className="rounded-lg border border-[var(--nx-line)] bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-neutral-950">
          Safe foundation boundary
        </h2>
        <dl className="mt-6 grid gap-5">
          <div>
            <dt className="text-sm font-bold text-neutral-950">Runtime</dt>
            <dd className="mt-1 text-sm leading-6 text-neutral-600">
              Next.js App Router with semantic root layout and accessible skip link.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-neutral-950">Not included</dt>
            <dd className="mt-1 text-sm leading-6 text-neutral-600">
              Booking, documents, waiting room, smart ticket, operator business
              data, and admin business data.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-neutral-950">SPA status</dt>
            <dd className="mt-1 text-sm leading-6 text-neutral-600">
              Existing CRA/Emergent files remain reference material and are not
              imported by the production route tree.
            </dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}
