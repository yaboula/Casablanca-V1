import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCategory, formatTransmission, formatEurCents } from "./format-price";
import type { VehicleCardModel } from "./types";

export function VehicleCard({ vehicle }: { vehicle: VehicleCardModel }) {
  return (
    <article className="nx-lift group relative bg-white border border-neutral-200 rounded-[1.25rem] overflow-hidden transition-all duration-500 hover:border-neutral-400">
      <Link
        className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
        href={`/catalog/${vehicle.id}`}
      >
        {/* Aspect Ratio container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-50 border-b border-neutral-100">
          {vehicle.primaryImageUrl ? (
            <Image
              alt={`${vehicle.name} exterior preview`}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              src={vehicle.primaryImageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold text-neutral-400">
              Image not provided by backend
            </div>
          )}
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-neutral-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-900 leading-none">
              {formatCategory(vehicle.category)}
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6">
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-neutral-900 leading-snug">
              {vehicle.name}
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Casablanca Mohammed V Airport · CMN
            </p>
          </div>

          {/* Specs grid */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-neutral-100 py-4 text-xs">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                Gearbox
              </div>
              <div className="font-display text-sm font-semibold text-neutral-800 mt-1 leading-none">
                {formatTransmission(vehicle.transmission)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                Seats
              </div>
              <div className="font-display text-sm font-semibold text-neutral-800 mt-1 leading-none">
                {vehicle.seats ?? "N/A"}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                Luggage
              </div>
              <div className="font-display text-sm font-semibold text-neutral-800 mt-1 leading-none">
                {vehicle.luggageCount ?? "N/A"}
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="mt-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-0.5">
                <span className="font-display text-2xl font-light text-neutral-950 leading-none">
                  {formatEurCents(vehicle.pricePerDayEurCents)}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">/day</span>
              </div>
              <div className="text-[9px] text-neutral-400 font-light">
                Airport pickup included
              </div>
            </div>

            <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition-colors duration-300 group-hover:bg-[#1E41FC]">
              Reserve
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
