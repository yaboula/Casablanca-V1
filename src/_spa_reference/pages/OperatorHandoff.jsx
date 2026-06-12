import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import { LOCATIONS } from "@/data/locations";
import AppShell from "@/components/app/AppShell";
import PremiumButton from "@/components/app/PremiumButton";
import StatusBadge from "@/components/app/StatusBadge";
import ErrorState from "@/components/app/ErrorState";
import { formatDate } from "@/lib/format";

const CHECKLIST = [
    "Verify driver identity against licence",
    "Inspect vehicle exterior & interior",
    "Confirm fuel / charge level and mileage",
    "Hand over keys & welcome pack",
];

export default function OperatorHandoff() {
    const { ref } = useParams();
    const navigate = useNavigate();
    const { getReservation, getVehicle, confirmHandoff } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;
    const [checked, setChecked] = useState({});

    if (!reservation || !vehicle) {
        return (
            <AppShell variant="operator">
                <ErrorState title="Reservation not found" actionLabel="Back to console" actionTo="/operator" />
            </AppShell>
        );
    }

    const status = deriveStatus(reservation);
    const loc = LOCATIONS.find((l) => l.code === reservation.pickup?.locationCode) || LOCATIONS[0];
    const docsApproved = reservation.documents.every((d) => d.status === "approved");
    const allChecked = CHECKLIST.every((_, i) => checked[i]);
    const completed = status === "completed";
    const canConfirm = docsApproved && allChecked && !completed;

    const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));
    const confirm = () => {
        confirmHandoff(reservation.ref);
        toast("Handoff confirmed", { description: `${reservation.ref} · vehicle delivered.` });
        navigate("/operator");
    };

    return (
        <AppShell variant="operator" max="default">
            <PremiumButton variant="ghost" icon={ArrowLeft} to="/operator" className="mb-5">
                Back to console
            </PremiumButton>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
                <div>
                    <span className="nx-eyebrow text-neutral-500 font-medium">Delivery handoff · {reservation.ref}</span>
                    <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
                        Airport handover
                    </h1>
                    <p className="nx-lead text-neutral-600 mt-3 max-w-xl">
                        Complete each step with the customer at arrivals, then confirm the
                        handoff to close out the reservation.
                    </p>

                    {/* Details */}
                    <div className="mt-7 grid sm:grid-cols-2 gap-4">
                        <Panel title="Customer">
                            <Row k="Name" v={`${reservation.driver.firstName} ${reservation.driver.lastName}`} />
                            <Row k="Phone" v={reservation.driver.phone} />
                            <Row k="Licence" v={reservation.driver.license} />
                        </Panel>
                        <Panel title="Vehicle & pickup">
                            <Row k="Vehicle" v={vehicle.name} />
                            <Row k="When" v={`${formatDate(reservation.pickup?.date, "MMM d")} · ${reservation.pickup?.time}`} />
                            <Row k="Where" v={loc.primary} />
                        </Panel>
                    </div>

                    {/* Checklist */}
                    <div className="mt-7">
                        <h2 className="nx-label text-neutral-400 mb-4">Pickup checklist</h2>
                        <div className="space-y-2.5">
                            {CHECKLIST.map((item, i) => (
                                <button
                                    key={item}
                                    onClick={() => toggle(i)}
                                    disabled={completed}
                                    data-testid={`handoff-check-${i}`}
                                    className={`w-full flex items-center gap-3.5 text-left rounded-xl border px-4 py-3.5 transition-colors ${
                                        checked[i] || completed
                                            ? "border-[#1E41FC] bg-[#1E41FC]/5"
                                            : "border-neutral-200 hover:border-neutral-400"
                                    }`}
                                >
                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
                                        checked[i] || completed ? "bg-[#1E41FC] border-[#1E41FC] text-white" : "border-neutral-300 text-transparent"
                                    }`}>
                                        <Check className="w-4 h-4" />
                                    </span>
                                    <span className="text-[0.95rem] text-neutral-800">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {!docsApproved && (
                        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-[0.9rem] text-amber-700">
                            Documents are not fully approved yet. Complete the review before handoff.
                        </div>
                    )}

                    <div className="mt-8 border-t border-neutral-200 pt-6">
                        {completed ? (
                            <div className="flex items-center gap-2.5 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Handoff completed — vehicle delivered.</span>
                            </div>
                        ) : (
                            <PremiumButton variant="primary" icon={Check} disabled={!canConfirm} onClick={confirm} data-testid="confirm-handoff">
                                Confirm handoff
                            </PremiumButton>
                        )}
                    </div>
                </div>

                {/* Reference */}
                <div className="lg:sticky lg:top-24">
                    <div className="bg-white border border-neutral-200 rounded-[1.5rem] p-6">
                        <div className="flex items-center justify-between">
                            <span className="nx-label text-neutral-400">Reference</span>
                            <StatusBadge status={status} size="sm" />
                        </div>
                        <div className="font-mono text-[1.6rem] tracking-[0.12em] text-neutral-900 mt-2">
                            {reservation.ref}
                        </div>
                        <div className="mt-5 pt-5 border-t border-neutral-100 space-y-3">
                            {reservation.documents.map((d) => (
                                <div key={d.id} className="flex items-center justify-between">
                                    <span className="text-[0.92rem] text-neutral-700">{d.label}</span>
                                    <StatusBadge status={d.status} size="sm" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                            <ShieldCheck className="w-4 h-4 text-[#1E41FC] mt-0.5 shrink-0" />
                            <p className="nx-meta text-neutral-500">
                                Scan the customer’s smart ticket to match this reference before release.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

const Panel = ({ title, children }) => (
    <div className="rounded-[1.1rem] border border-neutral-200 p-5">
        <div className="nx-label text-neutral-400 mb-3">{title}</div>
        <div className="space-y-2">{children}</div>
    </div>
);

const Row = ({ k, v }) => (
    <div className="flex items-center justify-between gap-4 text-[0.92rem]">
        <span className="text-neutral-500">{k}</span>
        <span className="font-medium text-neutral-900 text-right">{v}</span>
    </div>
);
