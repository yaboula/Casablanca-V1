import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    Calendar as CalendarIcon,
    Check,
    Lock,
    ShieldCheck,
    FileCheck2,
    Info,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/context/AppStore";
import { getVehicle } from "@/data/vehicles";
import { LOCATIONS } from "@/data/locations";
import { REQUIRED_DOCUMENTS } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import BookingStepper from "@/components/app/BookingStepper";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";
import { formatCurrency, rentalDays } from "@/lib/format";

const STEPS = ["Trip", "Driver", "Documents", "Payment", "Review"];
const addDays = (n) => new Date(Date.now() + n * 86400000);

const TextField = ({ label, value, onChange, error, placeholder, type = "text", testid }) => (
    <label className="block">
        <span className="nx-label text-neutral-500">{label}</span>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-invalid={!!error}
            data-testid={testid}
            className="nx-input mt-2"
        />
        {error && <span className="text-[0.8rem] text-red-600 mt-1.5 block">{error}</span>}
    </label>
);

export default function BookingFlow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { search, createReservation } = useStore();
    const vehicle = getVehicle(id);

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});

    const [trip, setTrip] = useState({
        locationCode: search.locationCode || "CMN",
        pickupDate: search.pickupDate ? new Date(search.pickupDate) : addDays(2),
        pickupTime: search.pickupTime || "10:00",
        returnDate: search.returnDate ? new Date(search.returnDate) : addDays(5),
        returnTime: search.returnTime || "10:00",
    });
    const [driver, setDriver] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "",
        license: "",
    });
    const [docsAck, setDocsAck] = useState(false);
    const [pay, setPay] = useState({ name: "", number: "", expiry: "", cvc: "" });

    const days = useMemo(
        () => rentalDays(trip.pickupDate, trip.returnDate),
        [trip.pickupDate, trip.returnDate]
    );
    const total = vehicle ? vehicle.pricePerDay * days : 0;

    if (!vehicle) {
        return (
            <AppShell>
                <ErrorState
                    title="Vehicle not found"
                    description="We could not start a booking for this vehicle."
                    actionLabel="Back to catalog"
                    actionTo="/catalog"
                />
            </AppShell>
        );
    }

    const location = LOCATIONS.find((l) => l.code === trip.locationCode) || LOCATIONS[0];

    const validate = (s) => {
        const e = {};
        if (s === 0) {
            if (!trip.pickupDate) e.pickupDate = "Select a pickup date";
            if (!trip.returnDate) e.returnDate = "Select a return date";
            if (trip.pickupDate && trip.returnDate && rentalDays(trip.pickupDate, trip.returnDate) < 1)
                e.returnDate = "Return must be after pickup";
        }
        if (s === 1) {
            if (!driver.firstName.trim()) e.firstName = "Required";
            if (!driver.lastName.trim()) e.lastName = "Required";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) e.email = "Enter a valid email";
            if (!driver.phone.trim()) e.phone = "Required";
            if (!driver.country.trim()) e.country = "Required";
            if (!driver.license.trim()) e.license = "Required";
        }
        if (s === 2) {
            if (!docsAck) e.docsAck = "Please acknowledge to continue";
        }
        if (s === 3) {
            if (!pay.name.trim()) e.name = "Required";
            if (pay.number.replace(/\s/g, "").length < 12) e.number = "Enter a card number";
            if (!pay.expiry.trim()) e.expiry = "Required";
            if (pay.cvc.trim().length < 3) e.cvc = "Required";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (!validate(step)) return;
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const back = () => {
        setErrors({});
        if (step === 0) navigate(`/vehicle/${vehicle.id}`);
        else setStep((s) => s - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const confirm = () => {
        const ref = createReservation({
            vehicleId: vehicle.id,
            driver,
            pickup: {
                locationCode: trip.locationCode,
                date: trip.pickupDate.toISOString(),
                time: trip.pickupTime,
            },
            ret: { date: trip.returnDate.toISOString(), time: trip.returnTime },
            pricing: { perDay: vehicle.pricePerDay, days, deposit: vehicle.deposit, total },
        });
        toast("Reservation confirmed", { description: `Reference ${ref}` });
        navigate(`/confirmation/${ref}`);
    };

    return (
        <AppShell max="default">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
                {/* LEFT — steps */}
                <div>
                    <h1 className="nx-h3 font-display font-light text-neutral-900">
                        Complete your reservation
                    </h1>
                    <div className="mt-7">
                        <BookingStepper steps={STEPS} current={step} />
                    </div>

                    <div className="mt-9 min-h-[320px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {step === 0 && (
                                    <div className="space-y-6" data-testid="step-trip">
                                        <StepHeading title="Trip details" sub="Confirm where and when you will pick up and return the car." />
                                        <div>
                                            <span className="nx-label text-neutral-500">Pickup location</span>
                                            <div className="mt-2 grid sm:grid-cols-2 gap-3">
                                                {LOCATIONS.map((l) => (
                                                    <button
                                                        key={l.code}
                                                        onClick={() => setTrip((t) => ({ ...t, locationCode: l.code }))}
                                                        className={`text-left px-4 py-3.5 rounded-xl border transition-colors ${
                                                            trip.locationCode === l.code
                                                                ? "border-[#1E41FC] bg-[#1E41FC]/5"
                                                                : "border-neutral-200 hover:border-neutral-400"
                                                        }`}
                                                    >
                                                        <div className="text-[0.95rem] font-medium text-neutral-900">{l.primary}</div>
                                                        <div className="nx-meta text-neutral-500">{l.secondary}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <DateField
                                                label="Pickup date"
                                                date={trip.pickupDate}
                                                onSelect={(d) => setTrip((t) => ({ ...t, pickupDate: d }))}
                                                error={errors.pickupDate}
                                                testid="trip-pickup-date"
                                            />
                                            <TimeField
                                                label="Pickup time"
                                                value={trip.pickupTime}
                                                onChange={(v) => setTrip((t) => ({ ...t, pickupTime: v }))}
                                            />
                                            <DateField
                                                label="Return date"
                                                date={trip.returnDate}
                                                onSelect={(d) => setTrip((t) => ({ ...t, returnDate: d }))}
                                                error={errors.returnDate}
                                                testid="trip-return-date"
                                            />
                                            <TimeField
                                                label="Return time"
                                                value={trip.returnTime}
                                                onChange={(v) => setTrip((t) => ({ ...t, returnTime: v }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="space-y-6" data-testid="step-driver">
                                        <StepHeading title="Driver information" sub="The primary driver must match the documents uploaded later." />
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <TextField label="First name" value={driver.firstName} onChange={(v) => setDriver((d) => ({ ...d, firstName: v }))} error={errors.firstName} testid="driver-first" />
                                            <TextField label="Last name" value={driver.lastName} onChange={(v) => setDriver((d) => ({ ...d, lastName: v }))} error={errors.lastName} testid="driver-last" />
                                            <TextField label="Email" type="email" value={driver.email} onChange={(v) => setDriver((d) => ({ ...d, email: v }))} error={errors.email} placeholder="you@example.com" testid="driver-email" />
                                            <TextField label="Phone" value={driver.phone} onChange={(v) => setDriver((d) => ({ ...d, phone: v }))} error={errors.phone} placeholder="+212 ..." testid="driver-phone" />
                                            <TextField label="Country of residence" value={driver.country} onChange={(v) => setDriver((d) => ({ ...d, country: v }))} error={errors.country} testid="driver-country" />
                                            <TextField label="Driving licence no." value={driver.license} onChange={(v) => setDriver((d) => ({ ...d, license: v }))} error={errors.license} testid="driver-license" />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6" data-testid="step-documents">
                                        <StepHeading title="Documents reminder" sub="After confirming, you can upload these before you land so pickup takes minutes." />
                                        <ul className="space-y-3">
                                            {REQUIRED_DOCUMENTS.map((d) => (
                                                <li key={d.id} className="flex items-start gap-3 rounded-xl border border-neutral-200 px-4 py-4">
                                                    <span className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#1E41FC] shrink-0">
                                                        <FileCheck2 className="w-4 h-4" />
                                                    </span>
                                                    <div>
                                                        <div className="text-[0.95rem] font-semibold text-neutral-900">{d.label}</div>
                                                        <div className="nx-meta text-neutral-500 mt-0.5">{d.hint}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <label className="flex items-start gap-3 cursor-pointer" data-testid="docs-ack">
                                            <input
                                                type="checkbox"
                                                checked={docsAck}
                                                onChange={(e) => setDocsAck(e.target.checked)}
                                                className="mt-1 w-4 h-4 accent-[#1E41FC]"
                                            />
                                            <span className="nx-body text-neutral-700">
                                                I understand I will need to upload these documents and that pickup
                                                requires identity verification.
                                            </span>
                                        </label>
                                        {errors.docsAck && <p className="text-[0.8rem] text-red-600">{errors.docsAck}</p>}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6" data-testid="step-payment">
                                        <StepHeading title="Payment & deposit" sub="A refundable deposit is held at pickup. Rental total is charged to confirm." />
                                        <div className="flex items-start gap-3 rounded-xl bg-[#1E41FC]/5 border border-[#1E41FC]/20 px-4 py-3.5">
                                            <Info className="w-4 h-4 text-[#1E41FC] mt-0.5 shrink-0" />
                                            <p className="text-[0.88rem] text-neutral-700">
                                                <span className="font-semibold text-[#1E41FC]">Demo mode.</span> This is a
                                                simulated payment step. No card is charged and no card data is stored.
                                            </p>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div className="sm:col-span-2">
                                                <TextField label="Name on card" value={pay.name} onChange={(v) => setPay((p) => ({ ...p, name: v }))} error={errors.name} testid="pay-name" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <TextField label="Card number" value={pay.number} onChange={(v) => setPay((p) => ({ ...p, number: v }))} error={errors.number} placeholder="4242 4242 4242 4242" testid="pay-number" />
                                            </div>
                                            <TextField label="Expiry" value={pay.expiry} onChange={(v) => setPay((p) => ({ ...p, expiry: v }))} error={errors.expiry} placeholder="MM/YY" testid="pay-expiry" />
                                            <TextField label="CVC" value={pay.cvc} onChange={(v) => setPay((p) => ({ ...p, cvc: v }))} error={errors.cvc} placeholder="123" testid="pay-cvc" />
                                        </div>
                                        <div className="flex items-center gap-2 nx-meta text-neutral-500">
                                            <Lock className="w-3.5 h-3.5" /> Encrypted in production · simulated here
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-6" data-testid="step-review">
                                        <StepHeading title="Review & confirm" sub="Check everything is correct before you confirm your reservation." />
                                        <ReviewBlock title="Trip">
                                            <ReviewRow k="Pickup location" v={`${location.primary} · ${location.secondary}`} />
                                            <ReviewRow k="Pickup" v={`${format(trip.pickupDate, "EEE, MMM d, yyyy")} · ${trip.pickupTime}`} />
                                            <ReviewRow k="Return" v={`${format(trip.returnDate, "EEE, MMM d, yyyy")} · ${trip.returnTime}`} />
                                            <ReviewRow k="Duration" v={`${days} ${days === 1 ? "day" : "days"}`} />
                                        </ReviewBlock>
                                        <ReviewBlock title="Driver">
                                            <ReviewRow k="Name" v={`${driver.firstName} ${driver.lastName}`} />
                                            <ReviewRow k="Email" v={driver.email} />
                                            <ReviewRow k="Phone" v={driver.phone} />
                                            <ReviewRow k="Licence" v={driver.license} />
                                        </ReviewBlock>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status="demo" size="sm" />
                                            <span className="nx-meta text-neutral-400">Confirming creates a demo reservation.</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Nav */}
                    <div className="mt-10 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6">
                        <PremiumButton variant="ghost" icon={ArrowLeft} onClick={back}>
                            {step === 0 ? "Back to vehicle" : "Back"}
                        </PremiumButton>
                        {step < STEPS.length - 1 ? (
                            <PremiumButton variant="dark" iconRight={ArrowRight} onClick={next} data-testid="booking-next">
                                Continue
                            </PremiumButton>
                        ) : (
                            <PremiumButton variant="primary" icon={Check} onClick={confirm} data-testid="booking-confirm">
                                Confirm reservation
                            </PremiumButton>
                        )}
                    </div>
                </div>

                {/* RIGHT — order summary */}
                <div className="lg:sticky lg:top-24">
                    <div className="bg-white border border-neutral-200 rounded-[1.5rem] overflow-hidden">
                        <div className="flex items-center gap-4 p-5 border-b border-neutral-100">
                            <div className="w-24 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                                <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="nx-label text-neutral-400">{vehicle.categoryLabel}</div>
                                <div className="font-display text-[1.15rem] font-semibold text-neutral-900">{vehicle.name}</div>
                            </div>
                        </div>
                        <div className="p-5 space-y-2.5">
                            <SumRow k={`${formatCurrency(vehicle.pricePerDay)} × ${days} ${days === 1 ? "day" : "days"}`} v={formatCurrency(total)} />
                            <SumRow k="Insurance & roadside" v="Included" muted />
                            <SumRow k="Refundable deposit hold" v={formatCurrency(vehicle.deposit)} muted />
                            <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100">
                                <span className="text-[1rem] font-semibold text-neutral-900">Due at booking</span>
                                <span className="font-display text-[1.6rem] font-medium text-neutral-900">{formatCurrency(total)}</span>
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                                <ShieldCheck className="w-4 h-4 text-[#1E41FC] mt-0.5 shrink-0" />
                                <p className="nx-meta text-neutral-500">Free cancellation up to 24h before pickup.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

const StepHeading = ({ title, sub }) => (
    <div>
        <h2 className="nx-h4 font-display font-semibold text-neutral-900">{title}</h2>
        <p className="nx-body text-neutral-500 mt-1.5 max-w-lg">{sub}</p>
    </div>
);

const DateField = ({ label, date, onSelect, error, testid }) => (
    <div>
        <span className="nx-label text-neutral-500">{label}</span>
        <Popover>
            <PopoverTrigger asChild>
                <button
                    data-testid={testid}
                    aria-invalid={!!error}
                    className="nx-input mt-2 flex items-center justify-between text-left"
                >
                    <span className={date ? "text-neutral-900" : "text-neutral-400"}>
                        {date ? format(date, "EEE, MMM d, yyyy") : "Select date"}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-neutral-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="p-0 rounded-2xl border-neutral-200 shadow-xl">
                <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
            </PopoverContent>
        </Popover>
        {error && <span className="text-[0.8rem] text-red-600 mt-1.5 block">{error}</span>}
    </div>
);

const TimeField = ({ label, value, onChange }) => (
    <label className="block">
        <span className="nx-label text-neutral-500">{label}</span>
        <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="nx-input mt-2" />
    </label>
);

const ReviewBlock = ({ title, children }) => (
    <div className="rounded-[1.1rem] border border-neutral-200 p-5">
        <div className="nx-label text-neutral-400 mb-3">{title}</div>
        <div className="space-y-2">{children}</div>
    </div>
);

const ReviewRow = ({ k, v }) => (
    <div className="flex items-center justify-between gap-4 text-[0.95rem]">
        <span className="text-neutral-500">{k}</span>
        <span className="font-medium text-neutral-900 text-right">{v}</span>
    </div>
);

const SumRow = ({ k, v, muted }) => (
    <div className="flex items-center justify-between text-[0.95rem]">
        <span className={muted ? "text-neutral-500" : "text-neutral-700"}>{k}</span>
        <span className={muted ? "text-neutral-500" : "font-medium text-neutral-900"}>{v}</span>
    </div>
);
