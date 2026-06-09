import Image from "next/image";
import Link from "next/link";
import { formatCategory, formatTransmission } from "./format-price";
import { PriceDisplay } from "./PriceDisplay";
import type { VehicleCardModel } from "./types";

export function VehicleCard({ vehicle }: { vehicle: VehicleCardModel }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white">
      <Link
        className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
        href={`/catalog/${vehicle.id}`}
      >
        <div className="relative aspect-[4/3] bg-[var(--nx-bg-soft)]">
          {vehicle.primaryImageUrl ? (
            <Image
              alt={`${vehicle.name} exterior`}
              className="object-cover transition duration-200 group-hover:scale-[1.02]"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              src={vehicle.primaryImageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-neutral-500">
              Image non fournie par le backend
            </div>
          )}
        </div>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
              {formatCategory(vehicle.category)}
            </p>
            <h2 className="text-xl font-black text-neutral-950">
              {vehicle.name}
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
            <div>
              <dt className="font-bold text-neutral-950">Transmission</dt>
              <dd className="mt-1">{formatTransmission(vehicle.transmission)}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-950">Places</dt>
              <dd className="mt-1">
                {vehicle.seats ? `${vehicle.seats}` : "Non indique"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-950">Bagages</dt>
              <dd className="mt-1">
                {vehicle.luggageCount
                  ? `${vehicle.luggageCount}`
                  : "Non indique"}
              </dd>
            </div>
          </dl>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--nx-line)] pt-4">
            <PriceDisplay cents={vehicle.pricePerDayEurCents} />
            <span className="text-sm font-bold text-[var(--nx-accent)]">
              Details
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
