import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Clock,
  FileCheck2,
  KeyRound,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { VehicleCard } from "@/features/catalog/VehicleCard";
import type { VehicleCardModel } from "@/features/catalog/types";

export function PublicHome({
  featuredVehicles,
}: {
  featuredVehicles: VehicleCardModel[];
}) {
  const heroVehicle = featuredVehicles[0] ?? null;

  return (
    <div className="bg-white text-neutral-950">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:py-16 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] px-4 py-2 text-sm font-bold text-neutral-700">
            <Plane aria-hidden="true" className="h-4 w-4 text-[var(--nx-accent)]" />
            Casablanca Mohammed V Airport
          </div>
          <div className="space-y-6">
            <h1 className="text-balance text-5xl font-black tracking-normal text-neutral-950 md:text-7xl">
              Reserve before you land. Pick up in minutes.
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-8 text-neutral-700 md:text-xl">
              Choose the exact vehicle, upload documents before arrival, and
              collect your keys at Casablanca Mohammed V Airport — the moment
              your reservation is confirmed.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-neutral-950 px-6 py-3 text-sm font-black text-white"
              href="/catalog"
            >
              Browse real fleet
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--nx-line)] px-6 py-3 text-sm font-black text-neutral-950"
              href="#how-it-works"
            >
              See pickup flow
            </Link>
          </div>

          <dl className="grid gap-3 border-y border-[var(--nx-line)] py-5 sm:grid-cols-3">
            <TrustMetric label="Journey" value="Reserve, verify, pickup" />
            <TrustMetric label="Pricing" value="Transparent daily rates" />
            <TrustMetric label="Identity" value="Confirmed reservation only" />
          </dl>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border border-[var(--nx-line)] bg-neutral-100">
            <div className="relative aspect-[4/3]">
              {heroVehicle?.primaryImageUrl ? (
                <Image
                  alt={`${heroVehicle.name} prepared for airport pickup`}
                  className="object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  src={heroVehicle.primaryImageUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm font-bold text-neutral-600">
                  Vehicle imagery appears when the backend fleet is available.
                </div>
              )}
            </div>
            <div className="grid gap-4 border-t border-white/70 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-sm font-bold text-neutral-500">
                  {heroVehicle ? "Backend fleet preview" : "Airport-first flow"}
                </p>
                <p className="mt-1 text-2xl font-black text-neutral-950">
                  {heroVehicle?.name ?? "Exact vehicle, confirmed later"}
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--nx-accent)] px-4 py-2 text-sm font-black text-white"
                href="/catalog"
              >
                Open catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--nx-line)] bg-[var(--nx-bg-soft)]">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-6 md:grid-cols-4">
          <TrustItem icon={BadgeCheck} text="Exact make and model confirmed at booking" />
          <TrustItem icon={FileCheck2} text="Document check happens before you arrive" />
          <TrustItem icon={ShieldCheck} text="Deposit and payment handled securely at checkout" />
          <TrustItem icon={Clock} text="Designed around airport arrival timing" />
        </div>
      </section>

      <section
        className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]"
        id="how-it-works"
      >
        <div className="max-w-xl">
          <h2 className="text-3xl font-black tracking-normal text-neutral-950 md:text-5xl">
            A rental journey in three clear steps.
          </h2>
          <p className="mt-5 text-base leading-7 text-neutral-700">
            The full workflow is straightforward: reserve the vehicle, verify
            your documents remotely, then pick up at the airport.
          </p>
        </div>
        <ol className="grid gap-4">
          <ProcessStep
            icon={CarFront}
            title="Reserve"
            text="Choose the exact vehicle from the live fleet and complete your booking."
          />
          <ProcessStep
            icon={FileCheck2}
            title="Verify"
            text="Upload your driving licence and required documents before your arrival date."
          />
          <ProcessStep
            icon={KeyRound}
            title="Pickup"
            text="Arrive at Casablanca Mohammed V Airport and collect your keys — confirmed and ready."
          />
        </ol>
      </section>

      <section className="bg-neutral-950 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-normal md:text-5xl">
              Every listing is a real vehicle.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300">
              No stand-in images, estimated prices, or placeholder models.
              What you see in the catalog is what you reserve.
            </p>
          </div>
          {featuredVehicles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {featuredVehicles.slice(0, 3).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/15 p-6">
              <h3 className="text-xl font-black">Fleet preview unavailable</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                The public route will not show replacement demo vehicles when
                the backend fleet cannot be reached.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-16 md:grid-cols-3 md:py-24">
        <Reassurance
          title="Pickup at the airport"
          text="The pickup location is always Casablanca Mohammed V Airport. No ambiguous addresses, no third-party transfers."
        />
        <Reassurance
          title="Documents handled before you land"
          text="Upload your driving licence and ID remotely. The operator reviews and approves before your arrival."
        />
        <Reassurance
          title="No surprise costs"
          text="Rates are quoted per day in euros. The total and deposit are confirmed at checkout — not at pickup."
        />
      </section>

      <section className="border-t border-[var(--nx-line)] bg-[var(--nx-bg-soft)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-neutral-950">
              Find your vehicle for the journey.
            </h2>
            <p className="mt-2 text-base text-neutral-700">
              Browse the live fleet, check specs and daily rates, then continue to booking.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-neutral-950 px-6 py-3 text-sm font-black text-white"
            href="/catalog"
          >
            Browse catalog
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function TrustMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-black text-neutral-950">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-neutral-600">{value}</dd>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: typeof BadgeCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-neutral-700">
      <Icon aria-hidden="true" className="h-5 w-5 text-[var(--nx-accent)]" />
      <span>{text}</span>
    </div>
  );
}

function ProcessStep({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BadgeCheck;
  title: string;
  text: string;
}) {
  return (
    <li className="grid gap-4 rounded-lg border border-[var(--nx-line)] bg-white p-5 sm:grid-cols-[3rem_1fr]">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--nx-accent-soft)] text-[var(--nx-accent)]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-xl font-black text-neutral-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
      </div>
    </li>
  );
}

function Reassurance({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
      <h3 className="text-xl font-black text-neutral-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}
