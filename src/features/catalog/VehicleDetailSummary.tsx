import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  KeyRound,
  Plane,
  ShieldCheck,
} from "lucide-react";
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
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      <Link className="text-sm font-bold text-neutral-600" href="/catalog">
        Return to catalog
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
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
                Image not provided by backend
              </div>
            )}
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-2 text-xs font-black text-neutral-950">
              <span className="h-2 w-2 rounded-full bg-[var(--nx-accent)]" />
              {formatCategory(vehicle.category)}
            </div>
          </div>

          {vehicle.imageUrls.length > 1 ? (
            <div
              aria-label="Vehicle image gallery"
              className="grid grid-cols-3 gap-3"
            >
              {vehicle.imageUrls.slice(1, 4).map((imageUrl) => (
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--nx-line)] bg-[var(--nx-bg-soft)]"
                  key={imageUrl}
                >
                  <Image
                    alt={`${vehicle.name} gallery image`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 18vw, 33vw"
                    src={imageUrl}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 border-y border-[var(--nx-line)] py-6 md:grid-cols-3">
            <PromiseItem
              icon={Plane}
              title="Airport pickup"
              text="Designed around Casablanca Mohammed V Airport."
            />
            <PromiseItem
              icon={FileCheck2}
              title="Verify first"
              text="Documents are handled after reservation creation."
            />
            <PromiseItem
              icon={BadgeCheck}
              title="Backend identity"
              text="This vehicle uses the backend UUID as truth."
            />
          </div>
        </div>

        <aside className="space-y-7 rounded-lg border border-[var(--nx-line)] bg-white p-6 lg:sticky lg:top-24">
          <div className="space-y-3">
            <p className="text-sm font-bold text-neutral-500">
              Backend vehicle detail
            </p>
            <h1 className="text-4xl font-black tracking-normal text-neutral-950">
              {vehicle.name}
            </h1>
            <p className="text-base leading-7 text-neutral-700">
              Exact public vehicle profile from `GET /api/v1/vehicles/:id`.
            </p>
          </div>

          <div className="rounded-lg bg-neutral-950 p-5 text-white">
            <p className="text-sm font-bold text-neutral-300">Daily rate</p>
            <p className="mt-2 text-4xl font-black">
              {formatEurCents(vehicle.pricePerDayEurCents)}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Price is displayed from backend EUR cents. Booking totals and
              deposits are intentionally not calculated here.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="Brand" value={vehicle.brand} />
            <Spec label="Model" value={vehicle.model} />
            <Spec label="Transmission" value={formatTransmission(vehicle.transmission)} />
            <Spec
              label="Seats"
              value={vehicle.seats ? String(vehicle.seats) : "Not provided"}
            />
            <Spec
              label="Luggage"
              value={
                vehicle.luggageCount
                  ? String(vehicle.luggageCount)
                  : "Not provided"
              }
            />
            <Spec label="Backend status" value={vehicle.status ?? "Not provided"} />
          </dl>

          {vehicle.featureLabels.length > 0 ? (
            <div>
              <h2 className="text-sm font-black text-neutral-950">
                Backend-provided features
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

          <div className="grid gap-3 border-t border-[var(--nx-line)] pt-5">
            <NextStep
              icon={ShieldCheck}
              title="Payment is not active here"
              text="Stripe remains out of the public browsing bundle."
            />
            <NextStep
              icon={KeyRound}
              title="Next route is planned"
              text="Booking will be implemented later at the vehicle UUID route."
            />
          </div>

          <Link
            aria-label={`Preparer une future reservation pour ${vehicle.name}`}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-5 py-3 text-sm font-black text-white"
            href={`/book/${vehicle.id}`}
          >
            Continue to reservation
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <p className="text-xs leading-5 text-neutral-500">
            The reservation route remains outside this commit. This link keeps
            the planned architecture visible without simulating booking.
          </p>
        </aside>
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

function PromiseItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Plane;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--nx-accent-soft)] text-[var(--nx-accent)]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-sm font-black text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{text}</p>
      </div>
    </div>
  );
}

function NextStep({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Plane;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--nx-accent)]" />
      <div>
        <h2 className="text-sm font-black text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{text}</p>
      </div>
    </div>
  );
}
