import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Ticket } from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import ReservationSummary from "@/components/app/ReservationSummary";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";

export default function WaitingRoom() {
    const { ref } = useParams();
    const { getReservation, getVehicle } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;

    if (!reservation || !vehicle) {
        return (
            <AppShell>
                <ErrorState title="Reservation not found" actionLabel="Back to my trips" actionTo="/dashboard" />
            </AppShell>
        );
    }

    const status = deriveStatus(reservation);
    const approved = status === "approved" || status === "completed";
    const rejected = status === "action_required";

    return (
        <AppShell max="narrow">
            <div className="max-w-[680px] mx-auto text-center">
                {approved ? (
                    <Icon tone="emerald" icon={ShieldCheck} />
                ) : rejected ? (
                    <Icon tone="red" icon={AlertCircle} />
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600"
                    >
                        <Clock className="w-8 h-8" />
                    </motion.div>
                )}

                <div className="mt-6 flex justify-center">
                    <StatusBadge status={status} />
                </div>

                <h1 className="nx-h2 font-display font-light text-neutral-900 mt-5">
                    {approved
                        ? "You are ready to drive"
                        : rejected
                        ? "One document needs attention"
                        : "Documents under review"}
                </h1>
                <p className="nx-lead text-neutral-600 mt-3">
                    {approved
                        ? "Your documents are approved and your smart ticket is active. Show it at arrivals to collect your vehicle."
                        : rejected
                        ? "An operator could not verify one of your documents. Re-upload it and we will review again right away."
                        : "Our operators are verifying your documents. This usually takes under 15 minutes — you can safely leave this page."}
                </p>

                {!approved && !rejected && (
                    <div className="mt-6 inline-flex items-center gap-2 nx-meta text-neutral-500">
                        <RefreshCw className="w-3.5 h-3.5" /> Estimated review time · under 15 minutes
                    </div>
                )}

                <div className="mt-8 max-w-[480px] mx-auto">
                    <ReservationSummary reservation={reservation} vehicle={vehicle} showPricing={false} />
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {approved && (
                        <PremiumButton to={`/ticket/${reservation.ref}`} variant="dark" icon={Ticket} iconRight={ArrowRight}>
                            View smart ticket
                        </PremiumButton>
                    )}
                    {rejected && (
                        <PremiumButton to={`/checkin/${reservation.ref}`} variant="dark" iconRight={ArrowRight}>
                            Re-upload documents
                        </PremiumButton>
                    )}
                    <PremiumButton to="/dashboard" variant="outline">
                        Go to my trips
                    </PremiumButton>
                </div>

                {!approved && (
                    <p className="nx-meta text-neutral-400 mt-8 max-w-md mx-auto">
                        Demo tip: open the{" "}
                        <a href="/operator" className="text-[#1E41FC] font-medium">Operator console</a>{" "}
                        to review and approve these documents and watch this page update.
                    </p>
                )}
            </div>
        </AppShell>
    );
}

const Icon = ({ tone, icon: I }) => (
    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
        tone === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
    }`}>
        <I className="w-8 h-8" />
    </div>
);
