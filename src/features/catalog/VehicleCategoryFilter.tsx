import Link from "next/link";
import { formatCategory } from "./format-price";
import type { VehicleCategory } from "./types";
import { VEHICLE_CATEGORIES } from "./types";

export function VehicleCategoryFilter({
  activeCategory,
  categoryCounts,
}: {
  activeCategory: VehicleCategory | null;
  categoryCounts: Record<VehicleCategory | "ALL", number>;
}) {
  return (
    <nav aria-label="Filter catalog by vehicle category">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            aria-current={activeCategory === null ? "page" : undefined}
            className={filterClassName(activeCategory === null)}
            href="/catalog"
          >
            <span>All vehicles</span>
            <span className={countClassName(activeCategory === null)}>
              {categoryCounts.ALL}
            </span>
          </Link>
        </li>
        {VEHICLE_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              aria-current={activeCategory === category ? "page" : undefined}
              className={filterClassName(activeCategory === category)}
              href={`/catalog?category=${category}`}
            >
              <span>{formatCategory(category)}</span>
              <span className={countClassName(activeCategory === category)}>
                {categoryCounts[category]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function filterClassName(isActive: boolean): string {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)] active:scale-[0.98]",
    isActive
      ? "border-neutral-950 bg-neutral-950 text-white shadow-sm ring-2 ring-neutral-950/10"
      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
  ].join(" ");
}

function countClassName(isActive: boolean): string {
  return [
    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
    isActive ? "bg-white text-neutral-950" : "bg-neutral-100 text-neutral-500",
  ].join(" ");
}
