import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Car } from "lucide-react";
import { useStore } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import SearchBar from "@/components/app/SearchBar";
import VehicleCard from "@/components/app/VehicleCard";
import EmptyState from "@/components/app/EmptyState";
import { GridSkeleton } from "@/components/app/LoadingState";
import { cn } from "@/lib/utils";

const SORTS = [
    { id: "recommended", label: "Recommended" },
    { id: "price_low", label: "Price: low to high" },
    { id: "price_high", label: "Price: high to low" },
];

export default function VehicleCatalog() {
    const { vehicles, categories, search, setSearch } = useStore();
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("recommended");
    const category = search.category || "all";

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 550);
        return () => clearTimeout(t);
    }, [category, sort]);

    const results = useMemo(() => {
        let list = vehicles.filter(
            (v) => category === "all" || v.category === category
        );
        if (sort === "price_low") list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
        if (sort === "price_high") list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
        return list;
    }, [vehicles, category, sort]);

    return (
        <AppShell>
            {/* Page header */}
            <div className="flex flex-col gap-2">
                <span className="nx-eyebrow text-neutral-500 font-medium">
                    Casablanca Mohammed V · the fleet
                </span>
                <h1 className="nx-h2 font-display font-light text-neutral-900">
                    Choose your vehicle
                </h1>
                <p className="nx-lead text-neutral-600 max-w-2xl mt-1">
                    Every car is locked to its exact make, model and trim — never a
                    category, never a substitute.
                </p>
            </div>

            {/* Search summary */}
            <div className="mt-7">
                <SearchBar />
            </div>

            {/* Toolbar */}
            <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-center gap-2 flex-wrap">
                    {categories.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => {
                                setSearch({ category: c.id });
                                setLoading(true);
                            }}
                            data-testid={`category-${c.id}`}
                            className={cn(
                                "px-4 py-2 rounded-full text-[0.9rem] font-medium border transition-colors duration-300",
                                category === c.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            )}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <span className="nx-meta text-neutral-500">
                        {results.length} {results.length === 1 ? "vehicle" : "vehicles"}
                    </span>
                    <div className="flex items-center gap-2 text-neutral-500">
                        <SlidersHorizontal className="w-4 h-4" />
                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                setLoading(true);
                            }}
                            data-testid="sort-select"
                            className="bg-white border border-neutral-200 rounded-full px-4 py-2 text-[0.9rem] font-medium text-neutral-900 outline-none focus:border-[#1E41FC] cursor-pointer"
                        >
                            {SORTS.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="mt-8">
                {loading ? (
                    <GridSkeleton count={6} />
                ) : results.length === 0 ? (
                    <EmptyState
                        icon={Car}
                        title="No vehicles in this category"
                        description="Try a different category or clear your filters to see the full fleet."
                        actionLabel="Show all vehicles"
                        onAction={() => setSearch({ category: "all" })}
                    />
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        {results.map((v, i) => (
                            <VehicleCard key={v.id} vehicle={v} index={i} />
                        ))}
                    </motion.div>
                )}
            </div>
        </AppShell>
    );
}
