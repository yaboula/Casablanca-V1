import { useMemo } from "react";
import type { Vehicle } from "@/types";
import type { SortMode } from "@/components/vehicles/FilterBar";

export interface ActiveFilters {
  category: string;    // "ALL" | VehicleCategory
  sort: SortMode;
}

export function useVehicleFilters(
  vehicles: Vehicle[],
  filters: ActiveFilters
): Vehicle[] {
  return useMemo(() => {
    let result = vehicles;

    // Category filter
    if (filters.category !== "ALL") {
      result = result.filter((v) => v.category === filters.category);
    }

    // Only available
    result = result.filter((v) => v.isAvailable);

    // Sort
    if (filters.sort === "price_asc") {
      result = [...result].sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (filters.sort === "price_desc") {
      result = [...result].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }

    return result;
  }, [vehicles, filters.category, filters.sort]);
}
