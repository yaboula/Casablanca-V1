import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Plane, KeyRound, Star, CalendarDays, Pencil } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore } from "@/context/AppStore";
import { getVehicle, INCLUDED_BENEFITS } from "@/data/vehicles";
import { LOCATIONS } from "@/data/locations";
import AppShell from "@/components/app/AppShell";
import VehicleSpecs from "@/components/app/VehicleSpecs";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";
import { formatCurrency, formatDate } from "@/lib/format";

const TERMS = [
    {
        q: "Is this the exact model I will receive?",
        a: "Yes. Nexus never substitutes. The make, model, year and trim shown here is exactly what waits for you at arrivals.",
    },
    {
        q: "What is included in the price?",
        a: "Premium insurance, theft protection, 24/7 roadside assistance, unlimited mileage within Morocco, and the airport meet-and-greet handover.",
    },
    {
        q: "How does the deposit work?",
        a: "A refundable hold is placed on your card at pickup and released after the vehicle is returned in its original condition.",
    },
];

export default function VehicleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { search } = useStore();
    const vehicle = getVehicle(id);
    const [active, setActive] = useState(0);

    if (!vehicle) {
        return (
            <AppShell>
                <ErrorState
                    title="Vehicle not found"
                    description="This vehicle is no longer listed. Browse the full fleet to find your car."
                    actionLabel="Back to catalog"
                    actionTo="/catalog"
                />
            </AppShell>
        );
    }

    const proceed = () => navigate(`/booking/${vehicle.id}`);
    const loc = LOCATIONS.find((l) => l.code === search.locationCode) || LOCATIONS[0];
    const tripDates =
        search.pickupDate && search.returnDate
            ? `${formatDate(search.pickupDate, "MMM d")} → ${formatDate(search.returnDate, "MMM d")}`
            : "Dates at booking";

    return (
        <AppShell>
            {/* Breadcrumb */}
            <div className="nx-meta text-neutral-400 mb-6">
                <span className="hover:text-neutral-700 cursor-pointer" onClick={() => navigate("/catalog")}>
                    Fleet
                </span>
                <span className="mx-2">/</span>
                <span className="text-neutral-700">{vehicle.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-12 items-start">
                {/* LEFT */}
                <div>
                    {/* Gallery */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-[1.5rem] overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[16/10]"
                    >
                        <img
                            src={vehicle.images[active]}
                            alt={vehicle.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-5 left-5 inline-flex items-center gap-2 bg-white rounded-full px-3.5 py-2 border border-neutral-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
                            <span className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-neutral-900">
                                {vehicle.categoryLabel}
                            </span>
                        </div>
                    </motion.div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {vehicle.images.map((img, i) => (
                            <button
                                key={img}
                                onClick={() => setActive(i)}
                                className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-colors ${
                                    i === active ? "border-[#1E41FC]" : "border-transparent hover:border-neutral-300"
                                }`}
                            >
                                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    {/* Title */}
                    <div className="mt-9">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 nx-meta text-neutral-700">
                                <Star className="w-4 h-4 text-[#1E41FC] fill-[#1E41FC]" />
                                {vehicle.rating} rating
                            </span>
                            <span className="w-px h-4 bg-neutral-200" />
                            <StatusBadge status={vehicle.available ? "available" : "unavailable"} size="sm" />
                        </div>
                        <h1 className="nx-h2 font-display font-light text-neutral-900 mt-4">
                            {vehicle.name}
                        </h1>
                        <p className="nx-lead text-neutral-600 mt-3 max-w-2xl">{vehicle.tagline}</p>
                    </div>

                    {/* Specs */}
                    <div className="mt-9 pt-8 border-t border-neutral-200">
                        <h2 className="nx-label text-neutral-400 mb-6">Specifications</h2>
                        <VehicleSpecs specs={vehicle.specs} />
                    </div>

                    {/* Exact model promise */}
                    <div className="mt-9 rounded-[1.25rem] bg-neutral-900 text-white p-7">
                        <div className="flex items-start gap-4">
                            <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <KeyRound className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="nx-h4 font-display font-semibold">The exact car. Never a category.</h3>
                                <p className="nx-body text-neutral-300 mt-2 max-w-xl">
                                    You are reserving this precise vehicle — not a ‘similar’
                                    class. It is the one prepared and handed to you at the
                                    airport.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Included benefits */}
                    <div className="mt-9 pt-8 border-t border-neutral-200">
                        <h2 className="nx-label text-neutral-400 mb-5">Included with every reservation</h2>
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {INCLUDED_BENEFITS.map((b) => (
                                <li key={b} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="nx-body text-neutral-700">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Terms / FAQ */}
                    <div className="mt-9 pt-8 border-t border-neutral-200">
                        <h2 className="nx-label text-neutral-400 mb-3">Good to know</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {TERMS.map((t, i) => (
                                <AccordionItem key={i} value={`t-${i}`} className="border-b border-neutral-200">
                                    <AccordionTrigger className="text-left font-display text-[1.1rem] font-medium text-neutral-900 py-6 hover:no-underline hover:text-[#1E41FC]">
                                        {t.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="nx-body text-neutral-600 pb-6">
                                        {t.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>

                {/* RIGHT — booking panel */}
                <div className="lg:sticky lg:top-24">
                    <div className="bg-white border border-neutral-200 rounded-[1.5rem] p-6 md:p-7">
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-display text-[2.4rem] font-light tracking-tight text-neutral-900 leading-none">
                                        {formatCurrency(vehicle.pricePerDay)}
                                    </span>
                                    <span className="nx-meta text-neutral-500">/day</span>
                                </div>
                                <div className="nx-meta text-neutral-400 mt-2">
                                    Refundable deposit {formatCurrency(vehicle.deposit)}
                                </div>
                            </div>
                            <StatusBadge status="available" label="Available" size="sm" />
                        </div>

                        <div className="mt-6 space-y-3 border-t border-neutral-100 pt-6">
                            <div className="flex items-center justify-between">
                                <span className="nx-label text-neutral-400">Your trip</span>
                                <button
                                    onClick={() => navigate("/catalog")}
                                    className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1E41FC] hover:opacity-80 transition-opacity"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                            </div>
                            <PanelRow icon={Plane} label="Pickup" value={`${loc.primary} (${loc.code})`} sub={loc.secondary} />
                            <PanelRow icon={CalendarDays} label="Dates" value={tripDates} />
                            <PanelRow icon={ShieldCheck} label="Cover" value="Insurance & roadside included" />
                            <PanelRow icon={KeyRound} label="Handover" value="At arrivals, under 10 minutes" />
                        </div>

                        <div className="mt-7">
                            <PremiumButton full size="lg" variant="dark" iconRight={ArrowRight} onClick={proceed} data-testid="detail-reserve">
                                Reserve this vehicle
                            </PremiumButton>
                            <p className="nx-meta text-neutral-400 text-center mt-3">
                                Free cancellation up to 24h before pickup
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky CTA */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                    <div className="font-display text-[1.4rem] font-light text-neutral-900 leading-none">
                        {formatCurrency(vehicle.pricePerDay)}<span className="nx-meta text-neutral-500"> /day</span>
                    </div>
                </div>
                <PremiumButton variant="dark" iconRight={ArrowRight} onClick={proceed}>
                    Reserve
                </PremiumButton>
            </div>
            <div className="lg:hidden h-16" />
        </AppShell>
    );
}

const PanelRow = ({ icon: Icon, label, value, sub }) => (
    <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#1E41FC] shrink-0">
            <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
            <div className="nx-label text-neutral-400">{label}</div>
            <div className="text-[0.92rem] font-medium text-neutral-900 truncate">{value}</div>
            {sub && <div className="nx-meta text-neutral-500 truncate">{sub}</div>}
        </div>
    </div>
);
