import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Gauge, Users } from "lucide-react";
import {
  formatCategory,
  formatTransmission,
  formatEurCents,
  formatMadFromEurCents,
} from "./format-price";
import type { VehicleCardModel } from "./types";

export function VehicleCard({ vehicle }: { vehicle: VehicleCardModel }) {
  const bestFor = getBestFor(vehicle);
  const luggageLabel =
    vehicle.luggageCount === null
      ? "Luggage to confirm"
      : `${vehicle.luggageCount} ${vehicle.luggageCount === 1 ? "bag" : "bags"}`;

  return (
    <article className="nx-lift group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_24px_70px_rgba(15,15,15,0.08)]">
      <Link
        className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
        href={`/catalog/${vehicle.id}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-neutral-100 bg-neutral-50">
          {vehicle.primaryImageUrl ? (
            <Image
              alt={`${vehicle.name} available for Casablanca Mohammed V Airport pickup`}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              src={vehicle.primaryImageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold text-neutral-400">
              Image not available
            </div>
          )}
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E41FC]" />
            <span className="text-[10px] font-semibold uppercase leading-none tracking-wider text-neutral-900">
              {formatCategory(vehicle.category)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="space-y-1">
          <Link
            className="block w-fit rounded-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
            href={`/catalog/${vehicle.id}`}
          >
            <h3 className="font-display text-xl font-semibold leading-snug text-neutral-900">
              {vehicle.name}
            </h3>
          </Link>
          <p className="text-xs font-light text-neutral-500">
            Casablanca Mohammed V Airport - CMN
          </p>
        </div>

        <p className="mt-4 min-h-[2.75rem] text-sm font-medium leading-6 text-neutral-700">
          {bestFor}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-neutral-100 py-4 text-xs">
          <SpecPill
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Drive"
            value={formatTransmission(vehicle.transmission)}
          />
          <SpecPill
            icon={<Users className="h-3.5 w-3.5" />}
            label="Seats"
            value={vehicle.seats ? `${vehicle.seats}` : "To confirm"}
          />
          <SpecPill
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Luggage"
            value={luggageLabel}
          />
        </dl>

        <div className="mt-auto pt-5">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-light leading-none text-neutral-950">
                From {formatEurCents(vehicle.pricePerDayEurCents)}
              </span>
              <span className="text-xs font-medium text-neutral-500">
                / day
              </span>
            </div>
            <div className="text-sm font-semibold text-neutral-600">
              Approx. {formatMadFromEurCents(vehicle.pricePerDayEurCents)} / day
            </div>
            <p className="text-[11px] font-light text-neutral-500">
              Airport handoff included - deposit shown before payment
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Link
              aria-label={`Reserve ${vehicle.name}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
              href={`/book/${vehicle.id}`}
            >
              Reserve
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              aria-label={`See full specs for ${vehicle.name}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 transition-colors duration-300 hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
              href={`/catalog/${vehicle.id}`}
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function SpecPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
        <span className="text-[#1E41FC]" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1 font-display text-sm font-semibold leading-tight text-neutral-800">
        {value}
      </dd>
    </div>
  );
}

function getBestFor(vehicle: VehicleCardModel): string {
  const name = vehicle.name.toLowerCase();

  if (name.includes("sandero")) {
    return "Best for city arrivals and value-focused trips.";
  }

  if (name.includes("clio")) {
    return "Best for couples, solo travelers, and light luggage.";
  }

  if (name.includes("fiat")) {
    return "Best for compact city driving and short CMN stays.";
  }

  if (name.includes("logan")) {
    return "Best for families who need extra boot space.";
  }

  if (name.includes("elantra") || name.includes("corolla")) {
    return "Best for comfortable highway drives and clear daily pricing.";
  }

  if (name.includes("duster")) {
    return "Best for luggage, road trips, and higher clearance.";
  }

  if (name.includes("sportage") || name.includes("tucson")) {
    return "Best for families wanting comfort and automatic drive.";
  }

  if (name.includes("bmw") || name.includes("evoque")) {
    return "Best for executive airport pickup and premium comfort.";
  }

  return "Best for airport pickup with exact vehicle selection.";
}
