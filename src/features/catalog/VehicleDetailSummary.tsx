"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  KeyRound,
  Plane,
  ShieldCheck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  formatCategory,
  formatEurCents,
  formatMadFromEurCents,
  formatTransmission,
} from "./format-price";
import type { VehicleDetailModel } from "./types";

const Acc = Accordion as any;
const AccItem = AccordionItem as any;
const AccTrigger = AccordionTrigger as any;
const AccContent = AccordionContent as any;

const TERMS = [
  {
    q: "Is this the exact model I will receive?",
    a: "Your reservation stays tied to the vehicle profile you selected. Before keys are released, your operator confirms the car details with you.",
  },
  {
    q: "How is the security deposit handled?",
    a: "Your rental total and deposit are shown before payment after pickup and return dates are selected. No deposit is collected unexpectedly at the terminal.",
  },
  {
    q: "Where do I return the vehicle?",
    a: "Return instructions are confirmed with your reservation. The handoff process includes vehicle condition review before the rental is closed.",
  },
  {
    q: "What happens if my arrival or return time changes?",
    a: "Update your reservation details as soon as possible so the team can review the pickup or return window manually.",
  },
  {
    q: "How does the document upload work?",
    a: "After checkout, you upload your license and passport through the portal. The operator reviews them before arrival so airport pickup can stay shorter and clearer.",
  },
];

const INCLUDED_BENEFITS = [
  "Comprehensive insurance included",
  "Theft and collision protection",
  "24/7 roadside breakdown assistance",
  "Airport handoff included",
  "Unlimited mileage within Morocco",
  "Cleaned and sanitized before delivery",
];

export function VehicleDetailSummary({
  vehicle,
}: {
  vehicle: VehicleDetailModel;
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const galleryImages =
    vehicle.imageUrls.length > 0
      ? vehicle.imageUrls
      : ([vehicle.primaryImageUrl].filter(Boolean) as string[]);
  const activeImage = galleryImages[activeImgIdx] ?? null;
  const bestFor = getBestFor(vehicle);
  const reserveLabel = `Reserve this ${vehicle.name}`;

  return (
    <section className="nx-container py-10 md:py-14">
      <div className="nx-meta mb-6 flex items-center gap-1.5 text-neutral-500">
        <Link
          className="cursor-pointer font-medium hover:text-neutral-700"
          href="/catalog"
        >
          Fleet
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="font-semibold text-neutral-700">{vehicle.name}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
        <div className="space-y-9">
          <div className="space-y-4">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-neutral-50 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImgIdx}
                  initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 h-full w-full"
                >
                  {activeImage ? (
                    <Image
                      alt={`${vehicle.name} exterior visual`}
                      className="object-cover"
                      fill
                      priority
                      sizes="(min-width: 1024px) 55vw, 95vw"
                      src={activeImage}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-8 text-center text-xs font-semibold text-neutral-500">
                      Image not available
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E41FC]" />
                <span className="text-[10px] font-semibold uppercase leading-none tracking-wider text-neutral-900">
                  {formatCategory(vehicle.category)}
                </span>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((imageUrl, imgIdx) => (
                  <button
                    key={imageUrl}
                    type="button"
                    aria-current={imgIdx === activeImgIdx ? "true" : undefined}
                    aria-label={`Show ${vehicle.name} image ${imgIdx + 1}`}
                    onClick={() => setActiveImgIdx(imgIdx)}
                    className={`relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)] active:scale-[0.96] ${
                      imgIdx === activeImgIdx
                        ? "border-[#1E41FC] shadow-sm"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                  >
                    <Image
                      alt={`${vehicle.name} thumbnail ${imgIdx + 1}`}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 15vw, 22vw"
                      src={imageUrl}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-[#1E41FC]" />
                Exact vehicle profile
              </span>
              <span className="h-3.5 w-px bg-neutral-200" />
              <span>Casablanca Airport CMN</span>
              <span className="h-3.5 w-px bg-neutral-200" />
              <span className="font-semibold uppercase tracking-wider text-emerald-700">
                {vehicle.status === "AVAILABLE"
                  ? "Available now"
                  : vehicle.status ?? "Offline"}
              </span>
            </div>
            <h1 className="nx-h2 mt-4 font-display font-light leading-none text-neutral-900">
              {vehicle.name}
            </h1>
            <p className="nx-lead mt-3 font-light leading-relaxed text-neutral-600">
              Lock this {vehicle.model} before you land at Casablanca Mohammed
              V Airport. Your booking stays attached to this vehicle profile,
              not just a category.
            </p>
            <p className="mt-4 rounded-2xl border border-neutral-200 bg-[#FAFAFA] px-4 py-3 text-sm font-medium leading-6 text-neutral-700">
              {bestFor}
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label mb-6 font-semibold text-neutral-500">
              Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
              <Spec label="Brand" value={vehicle.brand} />
              <Spec label="Model" value={vehicle.model} />
              <Spec
                label="Gearbox"
                value={formatTransmission(vehicle.transmission)}
              />
              <Spec
                label="Seats"
                value={vehicle.seats ? `${vehicle.seats} seats` : "To confirm"}
              />
              <Spec
                label="Luggage"
                value={
                  vehicle.luggageCount
                    ? `${vehicle.luggageCount} bags`
                    : "To confirm"
                }
              />
              <Spec label="Pickup" value="CMN airport" />
            </dl>
          </div>

          <div className="rounded-[1.25rem] bg-neutral-950 p-7 text-white shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <KeyRound className="h-4 w-4 text-[#1E41FC]" />
              </span>
              <div>
                <h3 className="nx-h4 font-display font-semibold">
                  The exact car. Never a category.
                </h3>
                <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-neutral-300">
                  This reservation stays tied to the vehicle you selected.
                  Before the keys are released, your operator confirms the car
                  details with you.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label mb-5 font-semibold text-neutral-500">
              Price clarity before pickup
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <TrustMetric
                label="Daily rate"
                value={`From ${formatEurCents(vehicle.pricePerDayEurCents)} / day`}
                detail={`Approx. ${formatMadFromEurCents(vehicle.pricePerDayEurCents)} / day`}
              />
              <TrustMetric
                label="Deposit"
                value="Shown before payment"
                detail="No deposit is collected unexpectedly at the terminal."
              />
              <TrustMetric
                label="Pickup"
                value="Airport handoff included"
                detail="No surprise pickup fee at the arrivals handoff."
              />
            </div>
            <p className="mt-4 text-sm font-light leading-6 text-neutral-600">
              Your final rental total is calculated after pickup and return
              dates are selected.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-neutral-200 bg-[#FAFAFA] p-6">
            <h2 className="font-display text-2xl font-light text-neutral-950">
              Return without guessing
            </h2>
            <p className="mt-3 text-sm font-light leading-6 text-neutral-600">
              Return instructions are confirmed with your reservation. The
              operator handoff includes a vehicle condition review before the
              rental is closed.
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label mb-5 font-semibold text-neutral-500">
              Included with every reservation
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {INCLUDED_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-xs text-neutral-700"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-sm">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label mb-3 font-semibold text-neutral-500">
              Good to know
            </h2>
            <Acc type="single" collapsible className="w-full">
              {TERMS.map((term, idx) => (
                <AccItem
                  key={term.q}
                  value={`term-${idx}`}
                  className="border-b border-neutral-200"
                >
                  <AccTrigger className="py-5 text-left font-display text-base font-semibold text-neutral-900 hover:text-[#1E41FC] hover:no-underline">
                    {term.q}
                  </AccTrigger>
                  <AccContent className="pb-5 text-sm font-light leading-relaxed text-neutral-600">
                    {term.a}
                  </AccContent>
                </AccItem>
              ))}
            </Acc>
          </div>

          <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-2xl font-light text-neutral-950">
              Ready to lock this {vehicle.model}?
            </h2>
            <p className="mt-2 text-sm font-light leading-6 text-neutral-600">
              Set dates, confirm deposit, then upload documents before arrival.
            </p>
            <Link
              aria-label={reserveLabel}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
              href={`/book/${vehicle.id}`}
            >
              {reserveLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-end justify-between border-b border-neutral-100 pb-5">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    From
                  </span>
                  <span className="font-display text-3xl font-light leading-none tracking-tight text-neutral-900">
                    {formatEurCents(vehicle.pricePerDayEurCents)}
                  </span>
                  <span className="text-xs text-neutral-500">/ day</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-neutral-600">
                  Approx. {formatMadFromEurCents(vehicle.pricePerDayEurCents)} / day
                </div>
                <div className="mt-1.5 text-xs font-light leading-5 text-neutral-500">
                  Final total and deposit are shown before payment.
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-emerald-600" />
                Available
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <PanelRow
                icon={Plane}
                label="Delivery location"
                value="Casablanca Mohammed V Airport (CMN)"
                sub="Terminal 1 or Terminal 2 arrivals"
              />
              <PanelRow
                icon={CalendarDays}
                label="Rental dates"
                value="Dates configured during checkout"
              />
              <PanelRow
                icon={ShieldCheck}
                label="Protection cover"
                value="Comprehensive insurance included"
              />
              <PanelRow
                icon={KeyRound}
                label="Key handover"
                value="Handoff prepared for a faster terminal pickup"
              />
              <PanelRow
                icon={Check}
                label="Deposit"
                value="No deposit is collected unexpectedly at the terminal"
              />
            </div>

            <div className="mt-7 pt-2">
              <Link
                aria-label={reserveLabel}
                className="nx-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
                href={`/book/${vehicle.id}`}
              >
                {reserveLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs font-light leading-relaxed text-neutral-500">
                Set dates, confirm deposit, then upload documents before
                arrival.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-[#FAFAFA] p-4">
      <dt className="font-mono text-[9px] font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-tight text-neutral-900">
        {value}
      </dd>
    </div>
  );
}

function TrustMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1rem] border border-neutral-200 bg-white p-4">
      <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-snug text-neutral-950">
        {value}
      </div>
      <p className="mt-1 text-xs font-light leading-5 text-neutral-600">
        {detail}
      </p>
    </div>
  );
}

function PanelRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-[#1E41FC]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </div>
        <div className="mt-0.5 font-semibold leading-snug text-neutral-900">
          {value}
        </div>
        {sub && (
          <div className="mt-0.5 text-[10px] font-light leading-tight text-neutral-500">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function getBestFor(vehicle: VehicleDetailModel): string {
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
