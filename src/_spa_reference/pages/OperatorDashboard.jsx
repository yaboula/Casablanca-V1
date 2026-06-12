import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardCheck,
    AlertCircle,
    CalendarClock,
    Car,
    Search,
    ArrowRight,
} from "lucide-react";
import { useStore, deriveStatus } from "@/context/AppStore";
import { LOCATIONS } from "@/data/locations";
import AppShell from "@/components/app/AppShell";
import StatusBadge from "@/components/app/StatusBadge";
import EmptyState from "@/components/app/EmptyState";
import { formatDate } from "@/lib/format";

const FILTERS = [
    { id: "all", label: "All" },
    { id: "under_review", label: "To review" },
    { id: "action_required", label: "Action required" },
    { id: "approved", label: "Ready" },
    { id: "completed", label: "Completed" },
];

const PRIORITY = { under_review: 0, action_required: 1, approved: 2, awaiting_documents: 3, completed: 4 };

export default function OperatorDashboard() {
    const { reservations, getVehicle } = useStore();
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const rows = useMemo(() => {
        return reservations
            .map((r) => ({ r, status: deriveStatus(r), vehicle: getVehicle(r.vehicleId) }))
            .filter(({ r, status }) => {
                if (filter !== "all" && status !== filter) return false;
                if (!query.trim()) return true;
                const q = query.toLowerCase();
                return (
                    r.ref.toLowerCase().includes(q) ||
                    `${r.driver.firstName} ${r.driver.lastName}`.toLowerCase().includes(q) ||
                    r.vehicle?.name?.toLowerCase?.().includes(q)
                );
            })
            .sort((a, b) => PRIORITY[a.status] - PRIORITY[b.status]);
    }, [reservations, getVehicle, filter, query]);

    const metrics = useMemo(() => {
        const all = reservations.map((r) => deriveStatus(r));
        return {
            review: all.filter((s) => s === "under_review").length,
            action: all.filter((s) => s === "action_required").length,
            ready: all.filter((s) => s === "approved").length,
            total: reservations.length,
        };
    }, [reservations]);

    return (
        <AppShell variant="operator" max="wide">
            <div>
                <span className="nx-eyebrow text-neutral-500 font-medium">Operations</span>
                <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
                    Pickup &amp; verification console
                </h1>
            </div>

            {/* Metrics */}
            <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric icon={ClipboardCheck} tone="amber" label="Awaiting review" value={metrics.review} />
                <Metric icon={AlertCircle} tone="red" label="Action required" value={metrics.action} />
                <Metric icon={CalendarClock} tone="emerald" label="Ready for pickup" value={metrics.ready} />
                <Metric icon={Car} tone="neutral" label="Total reservations" value={metrics.total} />
            </div>

            {/* Toolbar */}
            <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            data-testid={`op-filter-${f.id}`}
                            className={`px-4 py-2 rounded-full text-[0.88rem] font-medium border transition-colors ${
                                filter === f.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search ref, customer, vehicle"
                        data-testid="op-search"
                        className="nx-input pl-10"
                    />
                </div>
            </div>

            {/* List */}
            <div className="mt-6">
                {/* header row (desktop) */}
                <div className="hidden lg:grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] gap-4 px-5 pb-3 nx-label text-neutral-400">
                    <span>Customer</span>
                    <span>Vehicle</span>
                    <span>Pickup</span>
                    <span>Status</span>
                    <span className="text-right">Action</span>
                </div>

                {rows.length === 0 ? (
                    <EmptyState title="No reservations match" description="Adjust your filters or search to see reservations." />
                ) : (
                    <div className="space-y-3">
                        {rows.map(({ r, status, vehicle }) => (
                            <OperatorRow key={r.ref} r={r} status={status} vehicle={vehicle} />
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

const OperatorRow = ({ r, status, vehicle }) => {
    const loc = LOCATIONS.find((l) => l.code === r.pickup?.locationCode) || LOCATIONS[0];
    const toReview = status === "under_review" || status === "action_required";
    const toHandoff = status === "approved";
    const link = toHandoff ? `/operator/handoff/${r.ref}` : `/operator/review/${r.ref}`;
    const actionLabel = toHandoff ? "Handoff" : toReview ? "Review" : "Open";

    return (
        <div
            className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] gap-3 lg:gap-4 lg:items-center bg-white border border-neutral-200 rounded-[1.1rem] px-5 py-4 hover:border-neutral-300 transition-colors"
            data-testid={`op-row-${r.ref}`}
        >
            <div>
                <div className="text-[0.95rem] font-semibold text-neutral-900">
                    {r.driver.firstName} {r.driver.lastName}
                </div>
                <div className="nx-meta text-neutral-500 font-mono">{r.ref}</div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-12 h-9 rounded-md overflow-hidden bg-neutral-100 shrink-0 hidden sm:block">
                    <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-[0.92rem] text-neutral-800">{vehicle.name}</div>
            </div>
            <div>
                <div className="text-[0.92rem] text-neutral-800">{formatDate(r.pickup?.date, "MMM d")} · {r.pickup?.time}</div>
                <div className="nx-meta text-neutral-500">{loc.primary}</div>
            </div>
            <div><StatusBadge status={status} size="sm" /></div>
            <div className="lg:text-right">
                <Link
                    to={link}
                    className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-neutral-900 hover:text-[#1E41FC] transition-colors"
                >
                    {actionLabel} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
};

const TONES = {
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-500",
    emerald: "bg-emerald-50 text-emerald-600",
    neutral: "bg-neutral-100 text-neutral-500",
};

const Metric = ({ icon: Icon, tone, label, value }) => (
    <div className="bg-white border border-neutral-200 rounded-[1.25rem] p-5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TONES[tone]}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="font-display text-[2rem] font-light text-neutral-900 mt-4 leading-none">{value}</div>
        <div className="nx-meta text-neutral-500 mt-1.5">{label}</div>
    </div>
);
