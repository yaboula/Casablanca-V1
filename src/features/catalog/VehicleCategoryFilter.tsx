import Link from "next/link";
import { formatCategory } from "./format-price";
import type { VehicleCategory } from "./types";
import { VEHICLE_CATEGORIES } from "./types";

export function VehicleCategoryFilter({
  activeCategory,
}: {
  activeCategory: VehicleCategory | null;
}) {
  return (
    <nav aria-label="Filtrer le catalogue par categorie">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            aria-current={activeCategory === null ? "page" : undefined}
            className={filterClassName(activeCategory === null)}
            href="/catalog"
          >
            All vehicles
          </Link>
        </li>
        {VEHICLE_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              aria-current={activeCategory === category ? "page" : undefined}
              className={filterClassName(activeCategory === category)}
              href={`/catalog?category=${category}`}
            >
              {formatCategory(category)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function filterClassName(isActive: boolean): string {
  return [
    "inline-flex h-10 items-center justify-center rounded-full border px-5 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
    isActive
      ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
  ].join(" ");
}
