import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Wallet, ArrowRight } from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import SmartTicketCard from "@/components/app/SmartTicketCard";
import PremiumButton from "@/components/app/PremiumButton";
import ErrorState from "@/components/app/ErrorState";

export default function SmartTicket() {
    const { ref } = useParams();
    const { getReservation, getVehicle } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;

    if (!reservation || !vehicle) {
        return (
            <AppShell>
                <ErrorState title="Ticket not found" actionLabel="Back to my trips" actionTo="/dashboard" />
            </AppShell>
        );
    }

    const status = deriveStatus(reservation);
    const ready = status === "approved" || status === "completed";

    return (
        <AppShell max="narrow">
            <div className="text-center">
                <span className="nx-eyebrow text-neutral-500 font-medium">Smart ticket</span>
                <h1 className="nx-h3 font-display font-light text-neutral-900 mt-2">
                    Your pickup pass
                </h1>
                <p className="nx-body text-neutral-500 mt-2 max-w-lg mx-auto">
                    Present this at the Casablanca arrivals hall. Your operator scans it,
                    verifies your identity, and hands over the keys.
                </p>
            </div>

            <div className="mt-8">
                <SmartTicketCard reservation={reservation} vehicle={vehicle} status={status} />
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <PremiumButton
                    variant="outline"
                    icon={Wallet}
                    onClick={() => toast("Demo", { description: "Wallet export is simulated in this concept." })}
                >
                    Add to wallet
                </PremiumButton>
                {!ready ? (
                    <PremiumButton to={`/waiting/${reservation.ref}`} variant="dark" iconRight={ArrowRight}>
                        Check review status
                    </PremiumButton>
                ) : (
                    <PremiumButton to="/dashboard" variant="dark" iconRight={ArrowRight}>
                        Go to my trips
                    </PremiumButton>
                )}
            </div>
        </AppShell>
    );
}
