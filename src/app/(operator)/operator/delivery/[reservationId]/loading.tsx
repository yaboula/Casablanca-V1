export default function OperatorDeliveryDetailLoading() {
  return (
    <article className="mx-auto w-full max-w-[1180px] animate-pulse px-5 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="mt-3 h-10 w-72 rounded bg-neutral-200" />
            <div className="mt-3 h-4 w-96 rounded bg-neutral-100" />
          </div>
          <div className="h-28 rounded-2xl bg-neutral-100" />
        </div>
      </div>
      <div className="h-20 rounded-2xl bg-neutral-100" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="h-72 rounded-2xl bg-neutral-100" />
          <div className="h-48 rounded-2xl bg-neutral-100" />
        </div>
        <div className="space-y-5">
          <div className="h-64 rounded-2xl bg-neutral-100" />
          <div className="h-80 rounded-2xl bg-neutral-100" />
        </div>
      </div>
    </article>
  );
}
