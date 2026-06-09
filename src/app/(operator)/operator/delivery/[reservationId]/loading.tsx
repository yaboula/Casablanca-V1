export default function OperatorDeliveryDetailLoading() {
  return (
    <article className="mx-auto w-full max-w-4xl animate-pulse px-6 py-10 md:py-14">
      <div className="mb-8">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="h-10 w-48 rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-40 rounded bg-neutral-100" />
          </div>
          <div className="h-6 w-24 rounded-full bg-neutral-200" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="h-48 rounded-lg bg-neutral-100" />
          <div className="h-32 rounded-lg bg-neutral-100" />
          <div className="h-40 rounded-lg bg-neutral-100" />
        </div>
        <div className="space-y-6">
          <div className="h-24 rounded-lg bg-neutral-100" />
          <div className="h-64 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </article>
  );
}
