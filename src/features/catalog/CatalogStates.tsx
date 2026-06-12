import Link from "next/link";
import { formatCategory } from "./format-price";
import type { VehicleCategory } from "./types";

export function CatalogEmptyState({
  activeCategory,
}: {
  activeCategory?: VehicleCategory | null;
}) {
  const title = activeCategory
    ? `No ${formatCategory(activeCategory).toLowerCase()} vehicles available right now.`
    : "No vehicles available right now.";
  const body = activeCategory
    ? "Try all vehicles or check again after new reservations are released."
    : "The live CMN fleet is temporarily empty. Please try again shortly or contact us if you need immediate assistance.";

  return (
    <div
      aria-live="polite"
      className="rounded-[1.25rem] border border-dashed border-neutral-300 bg-[#FAFAFA] p-8 text-center"
      role="status"
    >
      <h2 className="text-xl font-black text-neutral-950">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
        {body}
      </p>
      {activeCategory && (
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--nx-accent)]"
          href="/catalog"
        >
          View all vehicles
        </Link>
      )}
    </div>
  );
}

export function CatalogErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[1.25rem] border border-neutral-200 bg-white p-8 shadow-sm"
      role="alert"
    >
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Catalog unavailable
      </p>
      <h2 className="mt-3 text-2xl font-black text-neutral-950">
        Fleet could not be loaded.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        {message} Please try again in a moment.
      </p>
    </div>
  );
}

export function VehicleNotFoundState() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Not found
      </p>
      <h1 className="mt-4 text-3xl font-black text-neutral-950">
        Vehicle not found.
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        This vehicle is no longer listed in the public fleet, or the link may
        be incorrect. Browse the full catalog to find another vehicle.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
        href="/catalog"
      >
        Browse the fleet
      </Link>
    </section>
  );
}
