import { Loader2 } from "lucide-react";

export const LoadingState = ({ label = "Loading", className = "" }) => (
    <div
        className={`flex flex-col items-center justify-center py-20 md:py-28 ${className}`}
        data-testid="loading-state"
    >
        <Loader2 className="w-7 h-7 text-[#1E41FC] animate-spin" />
        <p className="nx-meta text-neutral-500 mt-4">{label}…</p>
    </div>
);

export const CardSkeleton = () => (
    <div className="bg-white border border-neutral-200 rounded-[1.25rem] overflow-hidden">
        <div className="aspect-[16/10] bg-neutral-100 animate-pulse" />
        <div className="p-6 space-y-3">
            <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-neutral-100 rounded-full animate-pulse mt-4" />
        </div>
    </div>
);

export const GridSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);

export default LoadingState;
