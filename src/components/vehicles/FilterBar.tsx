"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/mock-data";

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

export default function FilterBar({
  activeCategory,
  sortMode,
  resultCount,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="w-full">
      {/* Pills row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none
                      [-ms-overflow-style:none] [scrollbar-width:none]
                      [&::-webkit-scrollbar]:hidden">
        {/* Category pills */}
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`relative min-h-[40px] px-4 rounded-full text-sm font-semibold whitespace-nowrap
                         transition-colors duration-200
                         ${active ? "text-white" : "text-brand-dark hover:bg-slate-100"}`}
            >
              {active && (
                <motion.span
                  layoutId="active-filter"
                  className="absolute inset-0 bg-brand-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                />
              )}
              <span className="relative z-10">{CATEGORY_LABELS[cat]}</span>
            </button>
          );
        })}

        {/* Separator */}
        <span className="w-px h-6 bg-slate-200 flex-shrink-0 mx-1" />

        {/* Sort pills */}
        <button
          type="button"
          onClick={() => onSortChange(sortMode === "price_asc" ? "default" : "price_asc")}
          className={`flex items-center gap-1.5 min-h-[40px] px-4 rounded-full text-sm font-semibold
                     whitespace-nowrap transition-colors duration-200
                     ${sortMode === "price_asc"
                       ? "bg-slate-900 text-white"
                       : "text-brand-dark hover:bg-slate-100 border border-slate-200"}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Precio ↑
        </button>

        <button
          type="button"
          onClick={() => onSortChange(sortMode === "price_desc" ? "default" : "price_desc")}
          className={`flex items-center gap-1.5 min-h-[40px] px-4 rounded-full text-sm font-semibold
                     whitespace-nowrap transition-colors duration-200
                     ${sortMode === "price_desc"
                       ? "bg-slate-900 text-white"
                       : "text-brand-dark hover:bg-slate-100 border border-slate-200"}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Precio ↓
        </button>
      </div>

      {/* Result count */}
      <p className="text-sm text-brand-muted mt-3">
        <span className="font-bold text-brand-dark">{resultCount}</span>{" "}
        {resultCount === 1 ? "coche disponible" : "coches disponibles"} para tus fechas
      </p>
    </div>
  );
}
