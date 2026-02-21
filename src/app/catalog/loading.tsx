import VehicleCardSkeleton from "@/components/vehicles/VehicleCardSkeleton";

/**
 * Next.js App Router loading.tsx — shown while catalog/page.tsx fetches vehicles.
 * Replaces the blank-white flash with 6 skeleton cards.
 */
export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header skeleton */}
        <div className="mb-8 space-y-3 animate-pulse">
          <div className="h-7 w-48 bg-slate-200 rounded-full" />
          <div className="h-4 w-72 bg-slate-100 rounded-full" />
        </div>

        {/* FilterBar skeleton */}
        <div className="mb-8 flex gap-3 flex-wrap animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-slate-200 rounded-full" />
          ))}
        </div>

        {/* Vehicle grid — 6 skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
