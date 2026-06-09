"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Plane,
  Timer,
  FileCheck2,
  ChevronRight,
  ArrowUpRight,
  Car,
} from "lucide-react";
import { formatCategory, formatEurCents, formatTransmission } from "@/features/catalog/format-price";
import type { VehicleCardModel } from "@/features/catalog/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Acc = Accordion as any;
const AccItem = AccordionItem as any;
const AccTrigger = AccordionTrigger as any;
const AccContent = AccordionContent as any;

const EASE = [0.16, 1, 0.3, 1];

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28, filter: "blur(4px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export function PublicHome({
  featuredVehicles,
}: {
  featuredVehicles: VehicleCardModel[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const featured = featuredVehicles.slice(0, 3);
  const activeCar = featured[activeTab] ?? null;

  return (
    <div className="bg-white text-neutral-900 font-body">
      {/* 1. HERO SECTION */}
      <section id="top" className="relative w-full bg-white overflow-hidden border-b border-neutral-100">
        <div className="nx-container pt-20 md:pt-24 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-14 items-center">
            {/* Hero Left Content */}
            <div className="relative space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center gap-3"
              >
                <span className="inline-block w-8 h-px bg-neutral-900" />
                <span className="nx-eyebrow font-medium text-neutral-600">
                  Casablanca · Mohammed V Intl. — CMN
                </span>
              </motion.div>

              <h1 className="nx-display font-display font-light text-neutral-900 tracking-tight leading-none">
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.9, ease: EASE }}
                  className="block"
                >
                  Arrive
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.9, ease: EASE }}
                  className="block"
                >
                  at a{" "}
                  <span className="italic text-[#1E41FC] font-light">higher</span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.9, ease: EASE }}
                  className="block"
                >
                  standard.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.9 }}
                className="nx-lead max-w-[34rem] text-neutral-600 font-light"
              >
                Premium airport car rental at{" "}
                <span className="text-neutral-950 font-medium">
                  Casablanca Mohammed V Airport
                </span>
                . Select the exact vehicle, verify your documents online before takeoff, and drive off immediately.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.9 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/catalog"
                  className="nx-btn-primary group inline-flex items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-8 pr-7 py-4 text-[1.05rem] font-medium transition-all duration-300"
                >
                  Reserve a vehicle
                  <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#fleet"
                  className="nx-link inline-flex items-center gap-2 text-[1.05rem] font-semibold text-neutral-900 hover:text-[#1E41FC] transition-colors duration-300"
                >
                  Explore the fleet
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.9 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 text-xs text-neutral-500 font-medium"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available now at CMN
                </span>
                <span className="w-px h-4 bg-neutral-200" />
                <span>Verified documents checking</span>
                <span className="w-px h-4 bg-neutral-200" />
                <span>Free cancellation within 24h</span>
              </motion.div>
            </div>

            {/* Hero Right Visual */}
            <div className="relative flex justify-center lg:justify-end">
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[70%] h-8 rounded-[50%] bg-black/10 blur-2xl"
              />
              <motion.div
                initial={{ opacity: 0, x: 100, scale: 1.02 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1.2, ease: EASE }}
                className="relative w-full max-w-[580px] aspect-[4/3] rounded-3xl border border-neutral-200 overflow-hidden bg-neutral-50"
              >
                {activeCar?.primaryImageUrl ? (
                  <Image
                    alt="Premium rental fleet preview"
                    className="object-cover"
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    src={activeCar.primaryImageUrl}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-neutral-400 gap-3">
                    <Car className="w-10 h-10 stroke-1" />
                    <span className="text-sm font-medium">Premium fleet ready for pickup</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                {activeCar && (
                  <div className="absolute bottom-5 left-5 text-white">
                    <span className="text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-md rounded-full px-3 py-1 font-semibold">
                      {formatCategory(activeCar.category)}
                    </span>
                    <h3 className="text-lg font-display font-medium mt-2 leading-none">
                      {activeCar.name}
                    </h3>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Reassurance Row */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-10">
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4">
              <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center text-[#1E41FC]">
                <Plane className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold text-neutral-900 leading-tight">
                  Airport-first logistics
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Met directly in Terminal 1 or 2 arrivals.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4">
              <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center text-[#1E41FC]">
                <Timer className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold text-neutral-900 leading-tight">
                  Keys under ten minutes
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Skip the lines. Digital checkout verified.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4">
              <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center text-[#1E41FC]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold text-neutral-900 leading-tight">
                  All-inclusive coverage
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Fully verified deposit protection & local insurance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC FLEET / TAB SECTION */}
      {featured.length > 0 ? (
        <section id="fleet" className="relative bg-[#FAFAFA] border-b border-neutral-100 overflow-hidden">
          {/* Subtle large background number */}
          <div className="pointer-events-none absolute top-4 right-12 select-none">
            <span className="block font-display leading-none font-extrabold text-neutral-200/50 text-[140px] md:text-[200px]">
              {String(activeTab + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="relative nx-container nx-section">
            <div className="mb-10 max-w-3xl">
              <Reveal>
                <span className="nx-eyebrow text-neutral-500 font-medium">The Fleet</span>
                <h2 className="nx-h2 font-display mt-3 font-light text-neutral-900 tracking-tight">
                  The exact car.
                  <br />
                  <span className="italic text-neutral-400">Never a placeholder.</span>
                </h2>
                <p className="nx-lead mt-4 text-neutral-600 font-light">
                  Casablanca-V1 guarantees you collect the exact make, model, and trim that you book. Browse the preview fleet fetched directly from the backend.
                </p>
              </Reveal>
            </div>

            {/* Tabs Selector */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              {featured.map((car, idx) => (
                <button
                  key={car.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-5 py-3 rounded-full text-sm font-medium transition-colors border ${
                    idx === activeTab
                      ? "bg-neutral-950 text-white border-neutral-950"
                      : "bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <span className="font-mono text-xs mr-2 opacity-50">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {car.name}
                </button>
              ))}
            </div>

            {/* Studio Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-14 items-center">
              {/* Image box */}
              <div className="relative rounded-[24px] overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[16/10]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCar?.id}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {activeCar?.primaryImageUrl ? (
                      <Image
                        alt={activeCar.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 50vw, 90vw"
                        src={activeCar.primaryImageUrl}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-neutral-50 text-neutral-400">
                        Image not available
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-neutral-200 text-xs font-semibold text-neutral-950 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
                  {formatCategory(activeCar?.category)}
                </div>
              </div>

              {/* Specs box */}
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                    {formatCategory(activeCar?.category)} Class
                  </span>
                  <h3 className="text-3xl font-display font-light text-neutral-950 mt-1">
                    {activeCar?.name}
                  </h3>
                </div>

                <div className="flex items-baseline">
                  <span className="font-display text-4xl font-light text-neutral-950 leading-none">
                    {formatEurCents(activeCar?.pricePerDayEurCents ?? 0)}
                  </span>
                  <span className="text-neutral-500 text-sm ml-2">/day</span>
                </div>

                {/* Specs Grid */}
                <dl className="grid grid-cols-3 gap-4 border-t border-neutral-200 pt-6">
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      Transmission
                    </dt>
                    <dd className="text-lg font-medium text-neutral-950 mt-1 leading-none">
                      {formatTransmission(activeCar?.transmission)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      Seats
                    </dt>
                    <dd className="text-lg font-medium text-neutral-950 mt-1 leading-none">
                      {activeCar?.seats ?? "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      Luggage
                    </dt>
                    <dd className="text-lg font-medium text-neutral-950 mt-1 leading-none">
                      {activeCar?.luggageCount ?? "N/A"}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-100">
                  <Link
                    href={`/book/${activeCar?.id}`}
                    className="nx-btn-primary inline-flex items-center justify-center gap-2 bg-[#0a0a0a] text-white hover:bg-[#1E41FC] rounded-full px-6 py-3.5 text-[0.95rem] font-medium transition-colors"
                  >
                    Reserve this vehicle
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/catalog/${activeCar?.id}`}
                    className="inline-flex items-center justify-center gap-2 border border-neutral-200 hover:border-neutral-900 rounded-full px-6 py-3.5 text-[0.95rem] font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    Full details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-neutral-50 py-16 text-center border-b border-neutral-100">
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-neutral-200">
            <Car className="w-8 h-8 mx-auto text-neutral-400 stroke-1" />
            <h3 className="mt-3 text-lg font-semibold text-neutral-900">Fleet preview offline</h3>
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              We couldn&apos;t connect to the backend fleet API. Open the catalog route to query the database.
            </p>
            <Link
              href="/catalog"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1E41FC] hover:underline"
            >
              Go to catalog <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative bg-white border-b border-neutral-100">
        <div className="nx-container nx-section">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <Reveal>
              <span className="nx-eyebrow text-neutral-500 font-medium">How it works</span>
              <h2 className="nx-h2 font-display mt-3 font-light text-neutral-900 tracking-tight font-light leading-none">
                Three steps.
                <br />
                <span className="italic text-neutral-400">Zero friction.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="nx-lead text-neutral-600 max-w-sm font-light">
                Designed for premium travelers who measure timing in flights, not queues.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-neutral-200">
            {[
              {
                n: "01",
                title: "Reserve",
                copy: "Choose your exact make, model, and trim from our real catalog. Secure daily rates instantly.",
              },
              {
                n: "02",
                title: "Verify",
                copy: "Upload your driver&apos;s license and passport online before arrival. Our operators approve them in advance.",
              },
              {
                n: "03",
                title: "Drive",
                copy: "Meet your operator at the arrival hall, sign a single digital handover, and collect your keys immediately.",
              },
            ].map((s, idx) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.8 }}
                className={`group py-10 md:py-12 px-6 md:px-8 hover:bg-neutral-50/50 transition-colors duration-300 ${
                  idx !== 2 ? "border-b md:border-b-0 md:border-r border-neutral-200" : ""
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-display font-light text-neutral-300 group-hover:text-[#1E41FC] transition-colors duration-500 text-5xl md:text-6xl">
                    {s.n}
                  </span>
                  <span className="h-px w-8 bg-neutral-300 group-hover:w-16 group-hover:bg-[#1E41FC] transition-all duration-500" />
                </div>
                <h3 className="text-xl font-display font-medium text-neutral-950 mt-5">{s.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed mt-3">{s.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AIRPORT CONVENIENCE */}
      <section id="airport" className="relative bg-white border-b border-neutral-100">
        <div className="nx-container nx-section">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Visual Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-100 aspect-[16/11]"
            >
              <Image
                alt="Modern airport terminal arrival logistics"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=800"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              <div className="absolute left-5 bottom-5 right-5 md:right-auto bg-white border border-neutral-200 rounded-2xl p-5 md:w-[320px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Live flight track
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    On time
                  </span>
                </div>
                <div className="mt-2 font-display text-base font-semibold text-neutral-900">
                  RAM 802 · ORY → CMN
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Terminal 2 · Gate B09 · Landing 18:22
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
                      Operator
                    </span>
                    <div className="font-semibold text-neutral-900">Yassine · 4.95</div>
                  </div>
                  <span className="bg-[#1E41FC] text-white font-mono text-[9px] px-2 py-0.5 rounded-full">
                    AWAITING
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Copy Block */}
            <div className="space-y-8">
              <Reveal>
                <span className="nx-eyebrow text-neutral-500 font-medium">Casablanca Airport Location</span>
                <h2 className="nx-h2 font-display mt-3 font-light text-neutral-900 tracking-tight leading-none">
                  Terminal to tarmac.
                  <br />
                  <span className="italic text-neutral-400">In minutes.</span>
                </h2>
                <p className="nx-lead text-neutral-600 mt-4 font-light">
                  Skip the lines at airport rental offices. With Casablanca-V1, document uploads and identity checks are finalized prior to arrival, so you are off in minutes.
                </p>
              </Reveal>

              <ul className="space-y-5">
                {[
                  {
                    icon: FileCheck2,
                    t: "Verify before you fly",
                    c: "Upload driving credentials securely. Operators review them early to prevent check-in delays.",
                  },
                  {
                    icon: Plane,
                    t: "Aviation-first coordination",
                    c: "Flights are tracked via real-time endpoints. Operator meets you at the arrivals gate holding your keys.",
                  },
                  {
                    icon: Timer,
                    t: "Ignition in under ten minutes",
                    c: "Verify identity via secure QR code scan on the operator&apos;s app, sign the handoff, and drive off.",
                  },
                ].map((pt, idx) => (
                  <motion.li
                    key={pt.t}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.7 }}
                    className="flex gap-4 items-start"
                  >
                    <span className="shrink-0 mt-0.5 w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-800">
                      <pt.icon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-base font-semibold text-neutral-950 font-display">{pt.t}</h4>
                      <p className="text-sm text-neutral-600 mt-1">{pt.c}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="/catalog"
                  className="nx-btn-primary inline-flex items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-6 pr-5 py-3.5 text-sm font-semibold transition-colors duration-300"
                >
                  Plan my arrival
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS / LUXURY BRANDING */}
      <section className="bg-neutral-950 text-white overflow-hidden py-20">
        <div className="nx-container">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 items-center">
            <div className="space-y-5">
              <span className="nx-eyebrow text-neutral-400 font-medium tracking-widest text-xs">Customer Reviews</span>
              <h2 className="text-4xl md:text-5xl font-display font-light tracking-tight leading-none">
                Elite service
                <br />
                <span className="italic text-neutral-400">highly rated.</span>
              </h2>
              <p className="text-neutral-400 font-light text-base leading-relaxed">
                Hundreds of premium travelers choose Casablanca-V1 for their airport car rentals in Morocco.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <p className="text-sm italic text-neutral-200 font-light leading-relaxed">
                  &ldquo;No lines, no desk agents pushing insurance add-ons. My BMW was parked right outside terminal arrivals, keys in hand in under 5 minutes. Outstanding.&rdquo;
                </p>
                <div>
                  <h4 className="text-sm font-semibold">Amine K.</h4>
                  <p className="text-xs text-neutral-500">Executive Member · May 2026</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <p className="text-sm italic text-neutral-200 font-light leading-relaxed">
                  &ldquo;I was skeptical about booking the exact license plate, but it works. The Porsche was pristine. Digital document upload is a game changer.&rdquo;
                </p>
                <div>
                  <h4 className="text-sm font-semibold">Sarah M.</h4>
                  <p className="text-xs text-neutral-500">Frequent Flyer · June 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="relative bg-white border-b border-neutral-100">
        <div className="nx-container-narrow nx-section">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
            <div>
              <Reveal>
                <span className="nx-eyebrow text-neutral-500 font-medium">FAQ</span>
                <h2 className="nx-h2 font-display mt-3 font-light text-neutral-900 tracking-tight leading-none">
                  Questions,
                  <br />
                  <span className="italic text-neutral-400">answered.</span>
                </h2>
                <p className="text-neutral-500 text-sm mt-4 leading-relaxed font-light">
                  Have questions about our airport pickup, insurance cover, or deposit verification? Our concierge is standing by.
                </p>
              </Reveal>
            </div>

            <Acc type="single" collapsible className="w-full">
              {[
                {
                  q: "Where do I meet my operator at Casablanca airport?",
                  a: "Your operator meets you inside Terminal 1 or 2 Arrivals (based on flight DTO details), holding a Nexus placard. We coordinate timing dynamically.",
                },
                {
                  q: "What if my flight is delayed?",
                  a: "We integrate flight tracking coordinates. If your flight lands late, your pickup time is updated automatically without late fees.",
                },
                {
                  q: "How does document verification work?",
                  a: "After completing your Stripe checkout, upload your driver's license and ID. Operator checks them immediately for instant key handoff.",
                },
                {
                  q: "Is the daily price inclusive?",
                  a: "Yes. Daily rates are fetched directly in EUR cents. Insurance and local airport surcharges are included transparently.",
                },
                {
                  q: "What is your cancellation policy?",
                  a: "Free cancellation is available up to 24 hours prior to scheduled rental commencement. Refund checks are processed instantly.",
                },
              ].map((faq, fIdx) => (
                <AccItem
                  key={fIdx}
                  value={`faq-${fIdx}`}
                  className="border-b border-neutral-200"
                >
                  <AccTrigger className="text-left font-display text-lg font-medium text-neutral-900 py-6 hover:no-underline hover:text-[#1E41FC] transition-colors">
                    {faq.q}
                  </AccTrigger>
                  <AccContent className="text-sm text-neutral-600 leading-relaxed pb-6 font-light">
                    {faq.a}
                  </AccContent>
                </AccItem>
              ))}
            </Acc>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA / TRANSITION */}
      <section className="bg-neutral-50 border-b border-neutral-100 py-16">
        <div className="nx-container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h3 className="text-2xl font-display font-light text-neutral-950">
              Find your vehicle for the journey.
            </h3>
            <p className="text-sm text-neutral-600">
              Browse the catalog, review specifications and pricing, and start your check-in.
            </p>
          </div>
          <Link
            href="/catalog"
            className="nx-btn-primary inline-flex items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full px-6 py-3.5 text-sm font-semibold transition-colors duration-300"
          >
            Browse catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
