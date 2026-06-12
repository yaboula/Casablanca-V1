import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Phone, Globe, Fingerprint } from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import { LOCATIONS } from "@/data/locations";
import AppShell from "@/components/app/AppShell";
import OperatorActionPanel from "@/components/app/OperatorActionPanel";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";
import { formatDate } from "@/lib/format";

export default function OperatorReview() {
    const { ref } = useParams();
    const { getReservation, getVehicle, approveDocument, rejectDocument } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;

    if (!reservation || !vehicle) {
        return (
            <AppShell variant="operator">
                <ErrorState title="Reservation not found" actionLabel="Back to console" actionTo="/operator" />
            </AppShell>
        );
    }

    const status = deriveStatus(reservation);
    const loc = LOCATIONS.find((l) => l.code === reservation.pickup?.locationCode) || LOCATIONS[0];
    const allApproved = status === "approved";

    return (
        <AppShell variant="operator" max="default">
            <PremiumButton variant="ghost" icon={ArrowLeft} to="/operator" className="mb-5">
                Back to console
            </PremiumButton>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-start">
                {/* Customer summary */}
                <div className="lg:sticky lg:top-24">
                    <div className="bg-white border border-neutral-200 rounded-[1.5rem] overflow-hidden">
                        <div className="relative aspect-[16/10] bg-neutral-100">
                            <img src={vehicle.images[0]} alt={vehicle.name} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute top-4 left-4"><StatusBadge status={status} /></div>
                        </div>
                        <div className="p-6">
                            <div className="nx-label text-neutral-400">{vehicle.categoryLabel} · {reservation.ref}</div>
                            <h2 className="font-display text-[1.4rem] font-semibold text-neutral-900 mt-1">
                                {reservation.driver.firstName} {reservation.driver.lastName}
                            </h2>
                            <div className="mt-5 space-y-3">
                                <Detail icon={Mail} v={reservation.driver.email} />
                                <Detail icon={Phone} v={reservation.driver.phone} />
                                <Detail icon={Globe} v={reservation.driver.country} />
                                <Detail icon={Fingerprint} v={`Licence ${reservation.driver.license}`} />
                            </div>
                            <div className="mt-5 pt-5 border-t border-neutral-100 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="nx-label text-neutral-400">Vehicle</div>
                                    <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">{vehicle.name}</div>
                                </div>
                                <div>
                                    <div className="nx-label text-neutral-400">Pickup</div>
                                    <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                                        {formatDate(reservation.pickup?.date, "MMM d")} · {reservation.pickup?.time}
                                    </div>
                                    <div className="nx-meta text-neutral-500">{loc.primary}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review */}
                <div>
                    <h1 className="nx-h3 font-display font-light text-neutral-900">Document review</h1>
                    <p className="nx-body text-neutral-500 mt-2 max-w-xl">
                        Verify each document against the driver details. Approve to clear the
                        customer for pickup, or reject with a clear reason.
                    </p>

                    <div className="mt-7">
                        <OperatorActionPanel
                            reservation={reservation}
                            onApprove={(docId) => approveDocument(reservation.ref, docId)}
                            onReject={(docId, note) => rejectDocument(reservation.ref, docId, note)}
                        />
                    </div>

                    {allApproved ? (
                        <div className="mt-7 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-[0.98rem] font-semibold text-emerald-800">All documents approved</div>
                                <p className="nx-meta text-emerald-700 mt-1">
                                    The customer’s smart ticket is now active. Proceed to the
                                    delivery handoff when they arrive.
                                </p>
                                <div className="mt-4">
                                    <PremiumButton to={`/operator/handoff/${reservation.ref}`} variant="dark" iconRight={ArrowRight}>
                                        Proceed to handoff
                                    </PremiumButton>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-7 flex items-center gap-3">
                            <PremiumButton
                                variant="outline"
                                onClick={() => toast("Saved", { description: "Review progress saved." })}
                            >
                                Save &amp; continue later
                            </PremiumButton>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

const Detail = ({ icon: Icon, v }) => (
    <div className="flex items-center gap-3 text-[0.92rem] text-neutral-700">
        <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
        {v}
    </div>
);
