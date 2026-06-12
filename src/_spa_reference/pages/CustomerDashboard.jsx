import { useMemo } from "react";
import {
    ArrowRight,
    UploadCloud,
    Clock,
    Ticket,
    LifeBuoy,
    Car,
    CheckCircle2,
} from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import { LOCATIONS } from "@/data/locations";
import AppShell from "@/components/app/AppShell";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import EmptyState from "@/components/app/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";

const nextAction = (ref, status) => {
    switch (status) {
        case "awaiting_documents":
            return { label: "Upload documents", to: `/checkin/${ref}`, icon: UploadCloud };
        case "under_review":
            return { label: "View review status", to: `/waiting/${ref}`, icon: Clock };
        case "action_required":
            return { label: "Fix documents", to: `/checkin/${ref}`, icon: UploadCloud };
        case "approved":
            return { label: "View smart ticket", to: `/ticket/${ref}`, icon: Ticket };
        default:
            return { label: "View details", to: `/ticket/${ref}`, icon: ArrowRight };
    }
};

export default function CustomerDashboard() {
    const { reservations, activeRef, getReservation, getVehicle } = useStore();

    const mine = useMemo(
        () => reservations.filter((r) => r.owner === "me"),
        [reservations]
    );
    const active =
        (activeRef && getReservation(activeRef) && getReservation(activeRef).owner === "me"
            ? getReservation(activeRef)
            : null) || mine.find((r) => !r.completed) || null;
    const past = mine.filter((r) => r !== active);

    return (
        <AppShell max="default">
            <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                    <span className="nx-eyebrow text-neutral-500 font-medium">My trips</span>
                    <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
                        Your reservations
                    </h1>
                </div>
                <PremiumButton to="/catalog" variant="outline" iconRight={ArrowRight}>
                    Book another vehicle
                </PremiumButton>
            </div>

            {!active ? (
                <div className="mt-8 border border-neutral-200 rounded-[1.5rem]">
                    <EmptyState
                        icon={Car}
                        title="No active reservation"
                        description="When you reserve a vehicle, your trip, documents and smart ticket will appear here."
                        actionLabel="Browse the fleet"
                        actionTo="/catalog"
                    />
                </div>
            ) : (
                <ActiveCard reservation={active} vehicle={getVehicle(active.vehicleId)} />
            )}

            {/* Support */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-5 py-4">
                <LifeBuoy className="w-5 h-5 text-[#1E41FC] shrink-0 mt-0.5" />
                <p className="nx-body text-neutral-600">
                    Questions about your trip? Your concierge is available 24/7 at{" "}
                    <span className="font-medium text-neutral-900">concierge@nexuscar.demo</span>.
                </p>
            </div>

            {/* Past */}
            <div className="mt-10">
                <h2 className="nx-label text-neutral-400 mb-4">Past reservations</h2>
                {past.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-10 text-center">
                        <p className="nx-body text-neutral-400">Your completed trips will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {past.map((r) => {
                            const v = getVehicle(r.vehicleId);
                            return (
                                <div key={r.ref} className="flex items-center gap-4 rounded-2xl border border-neutral-200 px-5 py-4">
                                    <div className="w-16 h-11 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                                        <img src={v.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[0.95rem] font-semibold text-neutral-900 truncate">{v.name}</div>
                                        <div className="nx-meta text-neutral-500">{r.ref} · {formatDate(r.pickup?.date, "MMM d")}</div>
                                    </div>
                                    <StatusBadge status={deriveStatus(r)} size="sm" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

const ActiveCard = ({ reservation, vehicle }) => {
    const status = deriveStatus(reservation);
    const action = nextAction(reservation.ref, status);
    const loc = LOCATIONS.find((l) => l.code === reservation.pickup?.locationCode) || LOCATIONS[0];
    const approvedDocs = reservation.documents.filter((d) => d.status === "approved").length;

    return (
        <div className="mt-8 bg-white border border-neutral-200 rounded-[1.5rem] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-neutral-100">
                    <img src={vehicle.images[0]} alt={vehicle.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute top-4 left-4">
                        <StatusBadge status={status} />
                    </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col">
                    <div className="nx-label text-neutral-400">{vehicle.categoryLabel} · {reservation.ref}</div>
                    <h3 className="nx-h3 font-display font-light text-neutral-900 mt-2">{vehicle.name}</h3>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                        <Info k="Pickup" v={`${formatDate(reservation.pickup?.date, "MMM d")} · ${reservation.pickup?.time}`} />
                        <Info k="Location" v={loc.primary} sub={loc.secondary} />
                        <Info k="Documents" v={`${approvedDocs}/${reservation.documents.length} approved`} />
                        <Info k="Total" v={formatCurrency(reservation.pricing?.total)} />
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <PremiumButton to={action.to} variant="dark" icon={action.icon} iconRight={ArrowRight} data-testid="dashboard-next-action">
                            {action.label}
                        </PremiumButton>
                        {status === "approved" && (
                            <span className="inline-flex items-center gap-1.5 nx-meta text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" /> Ready for pickup
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Info = ({ k, v, sub }) => (
    <div>
        <div className="nx-label text-neutral-400">{k}</div>
        <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">{v}</div>
        {sub && <div className="nx-meta text-neutral-500">{sub}</div>}
    </div>
);
