"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Car,
  ChevronRight,
  Plane,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  formatCategory,
  formatEurCents,
  formatMadFromEurCents,
  formatTransmission,
} from "@/features/catalog/format-price";
import type { VehicleCardModel } from "@/features/catalog/types";

const Acc = Accordion as any;
const AccItem = AccordionItem as any;
const AccTrigger = AccordionTrigger as any;
const AccContent = AccordionContent as any;

const EASE = [0.16, 1, 0.3, 1];
const FLEET_SPRING = { type: "spring", stiffness: 280, damping: 28, mass: 0.9 } as const;
const FLEET_TRANSITION = { duration: 0.55, ease: EASE } as const;
const HERO_WORDS = ["higher", "calmer", "smoother"];
const HOW_IT_WORKS_STEPS = [
  {
    n: "01",
    title: "Reserve",
    copy: "Choose your exact make, model, and trim from our real catalog. Secure daily rates instantly.",
  },
  {
    n: "02",
    title: "Verify",
    copy: "Upload your driver's license and passport online before arrival. Our operators approve them in advance.",
  },
  {
    n: "03",
    title: "Drive",
    copy: "Meet your operator at the arrival hall, sign a single digital handover, and collect your keys immediately.",
  },
] as const;
const REVIEW_ITEMS = [
  {
    quote:
      "The exact vehicle in the catalog was the one waiting for me. That clarity made the booking feel much more serious.",
    name: "Amine K.",
    context: "Illustrative demo feedback",
  },
  {
    quote:
      "Uploading documents before takeoff removed the usual desk delay. Pickup felt calm instead of procedural.",
    name: "Sarah M.",
    context: "Illustrative demo feedback",
  },
  {
    quote:
      "I liked seeing the rate clearly before checkout. The deposit step was separate, which made the pricing easier to understand.",
    name: "Nadia R.",
    context: "Illustrative demo feedback",
  },
  {
    quote:
      "The airport handoff was straightforward. We confirmed the booking, checked the documents, and moved on quickly.",
    name: "Youssef B.",
    context: "Illustrative demo feedback",
  },
  {
    quote:
      "Choosing the exact car mattered to me. I did not want a generic category and the catalog made that decision easy.",
    name: "Clara T.",
    context: "Illustrative demo feedback",
  },
  {
    quote:
      "This feels better for arrivals than standing at a rental counter. Less friction, less guesswork, more control.",
    name: "David L.",
    context: "Illustrative demo feedback",
  },
] as const;
const FAQ_ITEMS = [
  {
    q: "Where do I meet my operator at Casablanca airport?",
    a: "Your pickup instructions are tied to the reservation. For CMN handoffs, the operator meets you in the arrivals area for the terminal listed on your booking.",
  },
  {
    q: "What documents do I need before pickup?",
    a: "You should be ready to provide a valid driver's license plus the identity document requested during verification, typically a passport or national ID.",
  },
  {
    q: "How does document verification work?",
    a: "After you reserve, you upload the requested documents through the check-in flow. An operator reviews them before handoff so the airport pickup can stay shorter and clearer.",
  },
  {
    q: "When is the deposit authorized or charged?",
    a: "The security deposit is authorized through Stripe during checkout. It is not charged at that moment, and the current flow only describes capture after the required delivery and document checks.",
  },
  {
    q: "What happens if my document is rejected?",
    a: "If a required document cannot be approved, the handoff cannot proceed yet. You would need to provide a valid replacement through the verification flow before pickup.",
  },
  {
    q: "What if my arrival time changes?",
    a: "Update your reservation details as soon as possible so the pickup window can be adjusted manually. This demo does not claim automatic live flight tracking.",
  },
  {
    q: "Is the daily price inclusive?",
    a: "The daily price shown on the vehicle card is the rental rate for that exact vehicle. Deposit authorization is shown separately during checkout, and the vehicle detail page is the right place to review included cover and conditions.",
  },
  {
    q: "What is your cancellation policy?",
    a: "The current product copy states free cancellation up to 24 hours before pickup.",
  },
] as const;

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 1.05, delay, ease: EASE }}
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
  const [activeWord, setActiveWord] = useState(0);
  const [fleetPaused, setFleetPaused] = useState(false);
  const [activeHowStep, setActiveHowStep] = useState(0);
  const [howItWorksPaused, setHowItWorksPaused] = useState(false);
  const [activeReviewGroup, setActiveReviewGroup] = useState(0);
  const [reviewsPaused, setReviewsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const howItWorksResumeTimer = useRef<number | null>(null);
  const reviewsResumeTimer = useRef<number | null>(null);
  const featured = featuredVehicles.slice(0, 3);
  const activeCar = featured[activeTab] ?? null;
  const reviewGroups = Array.from(
    { length: Math.ceil(REVIEW_ITEMS.length / 2) },
    (_, index) => REVIEW_ITEMS.slice(index * 2, index * 2 + 2),
  );
  const visibleReviews = reviewGroups[activeReviewGroup] ?? REVIEW_ITEMS.slice(0, 2);

  function pauseHowItWorks(resumeDelay?: number) {
    setHowItWorksPaused(true);
    if (howItWorksResumeTimer.current !== null) {
      window.clearTimeout(howItWorksResumeTimer.current);
      howItWorksResumeTimer.current = null;
    }
    if (resumeDelay) {
      howItWorksResumeTimer.current = window.setTimeout(() => {
        setHowItWorksPaused(false);
        howItWorksResumeTimer.current = null;
      }, resumeDelay);
    }
  }

  function resumeHowItWorks() {
    if (howItWorksResumeTimer.current !== null) {
      window.clearTimeout(howItWorksResumeTimer.current);
      howItWorksResumeTimer.current = null;
    }
    setHowItWorksPaused(false);
  }

  function pauseReviews(resumeDelay?: number) {
    setReviewsPaused(true);
    if (reviewsResumeTimer.current !== null) {
      window.clearTimeout(reviewsResumeTimer.current);
      reviewsResumeTimer.current = null;
    }
    if (resumeDelay) {
      reviewsResumeTimer.current = window.setTimeout(() => {
        setReviewsPaused(false);
        reviewsResumeTimer.current = null;
      }, resumeDelay);
    }
  }

  function resumeReviews() {
    if (reviewsResumeTimer.current !== null) {
      window.clearTimeout(reviewsResumeTimer.current);
      reviewsResumeTimer.current = null;
    }
    setReviewsPaused(false);
  }

  useEffect(() => {
    if (shouldReduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % HERO_WORDS.length);
    }, 6800);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || fleetPaused || featured.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveTab((current) => (current + 1) % featured.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [featured.length, fleetPaused, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || howItWorksPaused) return;

    const timer = window.setInterval(() => {
      setActiveHowStep((current) => (current + 1) % HOW_IT_WORKS_STEPS.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [howItWorksPaused, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || reviewsPaused || reviewGroups.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveReviewGroup((current) => (current + 1) % reviewGroups.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [reviewGroups.length, reviewsPaused, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (howItWorksResumeTimer.current !== null) {
        window.clearTimeout(howItWorksResumeTimer.current);
      }
      if (reviewsResumeTimer.current !== null) {
        window.clearTimeout(reviewsResumeTimer.current);
      }
    };
  }, []);

  return (
    <div className="bg-white font-body text-neutral-900">
      <section
        id="top"
        className="relative overflow-hidden border-b border-neutral-100 bg-white"
      >
        <div className="mx-auto w-full max-w-[1660px] px-[clamp(1.5rem,4vw,4rem)] pt-14 pb-8 md:pt-16 md:pb-10 lg:pt-14">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] xl:gap-8">
            <div className="relative space-y-7 pt-4 lg:pt-8">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="flex items-center gap-3"
              >
                <span className="inline-block h-px w-8 bg-neutral-900" />
                <span className="nx-eyebrow font-medium text-neutral-600">
                  Casablanca - Mohammed V Intl. - CMN
                </span>
              </motion.div>

              <h1
                aria-label={`Arrive at a ${HERO_WORDS[activeWord]} standard.`}
                className="font-display text-[clamp(4.25rem,6.5vw,5.55rem)] font-light leading-[0.93] tracking-[-0.04em] text-neutral-900 [text-wrap:balance]"
              >
                <motion.span
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03, duration: 0.82, ease: EASE }}
                  className="block"
                >
                  Arrive
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.82, ease: EASE }}
                  className="flex flex-nowrap items-baseline gap-[0.18em] whitespace-nowrap"
                >
                  <span>at a</span>
                  <span className="relative inline-grid min-w-[3.9em] align-baseline text-[#1E41FC]">
                    {HERO_WORDS.map((word, index) => (
                      <motion.span
                        key={word}
                        aria-hidden="true"
                        initial={false}
                        animate={{
                          opacity: index === activeWord ? 1 : 0,
                          filter: index === activeWord ? "blur(0px)" : "blur(8px)",
                        }}
                        transition={{ duration: 1.25, ease: EASE }}
                        className="col-start-1 row-start-1 inline-block whitespace-nowrap italic font-light"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.21, duration: 0.82, ease: EASE }}
                  className="block"
                >
                  standard.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0.55, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.78, ease: EASE }}
                className="max-w-[33rem] text-[clamp(1.14rem,1.15vw,1.42rem)] font-light leading-[1.55] text-neutral-700 [text-wrap:pretty]"
              >
                Airport-first car rental at{" "}
                <span className="font-medium text-neutral-950">
                  Casablanca Mohammed V Airport
                </span>
                . Select from the live fleet, verify documents before takeoff,
                and meet an operator who is already aligned to your arrival.
              </motion.p>

              <motion.div
                initial={{ opacity: 0.7, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.68, ease: EASE }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/catalog"
                  className="nx-btn-primary group inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] pl-8 pr-7 py-4 text-[1.05rem] font-medium text-white transition-all duration-300 hover:bg-[#1E41FC]"
                >
                  Reserve a vehicle
                  <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#fleet"
                  className="nx-link inline-flex items-center gap-2 text-[1.05rem] font-semibold text-neutral-900 transition-colors duration-300 hover:text-[#1E41FC]"
                >
                  Explore the fleet
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0.75, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, duration: 0.6, ease: EASE }}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-xs font-medium text-neutral-600"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live fleet at CMN
                </span>
                <span className="h-4 w-px bg-neutral-200" />
                <span>Documents checked before arrival</span>
                <span className="h-4 w-px bg-neutral-200" />
                <span>Free cancellation within 24h</span>
              </motion.div>
            </div>

            <div className="relative flex w-full justify-center lg:justify-end lg:pt-7 xl:pt-8">
              <motion.div
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, x: 52, y: 10, clipPath: "inset(10% 0 0 0 round 2rem)" }
                }
                animate={{ opacity: 1, x: 0, y: 0, clipPath: "inset(0% 0 0 0 round 2rem)" }}
                transition={{ duration: 1.15, ease: EASE }}
                className="relative w-full max-w-[clamp(44rem,52vw,68rem)] lg:translate-x-[2%] xl:translate-x-[4%]"
              >
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_45%_30%,rgba(30,65,252,0.10),transparent_42%),linear-gradient(180deg,rgba(10,10,10,0.07),transparent_62%)] blur-2xl" />
                <div className="rounded-[1.9rem] border border-neutral-200/90 bg-white p-2 shadow-[0_28px_80px_-52px_rgba(10,10,10,0.48)] sm:p-2.5">
                  <div className="relative aspect-[1414/941] w-full overflow-hidden rounded-[1.32rem] bg-neutral-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
                    <Image
                      alt="Airport handover at Casablanca Mohammed V Airport"
                      className="select-none object-cover object-center"
                      fill
                      priority
                      unoptimized
                      sizes="(min-width: 1536px) 54vw, (min-width: 1024px) 50vw, 94vw"
                      src="/hero2img.png"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.10),transparent_34%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0.14))]" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-7 md:grid-cols-3">
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-sm active:scale-[0.98]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-[#1E41FC]">
                <Plane className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold leading-tight text-neutral-900">
                  Airport-first logistics
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Met directly in Terminal 1 or 2 arrivals.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-sm active:scale-[0.98]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-[#1E41FC]">
                <Timer className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold leading-tight text-neutral-900">
                  Keys under ten minutes
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Skip the lines. Digital checkout verified.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-sm active:scale-[0.98]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-[#1E41FC]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold leading-tight text-neutral-900">
                  All-inclusive coverage
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Fully verified deposit protection and local insurance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section
          id="fleet"
          className="relative overflow-hidden border-b border-neutral-100 bg-[#FAFAFA]"
          onMouseEnter={() => setFleetPaused(true)}
          onMouseLeave={() => setFleetPaused(false)}
          onFocus={() => setFleetPaused(true)}
          onBlur={() => setFleetPaused(false)}
        >
          <div className="pointer-events-none absolute right-10 top-3 select-none">
            <span className="block font-display text-[112px] font-extrabold leading-none text-neutral-200/55 md:text-[148px]">
              {String(activeTab + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="nx-container py-[clamp(2.75rem,3.8vw,4rem)]">
            <div className="mb-6 max-w-[43rem]">
              <Reveal>
                <span className="nx-eyebrow font-medium text-neutral-500">
                  The Fleet
                </span>
                <h2 className="mt-3 font-display text-[clamp(2.35rem,3.6vw,3.95rem)] font-light leading-[0.98] tracking-[-0.035em] text-neutral-900">
                  The exact car.
                  <br />
                  <span className="italic text-neutral-400">
                    Never a placeholder.
                  </span>
                </h2>
                <p className="mt-3 max-w-[38rem] text-[clamp(1rem,0.95vw,1.16rem)] font-light leading-[1.5] text-neutral-600">
                  This preview is fetched from the live catalog. It helps you
                  choose confidently without pretending seed imagery is more
                  precise than the data behind it.
                </p>
              </Reveal>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              {featured.map((car, idx) => {
                const isActive = idx === activeTab;

                return (
                  <motion.button
                    key={car.id}
                    layout
                    transition={FLEET_SPRING}
                    onClick={() => {
                      setActiveTab(idx);
                      setFleetPaused(true);
                    }}
                    className={`relative overflow-hidden rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "border-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="fleet-pill-bg"
                        transition={FLEET_SPRING}
                        className="absolute inset-0 rounded-full bg-neutral-950"
                      />
                    ) : null}
                    <span className="relative z-10 inline-flex items-center gap-2.5">
                      <span className="font-mono text-[11px] opacity-55">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span>{car.name}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,24rem)] lg:gap-7 xl:grid-cols-[minmax(0,1.22fr)_minmax(20rem,26rem)]">
              <div className="relative overflow-hidden rounded-[1.45rem] border border-neutral-200 bg-neutral-100 shadow-[0_18px_44px_-34px_rgba(10,10,10,0.3)]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeCar?.id}
                    initial={
                      shouldReduceMotion
                        ? false
                        : {
                            opacity: 0,
                            scale: 1.025,
                            clipPath: "inset(0 0 10% 0 round 1.45rem)",
                          }
                    }
                    animate={{
                      opacity: 1,
                      scale: 1,
                      clipPath: "inset(0 0 0% 0 round 1.45rem)",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 1.01,
                      clipPath: "inset(0 0 8% 0 round 1.45rem)",
                    }}
                    transition={FLEET_TRANSITION}
                    className="absolute inset-0 h-full w-full"
                  >
                    {activeCar?.primaryImageUrl ? (
                      <Image
                        alt={activeCar.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1280px) 46vw, 92vw"
                        src={activeCar.primaryImageUrl}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-neutral-50 text-neutral-400">
                        Image not available
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="relative aspect-[1.72/1] w-full" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-950">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1E41FC]" />
                  {formatCategory(activeCar?.category)}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeCar?.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.56, ease: EASE }}
                  className="space-y-[1.125rem]"
                >
                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      {formatCategory(activeCar?.category)} Class
                    </span>
                    <h3 className="mt-1 font-display text-[clamp(1.85rem,1.9vw,2.45rem)] font-light leading-[1.02] tracking-[-0.03em] text-neutral-950">
                      {activeCar?.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                    <div className="flex items-baseline">
                      <span className="font-display text-[clamp(2.35rem,2.7vw,3.2rem)] font-light leading-none text-neutral-950">
                        {formatEurCents(activeCar?.pricePerDayEurCents ?? 0)}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500">/day</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1E41FC]" />
                      {formatMadFromEurCents(activeCar?.pricePerDayEurCents ?? 0)} /day
                    </div>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 border-t border-neutral-200 pt-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                        Transmission
                      </dt>
                      <dd className="mt-1 text-base font-medium leading-none text-neutral-950">
                        {formatTransmission(activeCar?.transmission)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                        Seats
                      </dt>
                      <dd className="mt-1 text-base font-medium leading-none text-neutral-950">
                        {activeCar?.seats ?? "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                        Luggage
                      </dt>
                      <dd className="mt-1 text-base font-medium leading-none text-neutral-950">
                        {activeCar?.luggageCount ?? "N/A"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row">
                    <Link
                      href={`/book/${activeCar?.id}`}
                      className="nx-btn-primary inline-flex items-center justify-center gap-2 rounded-full bg-[#0A0A0A] px-6 py-3.5 text-[0.95rem] font-medium text-white transition-all duration-300 hover:bg-[#1E41FC] active:scale-[0.96]"
                    >
                      Reserve this vehicle
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/catalog/${activeCar?.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-3.5 text-[0.95rem] font-medium text-neutral-900 transition-all duration-300 hover:border-neutral-900 hover:bg-neutral-50 active:scale-[0.96]"
                    >
                      Full details
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-neutral-100 bg-neutral-50 py-16 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6">
            <Car className="mx-auto h-8 w-8 stroke-1 text-neutral-400" />
            <h3 className="mt-3 text-lg font-semibold text-neutral-900">
              Preview fleet offline
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              Our preview fleet is currently offline. Please explore the main
              catalog to find and reserve available vehicles.
            </p>
            <Link
              href="/catalog"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1E41FC] hover:underline"
            >
              Go to catalog <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      <section id="how-it-works" className="relative border-b border-neutral-100 bg-white">
        <div className="nx-container nx-section">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <span className="nx-eyebrow font-medium text-neutral-500">
                How it works
              </span>
              <h2 className="nx-h2 mt-3 font-display font-light leading-none tracking-tight text-neutral-900">
                Three steps.
                <br />
                <span className="italic text-neutral-400">Zero friction.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="nx-lead max-w-sm font-light text-neutral-600">
                Designed for premium travelers who measure timing in flights,
                not queues.
              </p>
            </Reveal>
          </div>

          <div
            className="grid grid-cols-1 gap-0 border-y border-neutral-200 md:grid-cols-3"
            onMouseEnter={() => pauseHowItWorks()}
            onMouseLeave={resumeHowItWorks}
          >
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const isActive = idx === activeHowStep;

              return (
                <motion.button
                  key={step.n}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.55, ease: EASE }}
                  onClick={() => {
                    setActiveHowStep(idx);
                    pauseHowItWorks(6400);
                  }}
                  onFocus={() => pauseHowItWorks()}
                  onBlur={resumeHowItWorks}
                  aria-pressed={isActive}
                  className={`group relative px-6 py-10 text-left transition-colors duration-300 hover:bg-neutral-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#1E41FC] md:px-8 md:py-12 ${
                    idx !== 2 ? "border-b border-neutral-200 md:border-b-0 md:border-r" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-6 top-0 h-px transition-all duration-500 md:inset-x-8 ${
                      isActive ? "bg-[#1E41FC]" : "bg-transparent"
                    }`}
                  />
                  <div className="flex items-baseline gap-4">
                    <span className={`font-display text-5xl font-light transition-colors duration-500 md:text-6xl ${
                      isActive ? "text-[#1E41FC]" : "text-neutral-300 group-hover:text-[#1E41FC]"
                    }`}>
                      {step.n}
                    </span>
                    <span className={`h-px transition-all duration-500 ${
                      isActive
                        ? "w-14 bg-[#1E41FC]"
                        : "w-8 bg-neutral-300 group-hover:w-14 group-hover:bg-[#1E41FC]"
                    }`} />
                  </div>
                  <h3 className={`mt-5 font-display text-xl font-medium text-neutral-950 transition-transform duration-300 ${
                    isActive ? "translate-x-1" : ""
                  }`}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {step.copy}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="airport" className="relative border-b border-neutral-100 bg-white">
        <div className="nx-container nx-section">
          <Reveal>
            <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-neutral-50/80 p-8 md:p-10">
              <span className="nx-eyebrow font-medium text-neutral-500">
                Future marketing section
              </span>
              <h2 className="nx-h2 mt-3 font-display font-light leading-none tracking-tight text-neutral-900">
                Arrival story,
                <br />
                <span className="italic text-neutral-400">reserved for redesign.</span>
              </h2>
              <p className="nx-lead mt-4 max-w-3xl font-light text-neutral-600">
                We are intentionally holding this section back for a later pass.
                The next version should explain airport pickup, document readiness,
                and handoff flow clearly, without implying live flight tracking,
                operator ratings, or real-time status that this product does not
                currently expose in the public UI.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-neutral-500">
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
                  Exact vehicle selection
                </span>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
                  Document readiness before arrival
                </span>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
                  Airport handoff without counter friction
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="overflow-hidden bg-neutral-950 py-20 text-white">
        <div className="nx-container">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5">
              <span className="nx-eyebrow text-xs font-medium tracking-widest text-neutral-400">
                Customer Reviews
              </span>
              <h2 className="font-display text-4xl font-light leading-none tracking-tight md:text-5xl">
                Calm pickup,
                <br />
                <span className="italic text-neutral-400">clearer handoff.</span>
              </h2>
              <p className="text-base font-light leading-relaxed text-neutral-400">
                Illustrative demo feedback for the current service direction:
                document readiness before arrival, exact vehicle selection, and
                a smoother airport pickup flow.
              </p>
            </div>

            <div
              className="space-y-5"
              onMouseEnter={() => pauseReviews()}
              onMouseLeave={resumeReviews}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeReviewGroup}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, filter: "blur(6px)" }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  {visibleReviews.map((review) => (
                    <article
                      key={review.name + review.quote}
                      className="flex h-full flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                    >
                      <blockquote className="text-sm italic leading-relaxed text-neutral-200">
                        <p>&ldquo;{review.quote}&rdquo;</p>
                      </blockquote>
                      <footer className="mt-5 border-t border-neutral-800 pt-4">
                        <cite className="not-italic">
                          <span className="block text-sm font-semibold text-white">
                            {review.name}
                          </span>
                          <span className="block text-xs text-neutral-500">
                            {review.context}
                          </span>
                        </cite>
                      </footer>
                    </article>
                  ))}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-neutral-500">
                  Demo content. These reviews illustrate likely feedback themes,
                  not production-verified testimonials.
                </p>
                <div className="flex items-center gap-2">
                  {reviewGroups.map((_, index) => {
                    const isActive = index === activeReviewGroup;

                    return (
                      <button
                        key={`reviews-${index}`}
                        type="button"
                        aria-label={`Show review pair ${index + 1}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          setActiveReviewGroup(index);
                          pauseReviews(9000);
                        }}
                        onFocus={() => pauseReviews()}
                        onBlur={resumeReviews}
                        className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                          isActive ? "w-8 bg-white" : "w-2.5 bg-neutral-600 hover:bg-neutral-400"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative border-b border-neutral-100 bg-white">
        <div className="nx-container-narrow nx-section">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <Reveal>
                <span className="nx-eyebrow font-medium text-neutral-500">
                  FAQ
                </span>
                <h2 className="nx-h2 mt-3 font-display font-light leading-none tracking-tight text-neutral-900">
                  Questions,
                  <br />
                  <span className="italic text-neutral-400">answered.</span>
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-neutral-500">
                  The answers below stay close to the current product behavior.
                  They avoid claims about unsupported live flight tracking or
                  hidden airport automations.
                </p>
              </Reveal>
            </div>

            <Acc type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((faq, idx) => (
                <AccItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border-b border-neutral-200"
                >
                  <AccTrigger className="py-6 text-left font-display text-lg font-medium text-neutral-900 transition-colors hover:text-[#1E41FC] hover:no-underline focus-visible:ring-2 focus-visible:ring-[#1E41FC] focus-visible:ring-offset-4">
                    {faq.q}
                  </AccTrigger>
                  <AccContent className="pb-6 text-sm font-light leading-relaxed text-neutral-600">
                    {faq.a}
                  </AccContent>
                </AccItem>
              ))}
            </Acc>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-100 bg-neutral-50 py-16">
        <div className="nx-container flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-1.5">
            <h3 className="font-display text-2xl font-light text-neutral-950">
              Your arrival can already be ready.
            </h3>
            <p className="text-sm text-neutral-600">
              Choose your exact vehicle, complete verification before takeoff,
              and meet your operator at CMN.
            </p>
          </div>
          <Link
            href="/catalog"
            className="nx-btn-primary inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC]"
          >
            Browse the live fleet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
