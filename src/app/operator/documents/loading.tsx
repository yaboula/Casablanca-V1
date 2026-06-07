/**
 * Loading skeleton for the document review queue.
 * Route: /operator/documents
 */
export default function DocumentsLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-6 w-52 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-32 bg-slate-100 rounded" />
      </div>

      {/* Document cards */}
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Document preview area */}
            <div className="h-40 w-full bg-slate-100" />
            {/* Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-5 w-20 bg-yellow-100 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-slate-100 rounded mb-4" />
              {/* Action buttons skeleton */}
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-green-100 rounded-xl" />
                <div className="flex-1 h-10 bg-red-100 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
