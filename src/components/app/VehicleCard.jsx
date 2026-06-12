import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import StatusBadge from "@/components/app/StatusBadge";

export const VehicleCard = ({ vehicle, index = 0 }) => {
    const unavailable = !vehicle.available;
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <Link
                to={`/vehicle/${vehicle.id}`}
                data-testid={`vehicle-card-${vehicle.id}`}
                className="group block bg-white border border-neutral-200 rounded-[1.25rem] overflow-hidden transition-colors duration-300 hover:border-neutral-400"
            >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                    <img
                        src={vehicle.images[0]}
                        alt={vehicle.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-neutral-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
                        <span className="text-[0.7rem] uppercase tracking-[0.16em] font-semibold text-neutral-900">
                            {vehicle.categoryLabel}
                        </span>
                    </div>
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1 bg-white rounded-full px-2.5 py-1.5 border border-neutral-200">
                        <Star className="w-3.5 h-3.5 text-[#1E41FC] fill-[#1E41FC]" />
                        <span className="text-[0.78rem] font-semibold text-neutral-900">
                            {vehicle.rating}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-display text-[1.35rem] font-semibold text-neutral-900 leading-tight">
                                {vehicle.name}
                            </h3>
                            <p className="nx-meta text-neutral-500 mt-1.5 line-clamp-1">
                                {vehicle.tagline}
                            </p>
                        </div>
                        <StatusBadge
                            status={unavailable ? "unavailable" : "available"}
                            label={unavailable ? `In ${vehicle.availableFrom || "soon"}` : "Available"}
                            size="sm"
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-y border-neutral-100 py-4">
                        {vehicle.headlineSpecs.map((s) => (
                            <div key={s.label}>
                                <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-neutral-400">
                                    {s.label}
                                </div>
                                <div className="font-display text-[1.05rem] font-medium text-neutral-900 mt-1">
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="font-display text-[1.9rem] font-light tracking-tight text-neutral-900 leading-none">
                                    {formatCurrency(vehicle.pricePerDay)}
                                </span>
                                <span className="nx-meta text-neutral-500">/day</span>
                            </div>
                            <div className="nx-meta text-neutral-400 mt-1.5">
                                Deposit {formatCurrency(vehicle.deposit)}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.9rem] font-medium transition-colors duration-300",
                                "bg-[#0A0A0A] text-white group-hover:bg-[#1E41FC]"
                            )}
                        >
                            Reserve
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default VehicleCard;
