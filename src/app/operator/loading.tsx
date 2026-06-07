/**
 * F1.2 — Shared skeleton loader for the operator panel.
 * Shown by Next.js Suspense while Server Components are fetching.
 */
export default function OperatorLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-40 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-7 w-14 bg-slate-200 rounded-full" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* List items skeleton */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
