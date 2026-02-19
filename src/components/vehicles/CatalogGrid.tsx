"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FilterBar, { type SortMode } from "@/components/vehicles/FilterBar";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { useVehicleFilters } from "@/hooks/useVehicleFilters";
import { MOCK_VEHICLES } from "@/lib/mock-data";

export default function CatalogGrid() {
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("default");

  const filtered = useVehicleFilters(MOCK_VEHICLES, { category, sort });

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

      {/* Vehicle grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
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
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-1">
                Sin resultados
              </h3>
              <p className="text-sm text-brand-muted max-w-xs">
                No hay coches disponibles para esta categoría. Prueba con otro filtro.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
