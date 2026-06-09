"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Plane,
  KeyRound,
  Star,
  CalendarDays,
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
    a: "Yes. Nexus never substitutes. The make, model, year, and trim shown here is exactly what waits for you at arrivals.",
  },
  {
    q: "What is included in the price?",
    a: "Premium insurance, theft protection, 24/7 roadside assistance, unlimited mileage within Morocco, and the airport meet-and-greet handover.",
  },
  {
    q: "How does the document upload work?",
    a: "After checkout, you will upload your license and passport to the portal. Our operator verifies them remotely so that key pickup takes under 10 minutes.",
  },
];

const INCLUDED_BENEFITS = [
  "Premium comprehensive insurance",
  "Theft and collision protection",
  "24/7 roadside breakdown assistance",
  "Free airport meet-and-greet handover",
  "Unlimited mileage within Morocco",
  "Cleaned and sanitized before delivery",
];

export function VehicleDetailSummary({
  vehicle,
}: {
  vehicle: VehicleDetailModel;
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const galleryImages = vehicle.imageUrls.length > 0 ? vehicle.imageUrls : [vehicle.primaryImageUrl].filter(Boolean) as string[];
  const activeImage = galleryImages[activeImgIdx] ?? null;

  return (
    <section className="nx-container py-10 md:py-14">
      {/* Breadcrumbs */}
      <div className="nx-meta text-neutral-400 mb-6 flex items-center gap-1.5">
        <Link className="hover:text-neutral-700 cursor-pointer font-medium" href="/catalog">
          Fleet
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-700 font-semibold">{vehicle.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-9">
          {/* Main Visual */}
          <div className="space-y-4">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-neutral-50">
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
                <div className="flex h-full items-center justify-center px-8 text-center text-xs font-semibold text-neutral-400">
                  Image not provided by backend
                </div>
              )}
              <div className="absolute top-5 left-5 inline-flex items-center gap-2 bg-white rounded-full px-3.5 py-1.5 border border-neutral-200 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-900 leading-none">
                  {formatCategory(vehicle.category)}
                </span>
              </div>
            </div>

            {/* Thumbnails list */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((imageUrl, imgIdx) => (
                  <button
                    key={imageUrl}
                    onClick={() => setActiveImgIdx(imgIdx)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      imgIdx === activeImgIdx ? "border-[#1E41FC]" : "border-transparent hover:border-neutral-300"
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

          {/* Title and Intro */}
          <div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-neutral-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#1E41FC] fill-[#1E41FC]" />
                4.98 Rating
              </span>
              <span className="w-px h-3.5 bg-neutral-200" />
              <span className="text-neutral-500">Casablanca Airport CMN</span>
              <span className="w-px h-3.5 bg-neutral-200" />
              <span className="text-emerald-600 font-semibold uppercase tracking-wider">
                {vehicle.status === "AVAILABLE" ? "Available now" : vehicle.status ?? "Offline"}
              </span>
            </div>
            <h1 className="nx-h2 font-display font-light text-neutral-900 mt-4 leading-none">
              {vehicle.name}
            </h1>
            <p className="nx-lead text-neutral-600 mt-3 font-light leading-relaxed">
              {vehicle.brand} {vehicle.model} available for airport delivery. Lock this exact vehicle before landing at Casablanca Mohammed V Airport.
            </p>
          </div>

          {/* Specs Details */}
          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label text-neutral-400 mb-6 font-semibold">Specifications</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <Spec label="Brand" value={vehicle.brand} />
              <Spec label="Model" value={vehicle.model} />
              <Spec label="Transmission" value={formatTransmission(vehicle.transmission)} />
              <Spec label="Seats Count" value={vehicle.seats ? String(vehicle.seats) : "N/A"} />
              <Spec label="Luggage Count" value={vehicle.luggageCount ? String(vehicle.luggageCount) : "N/A"} />
              <Spec label="Fuel Class" value="Premium / Hybrid" />
            </dl>
          </div>

          {/* Exact model promise */}
          <div className="rounded-[1.25rem] bg-neutral-950 text-white p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-[#1E41FC]" />
              </span>
              <div>
                <h3 className="nx-h4 font-display font-semibold">The exact car. Never a category.</h3>
                <p className="text-sm text-neutral-300 mt-2 font-light leading-relaxed max-w-xl">
                  You are reserving this specific license plate and trim. Nexus never substitutes or downgrades your reservation.
                </p>
              </div>
            </div>
          </div>

          {/* Included benefits list */}
          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label text-neutral-400 mb-5 font-semibold">Included with every reservation</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {INCLUDED_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-xs text-neutral-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Good to know details */}
          <div className="border-t border-neutral-200 pt-8">
            <h2 className="nx-label text-neutral-400 mb-3 font-semibold">Good to know</h2>
            <Acc type="single" collapsible className="w-full">
              {TERMS.map((t, idx) => (
                <AccItem key={idx} value={`term-${idx}`} className="border-b border-neutral-200">
                  <AccTrigger className="text-left font-display text-base font-semibold text-neutral-900 py-5 hover:no-underline hover:text-[#1E41FC]">
                    {t.q}
                  </AccTrigger>
                  <AccContent className="text-sm text-neutral-600 leading-relaxed pb-5 font-light">
                    {t.a}
                  </AccContent>
                </AccItem>
              ))}
            </Acc>
          </div>
        </div>

        {/* RIGHT COLUMN - BOOKING PANEL */}
        <aside className="lg:sticky lg:top-28">
          <div className="bg-white border border-neutral-200 rounded-[1.5rem] p-6 md:p-7 shadow-sm">
            <div className="flex items-end justify-between border-b border-neutral-100 pb-5">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-light tracking-tight text-neutral-900 leading-none">
                    {formatEurCents(vehicle.pricePerDayEurCents)}
                  </span>
                  <span className="text-xs text-neutral-500">/day</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-light mt-1.5">
                  Refundable security deposit verified at checkout
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Available
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <PanelRow icon={Plane} label="Delivery location" value="Casablanca Mohammed V Airport (CMN)" sub="Terminal 1 or Terminal 2 arrivals" />
              <PanelRow icon={CalendarDays} label="Rental dates" value="Dates configured during checkout" />
              <PanelRow icon={ShieldCheck} label="Protection cover" value="Full comprehensive insurance included" />
              <PanelRow icon={KeyRound} label="Key handover" value="Keys delivered at terminal in under 10 mins" />
            </div>

            <div className="mt-7 pt-2">
              <Link
                aria-label={`Book ${vehicle.name} — continue to booking form`}
                className="nx-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC]"
                href={`/book/${vehicle.id}`}
              >
                Continue to booking
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[10px] text-neutral-400 text-center mt-3 font-light leading-relaxed">
                Free cancellation up to 24 hours prior to pickup
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
      <dt className="font-semibold text-neutral-500 uppercase tracking-widest text-[9px] font-mono">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-neutral-900 leading-none">{value}</dd>
    </div>
  );
}

function PanelRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Plane;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-[#1E41FC] shrink-0 border border-neutral-100">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">{label}</div>
        <div className="font-semibold text-neutral-900 mt-0.5 leading-snug">{value}</div>
        {sub && <div className="text-[10px] text-neutral-500 font-light mt-0.5 leading-tight">{sub}</div>}
      </div>
    </div>
  );
}
