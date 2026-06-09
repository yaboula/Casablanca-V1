import Image from "next/image";
import Link from "next/link";
import {
  formatCategory,
  formatEurCents,
  formatTransmission,
} from "./format-price";
import type { VehicleDetailModel } from "./types";

export function VehicleDetailSummary({
  vehicle,
}: {
  vehicle: VehicleDetailModel;
}) {
  const heroImage = vehicle.imageUrls[0] ?? vehicle.primaryImageUrl;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <Link className="text-sm font-bold text-neutral-600" href="/catalog">
        Retour au catalogue
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)]">
            {heroImage ? (
              <Image
                alt={`${vehicle.name} exterior`}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                src={heroImage}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-neutral-500">
                Image non fournie par le backend
              </div>
            )}
          </div>

          {vehicle.imageUrls.length > 1 ? (
            <div
              aria-label="Galerie images vehicule"
              className="grid grid-cols-3 gap-3"
            >
              {vehicle.imageUrls.slice(1, 4).map((imageUrl) => (
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--nx-line)] bg-[var(--nx-bg-soft)]"
                  key={imageUrl}
                >
                  <Image
                    alt={`${vehicle.name} gallery`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 18vw, 33vw"
                    src={imageUrl}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-7 rounded-lg border border-[var(--nx-line)] bg-white p-6">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
              {formatCategory(vehicle.category)}
            </p>
            <h1 className="text-4xl font-black tracking-normal text-neutral-950">
              {vehicle.name}
            </h1>
            <p className="text-sm font-semibold text-neutral-600">
              Tarif backend: {formatEurCents(vehicle.pricePerDayEurCents)} par
              jour
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Spec label="Marque" value={vehicle.brand} />
            <Spec label="Modele" value={vehicle.model} />
            <Spec label="Transmission" value={formatTransmission(vehicle.transmission)} />
            <Spec
              label="Places"
              value={vehicle.seats ? String(vehicle.seats) : "Non indique"}
            />
            <Spec
              label="Bagages"
              value={
                vehicle.luggageCount
                  ? String(vehicle.luggageCount)
                  : "Non indique"
              }
            />
            <Spec label="Statut backend" value={vehicle.status ?? "Non indique"} />
          </dl>

          {vehicle.featureLabels.length > 0 ? (
            <div>
              <h2 className="text-sm font-black text-neutral-950">
                Equipements backend
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {vehicle.featureLabels.map((feature) => (
                  <li
                    className="rounded-full border border-[var(--nx-line)] px-3 py-1 text-sm font-semibold text-neutral-700"
                    key={feature}
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            aria-label={`Preparer une future reservation pour ${vehicle.name}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
            href={`/book/${vehicle.id}`}
          >
            Continuer vers la reservation
          </Link>
          <p className="text-xs leading-5 text-neutral-500">
            La route de reservation reste hors scope dans ce commit.
            Ce lien preserve uniquement la destination prevue par le plan.
          </p>
        </div>
      </div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--nx-line-soft)] bg-[var(--nx-bg-soft)] p-3">
      <dt className="font-bold text-neutral-950">{label}</dt>
      <dd className="mt-1 text-neutral-600">{value}</dd>
    </div>
  );
}
