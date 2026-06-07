"use client";

import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────

export type SortMode = "default" | "price_asc" | "price_desc";

interface FilterBarProps {
  activeCategory: string;
  sortMode: SortMode;
  resultCount: number;
  onCategoryChange: (c: string) => void;
  onSortChange: (s: SortMode) => void;
}

// ── Component ─────────────────────────────────────────────────

// Maps API category keys to translation namespace keys
const CAT_KEY_MAP: Record<string, keyof ReturnType<typeof useTranslations<"catalog">>["filters"]> = {
  ALL: "all",
  SEDAN: "sedan",
  SUV: "suv",
  LUXURY: "luxury",
  COMPACT: "compact",
};

export default function FilterBar({
  activeCategory,
  sortMode,
  resultCount,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  const tCatalog = useTranslations("catalog");

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none
                      [-ms-overflow-style:none] [scrollbar-width:none]
                      [&::-webkit-scrollbar]:hidden flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          const label = tCatalog.filters[CAT_KEY_MAP[cat]];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[0.9rem] font-medium border transition-colors duration-300",
                active
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results & Sort */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="nx-meta text-neutral-500">
          {resultCount} {resultCount === 1 ? tCatalog.carAvailable : tCatalog.carsAvailable}
        </span>
        <div className="flex items-center gap-2 text-neutral-500">
          <SlidersHorizontal className="w-4 h-4" />
          <select
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
            className="bg-white border border-neutral-200 rounded-full px-4 py-2 text-[0.9rem] font-medium text-neutral-900 outline-none focus:border-[#1E41FC] cursor-pointer"
          >
            <option value="default">{tCatalog.filters.all}</option>
            <option value="price_asc">{tCatalog.sortPriceAsc}</option>
            <option value="price_desc">{tCatalog.sortPriceDesc}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
