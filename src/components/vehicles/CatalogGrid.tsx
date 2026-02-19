"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FilterBar, { type SortMode } from "@/components/vehicles/FilterBar";
import VehicleCard from "@/components/vehicles/VehicleCard";
import VehicleCardSkeleton from "@/components/vehicles/VehicleCardSkeleton";
import { useVehicleFilters } from "@/hooks/useVehicleFilters";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { useBookingStore } from "@/stores/useBookingStore";

export default function CatalogGrid() {
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("default");
  const [loading, setLoading] = useState(true);
  const { pickupDate, returnDate } = useBookingStore();

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = useVehicleFilters(MOCK_VEHICLES, { category, sort });
  const hasDates = pickupDate && returnDate;

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-4 md:px-8">
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
          <div className="flex items-center gap-2.5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl px-4 py-3">
            <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
            <p className="text-sm text-brand-dark">
              Disponibilidad del{" "}
              <strong>
                {format(new Date(pickupDate!), "d MMM", { locale: es })}
              </strong>
              {" "}al{" "}
              <strong>
                {format(new Date(returnDate!), "d MMM yyyy", { locale: es })}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Vehicle grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </motion.div>
          ) : filtered.length > 0 ? (
            <motion.div
              key={`${category}-${sort}`}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
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
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
                <SlidersHorizontal className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">
                No hay coches disponibles
              </h3>
              <p className="text-sm text-brand-muted max-w-xs mb-6">
                No encontramos vehículos para estas fechas y filtros. Prueba cambiando la categoría.
              </p>
              <button
                type="button"
                onClick={() => setCategory("ALL")}
                className="min-h-[44px] px-6 bg-brand-primary text-white text-sm font-bold rounded-full
                           hover:bg-brand-primary/90 transition-colors"
              >
                Ver todos los coches
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
