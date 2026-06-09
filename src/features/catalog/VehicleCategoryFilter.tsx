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
    "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-bold transition-colors",
    isActive
      ? "border-neutral-950 bg-neutral-950 text-white"
      : "border-[var(--nx-line)] bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950",
  ].join(" ");
}
