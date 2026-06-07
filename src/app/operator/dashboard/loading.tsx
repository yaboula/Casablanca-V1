/**
 * Loading skeleton for the operator delivery dashboard.
 * Route: /operator/dashboard
 */
export default function DashboardLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-6 w-44 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
        <div className="h-7 w-14 bg-blue-100 rounded-full" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-6 w-10 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Delivery cards */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-36 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
                <div className="flex gap-2">
                  <div className="h-5 w-14 bg-slate-100 rounded-full" />
                  <div className="h-5 w-14 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
