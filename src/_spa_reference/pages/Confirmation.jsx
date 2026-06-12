import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, UploadCloud, LifeBuoy, MapPin, CalendarCheck } from "lucide-react";
import { useStore } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import ReservationSummary from "@/components/app/ReservationSummary";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";

export default function Confirmation() {
    const { ref } = useParams();
    const { getReservation, getVehicle } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;

    if (!reservation || !vehicle) {
        return (
            <AppShell>
                <ErrorState title="Reservation not found" actionLabel="Back to catalog" actionTo="/catalog" />
            </AppShell>
        );
    }

    return (
        <AppShell max="default">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
                <div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"
                    >
                        <CheckCircle2 className="w-8 h-8" />
                    </motion.div>
                    <h1 className="nx-h2 font-display font-light text-neutral-900 mt-6">
                        Reservation confirmed
                    </h1>
                    <p className="nx-lead text-neutral-600 mt-3 max-w-xl">
                        Your vehicle is reserved. Prepare your documents before you land so
                        pickup at Casablanca takes only minutes.
                    </p>

                    <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-neutral-200 px-5 py-4">
                        <div>
                            <div className="nx-label text-neutral-400">Reference</div>
                            <div className="font-mono text-[1.5rem] tracking-[0.12em] text-neutral-900 mt-1">{reservation.ref}</div>
                        </div>
                        <span className="w-px h-10 bg-neutral-200" />
                        <StatusBadge status="demo" />
                    </div>

                    {/* Next steps */}
                    <div className="mt-9">
                        <h2 className="nx-label text-neutral-400 mb-4">Next steps</h2>
                        <div className="space-y-3">
                            <NextStep
                                n="1"
                                icon={UploadCloud}
                                title="Upload your documents"
                                desc="Licence, ID and a verification selfie — reviewed before you arrive."
                                to={`/checkin/${reservation.ref}`}
                                cta="Start check-in"
                                primary
                            />
                            <NextStep
                                n="2"
                                icon={CalendarCheck}
                                title="We verify and prepare"
                                desc="Our operators review your documents and ready your exact vehicle."
                            />
                            <NextStep
                                n="3"
                                icon={MapPin}
                                title="Pick up at arrivals"
                                desc="Show your smart ticket, verify your identity, and drive away."
                            />
                        </div>
                    </div>

                    <div className="mt-9 flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-5 py-4">
                        <LifeBuoy className="w-5 h-5 text-[#1E41FC] shrink-0" />
                        <p className="nx-body text-neutral-600">
                            Need help? Your concierge replies in under a minute at{" "}
                            <span className="font-medium text-neutral-900">concierge@nexuscar.demo</span>.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <PremiumButton to={`/checkin/${reservation.ref}`} variant="dark" iconRight={ArrowRight}>
                            Upload documents now
                        </PremiumButton>
                        <PremiumButton to="/dashboard" variant="outline">
                            Go to my trips
                        </PremiumButton>
                    </div>
                </div>

                <div className="lg:sticky lg:top-24">
                    <ReservationSummary reservation={reservation} vehicle={vehicle} />
                </div>
            </div>
        </AppShell>
    );
}

const NextStep = ({ n, icon: Icon, title, desc, to, cta, primary }) => (
    <div className={`flex items-start gap-4 rounded-2xl border px-5 py-4 ${primary ? "border-neutral-300" : "border-neutral-200"}`}>
        <span className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-[#1E41FC] shrink-0">
            <Icon className="w-5 h-5" />
        </span>
        <div className="flex-1">
            <div className="text-[1rem] font-semibold text-neutral-900">{title}</div>
            <div className="nx-meta text-neutral-500 mt-1 max-w-md">{desc}</div>
            {to && (
                <Link to={to} className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-[#1E41FC] mt-2.5 hover:gap-2.5 transition-all">
                    {cta} <ArrowRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    </div>
);
