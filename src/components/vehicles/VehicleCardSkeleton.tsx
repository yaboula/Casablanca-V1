"use client";

export default function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-slate-200" />
      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded-full" />
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
        </div>
        <div className="h-3.5 w-24 bg-slate-100 rounded-full" />
        {/* Specs row */}
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-14 bg-slate-100 rounded-full" />
          <div className="h-3 w-14 bg-slate-100 rounded-full" />
          <div className="h-3 w-14 bg-slate-100 rounded-full" />
        </div>
        {/* Button */}
        <div className="h-11 w-full bg-slate-100 rounded-full mt-1" />
      </div>
    </div>
  );
}
