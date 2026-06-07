"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Car } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FilterBar, { type SortMode } from "@/components/vehicles/FilterBar";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { useVehicleFilters } from "@/hooks/useVehicleFilters";
import { useBookingStore } from "@/stores/useBookingStore";
import type { Vehicle } from "@/types";
import { useTranslations } from "@/lib/i18n";

interface Props {
  vehicles: Vehicle[];
  pickupDate?: string | null;
  returnDate?: string | null;
}

export default function CatalogGrid({ vehicles, pickupDate: pickupProp, returnDate: returnProp }: Props) {
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("default");
  const store = useBookingStore();
  const tCatalog = useTranslations("catalog");

  // Prefer server-supplied dates (from URL searchParams), fall back to store
  const pickupDate = pickupProp ?? store.pickupDate ?? null;
  const returnDate = returnProp ?? store.returnDate ?? null;

  const filtered = useVehicleFilters(vehicles, { category, sort });
  const hasDates = pickupDate && returnDate;

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100 py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <FilterBar
            activeCategory={category}
            sortMode={sort}
            resultCount={filtered.length}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />
        </div>
      </div>

      {/* Dates availability banner */}
      {hasDates && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
            <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
            <p className="text-[0.9rem] text-neutral-700">
              {tCatalog.availabilityFrom}{" "}
              <strong className="text-neutral-900 font-semibold">
                {format(new Date(pickupDate as string), "d MMM", { locale: es })}
              </strong>
              {" "}{tCatalog.availabilityTo}{" "}
              <strong className="text-neutral-900 font-semibold">
                {format(new Date(returnDate as string), "d MMM yyyy", { locale: es })}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Vehicle grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              layout
              key={`${category}-${sort}`}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm border border-neutral-100">
                <Car className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="nx-h2 text-xl font-display font-medium text-neutral-900 mb-2">
                {tCatalog.noResults}
              </h3>
              <p className="nx-meta text-neutral-500 max-w-xs mb-6">
                {tCatalog.noResultsDesc}
              </p>
              <button
                type="button"
                onClick={() => setCategory("ALL")}
                className="px-6 py-2.5 bg-neutral-900 text-white text-[0.9rem] font-medium rounded-full
                           hover:bg-neutral-800 transition-colors duration-300"
              >
                {tCatalog.viewAll}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
