"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { VehicleCard } from "./VehicleCard";
import type { VehicleCardModel } from "./types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(2px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function VehicleGrid({ vehicles }: { vehicles: VehicleCardModel[] }) {
  const shouldReduceMotion = useReducedMotion();
  const shouldShowEditorialCard = vehicles.length % 3 === 2;
  const listVariants = shouldReduceMotion ? undefined : containerVariants;
  const cardVariants = shouldReduceMotion ? undefined : itemVariants;

  return (
    <motion.ul
      variants={listVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate={shouldReduceMotion ? undefined : "show"}
      className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
    >
      {vehicles.map((vehicle) => (
        <motion.li key={vehicle.id} variants={cardVariants}>
          <VehicleCard vehicle={vehicle} />
        </motion.li>
      ))}
      {shouldShowEditorialCard && (
        <motion.li variants={cardVariants}>
          <FleetRequestCard />
        </motion.li>
      )}
    </motion.ul>
  );
}

function FleetRequestCard() {
  return (
    <article className="flex h-full min-h-[28rem] flex-col justify-between rounded-[1.25rem] border border-dashed border-neutral-300 bg-[#FAFAFA] p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Airport fleet desk
        </p>
        <h3 className="mt-4 font-display text-2xl font-light leading-tight text-neutral-950">
          Need a different fit for your arrival?
        </h3>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Start with the live fleet, then tell the team what matters most:
          luggage, automatic drive, family comfort, or executive pickup.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-2 text-xs text-neutral-600">
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
            Exact vehicle selection
          </span>
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
            EUR + MAD daily rate
          </span>
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-2">
            CMN pickup context
          </span>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
          href="/catalog"
        >
          View all vehicles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
