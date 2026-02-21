/**
 * Next.js App Router loading.tsx — shown while catalog/[vehicleId]/page.tsx fetches vehicle detail.
 */
export default function VehicleDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-bg animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <div className="h-5 w-28 bg-slate-200 rounded-full mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          {/* Left column */}
          <div className="space-y-6">
            {/* Main image */}
            <div className="aspect-[16/9] bg-slate-200 rounded-3xl" />
            {/* Thumbnails */}
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-14 bg-slate-200 rounded-xl" />
              ))}
            </div>
            {/* Title + specs */}
            <div className="space-y-3">
              <div className="h-8 w-64 bg-slate-200 rounded-full" />
              <div className="h-4 w-44 bg-slate-100 rounded-full" />
              <div className="flex gap-4 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 w-16 bg-slate-100 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4">
              <div className="h-6 w-32 bg-slate-200 rounded-full" />
              <div className="h-10 w-full bg-slate-100 rounded-2xl" />
              <div className="h-10 w-full bg-slate-100 rounded-2xl" />
              <div className="h-12 w-full bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
