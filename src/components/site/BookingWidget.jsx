import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Car,
    ArrowRight,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { WIDGET } from "@/constants/testIds";
import { motion } from "framer-motion";
import { useStore } from "@/context/AppStore";

const LOCATIONS = [
    { code: "CMN", primary: "Casablanca", secondary: "Mohammed V Intl. Airport" },
    { code: "Downtown", primary: "Casablanca", secondary: "Downtown · Anfa" },
    { code: "RBA", primary: "Rabat", secondary: "Salé Airport" },
    { code: "RAK", primary: "Marrakech", secondary: "Menara Airport" },
];

const CLASSES = [
    { id: "executive", label: "Executive", note: "Sedan · 4 seats" },
    { id: "suv", label: "SUV", note: "Premium · 5 seats" },
    { id: "sport", label: "Sport", note: "Performance · 2–4 seats" },
    { id: "electric", label: "Electric", note: "EV · 4–5 seats" },
];

export const BookingWidget = () => {
    const navigate = useNavigate();
    const { setSearch } = useStore();
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [pickup, setPickup] = useState();
    const [returnDate, setReturnDate] = useState();
    const [time, setTime] = useState("10:00");
    const [klass, setKlass] = useState(CLASSES[0]);

    const handleSubmit = () => {
        setSearch({
            locationCode: location.code,
            pickupDate: pickup ? pickup.toISOString() : null,
            pickupTime: time,
            returnDate: returnDate ? returnDate.toISOString() : null,
            category: klass.id,
        });
        toast("Searching available vehicles", {
            description: `${klass.label} · ${location.primary} · ${
                pickup ? format(pickup, "MMM d") : "today"
            } → ${returnDate ? format(returnDate, "MMM d") : "—"}`,
        });
        navigate("/catalog");
    };

    const triggerBase =
        "group w-full text-left px-6 lg:px-7 py-6 lg:py-7 hover:bg-neutral-50/50 transition-colors rounded-2xl md:rounded-none";
    const labelCls =
        "flex items-center gap-2 nx-label font-semibold text-neutral-500 mb-1";
    const valueCls =
        "mt-2 text-[1.35rem] lg:text-[1.45rem] font-display font-medium text-neutral-900 leading-none tracking-[-0.03em]";
    const subCls = "mt-1.5 nx-meta text-neutral-500";

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 1, ease: [0.32, 0.72, 0, 1] }}
            data-testid={WIDGET.root}
            className="relative p-1.5 md:p-2 bg-black/[0.02] backdrop-blur-3xl rounded-[28px] md:rounded-[2rem] ring-1 ring-black/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)]"
        >
            <div className="bg-white rounded-[calc(28px-6px)] md:rounded-[calc(2rem-8px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden">
                {/* Header strip */}
                <div className="flex items-center justify-between gap-3 px-6 lg:px-8 pt-6 pb-4 border-b border-neutral-100">
                    <div className="flex items-baseline gap-3">
                        <span className="text-[1.05rem] font-display font-semibold text-neutral-900 tracking-[-0.02em]">
                            Reserve your vehicle
                        </span>
                        <span className="hidden sm:inline nx-meta text-neutral-500">
                            Casablanca Mohammed V Airport
                        </span>
                    </div>
                <div className="flex items-center gap-2 nx-meta text-neutral-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live availability
                </div>
            </div>

            <div className="p-2 md:p-0 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.1fr_auto] md:divide-x md:divide-neutral-200">
                {/* Location */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button data-testid={WIDGET.fieldLocation} className={triggerBase}>
                            <div className={labelCls}>
                                <MapPin className="w-4 h-4 text-[#1E41FC]" strokeWidth={1.5} />
                                Pickup location
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-2">
                                <span className={valueCls}>{location.primary}</span>
                                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-neutral-500">
                                    {location.code}
                                </span>
                            </div>
                            <div className={`${subCls} truncate`}>{location.secondary}</div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        data-testid={WIDGET.locationPopover}
                        align="start"
                        sideOffset={12}
                        className="w-[340px] p-2 bg-white/90 backdrop-blur-2xl border border-white/40 ring-1 ring-black/5 rounded-[1.25rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]"
                    >
                        {LOCATIONS.map((loc) => (
                            <button
                                key={loc.code + loc.secondary}
                                onClick={() => setLocation(loc)}
                                className={`w-full text-left px-3.5 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${
                                    loc.code === location.code && loc.secondary === location.secondary
                                        ? "bg-neutral-100"
                                        : "hover:bg-neutral-50"
                                }`}
                            >
                                <span>
                                    <span className="font-medium text-neutral-900">{loc.primary}</span>
                                    <span className="block text-xs text-neutral-500 mt-0.5">{loc.secondary}</span>
                                </span>
                                <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">{loc.code}</span>
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>

                {/* Pickup date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button data-testid={WIDGET.fieldPickup} className={triggerBase}>
                            <div className={labelCls}>
                                <CalendarIcon className="w-4 h-4 text-[#1E41FC]" strokeWidth={1.5} />
                                Pickup
                            </div>
                            <div className={valueCls}>
                                {pickup ? format(pickup, "EEE, MMM d") : "Add date"}
                            </div>
                            <div className={subCls}>{pickup ? format(pickup, "yyyy") : "Choose a day"}</div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        data-testid={WIDGET.pickupCalendar}
                        align="start"
                        sideOffset={12}
                        className="p-0 bg-white/90 backdrop-blur-2xl border border-white/40 ring-1 ring-black/5 rounded-[1.25rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] overflow-hidden"
                    >
                        <Calendar mode="single" selected={pickup} onSelect={setPickup} initialFocus />
                    </PopoverContent>
                </Popover>

                {/* Return date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button data-testid={WIDGET.fieldReturn} className={triggerBase}>
                            <div className={labelCls}>
                                <Clock className="w-4 h-4 text-[#1E41FC]" strokeWidth={1.5} />
                                Return
                            </div>
                            <div className={valueCls}>
                                {returnDate ? format(returnDate, "EEE, MMM d") : "Add date"}
                            </div>
                            <div className={subCls}>{returnDate ? format(returnDate, "yyyy") : "Choose a day"}</div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        data-testid={WIDGET.returnCalendar}
                        align="start"
                        sideOffset={12}
                        className="p-0 bg-white/90 backdrop-blur-2xl border border-white/40 ring-1 ring-black/5 rounded-[1.25rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] overflow-hidden"
                    >
                        <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus />
                    </PopoverContent>
                </Popover>

                {/* Vehicle class */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button data-testid={WIDGET.fieldClass} className={triggerBase}>
                            <div className={labelCls}>
                                <Car className="w-4 h-4 text-[#1E41FC]" strokeWidth={1.5} />
                                Vehicle & time
                            </div>
                            <div className={valueCls}>{klass.label}</div>
                            <div className={subCls}>Pickup time · {time}</div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        data-testid={WIDGET.classPopover}
                        align="end"
                        sideOffset={12}
                        className="w-[320px] p-2 bg-white/90 backdrop-blur-2xl border border-white/40 ring-1 ring-black/5 rounded-[1.25rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]"
                    >
                        <div className="px-3 pt-2 pb-3 border-b border-neutral-100 mb-2">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Pickup time</div>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-[#1E41FC] outline-none"
                            />
                        </div>
                        {CLASSES.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setKlass(c)}
                                className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${
                                    c.id === klass.id ? "bg-neutral-100" : "hover:bg-neutral-50"
                                }`}
                            >
                                <span className="font-medium text-neutral-900">{c.label}</span>
                                <span className="text-xs text-neutral-500">{c.note}</span>
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>

                {/* Submit */}
                <div className="p-3 md:p-4 flex md:items-center md:justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        data-testid={WIDGET.submit}
                        className="group relative w-full md:w-auto md:h-full flex items-center justify-between gap-5 bg-[#1E41FC] hover:bg-[#0D2DE0] text-white rounded-2xl md:rounded-full pl-8 pr-2 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                    >
                        <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] py-2 md:py-0">Search vehicles</span>
                        <div className="w-[2.65rem] h-[2.65rem] rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/25">
                            <ArrowRight className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Footer micro line */}
            <div className="hidden md:flex items-center justify-between px-8 py-3.5 border-t border-neutral-100 nx-meta text-neutral-500">
                <span className="inline-flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-400" />
                    Insurance &amp; 24/7 roadside included
                </span>
                <span>Free cancellation up to 24h before pickup</span>
                <span className="inline-flex items-center gap-2">
                    Concierge response under 60s
                    <span className="w-1 h-1 rounded-full bg-neutral-400" />
                </span>
            </div>
            </div>
        </motion.div>
    );
};

export default BookingWidget;
