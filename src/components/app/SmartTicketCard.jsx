import { MapPin, Clock, ShieldCheck } from "lucide-react";
import { LOCATIONS } from "@/data/locations";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/app/StatusBadge";

const resolveLocation = (code) => LOCATIONS.find((l) => l.code === code) || LOCATIONS[0];

// Deterministic faux-QR matrix from the reservation ref.
const buildMatrix = (str = "", size = 13) => {
    let seed = 7;
    for (let i = 0; i < str.length; i += 1) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0xffffffff;
    };
    const m = [];
    for (let y = 0; y < size; y += 1) {
        const row = [];
        for (let x = 0; x < size; x += 1) row.push(rand() > 0.5);
        m.push(row);
    }
    // finder-pattern corners for a QR-like look
    const stamp = (ox, oy) => {
        for (let y = 0; y < 3; y += 1)
            for (let x = 0; x < 3; x += 1) m[oy + y][ox + x] = true;
    };
    stamp(0, 0);
    stamp(size - 3, 0);
    stamp(0, size - 3);
    return m;
};

const FauxQR = ({ value }) => {
    const size = 13;
    const m = buildMatrix(value, size);
    const cell = 100 / size;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Pickup QR code">
            <rect width="100" height="100" fill="white" />
            {m.map((row, y) =>
                row.map((on, x) =>
                    on ? (
                        <rect
                            key={`${x}-${y}`}
                            x={x * cell}
                            y={y * cell}
                            width={cell}
                            height={cell}
                            fill="#0A0A0A"
                        />
                    ) : null
                )
            )}
        </svg>
    );
};

export const SmartTicketCard = ({ reservation, vehicle, status }) => {
    if (!reservation || !vehicle) return null;
    const loc = resolveLocation(reservation.pickup?.locationCode);
    const ready = status === "approved" || status === "completed";

    return (
        <div
            className="max-w-[560px] w-full mx-auto overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white"
            data-testid="smart-ticket"
        >
            {/* Header */}
            <div className="bg-[#0A0A0A] text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                    <span className="font-display text-lg font-medium">
                        Nexus<span className="text-neutral-500">/Car</span>
                    </span>
                </div>
                <span className="font-mono text-[0.8rem] tracking-[0.18em] text-neutral-300">
                    {reservation.ref}
                </span>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
                <div className="w-32 h-32 mx-auto sm:mx-0 rounded-xl border border-neutral-200 p-2 bg-white">
                    <FauxQR value={reservation.ref} />
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="nx-label text-neutral-400">Vehicle</div>
                        <div className="font-display text-[1.25rem] font-semibold text-neutral-900">
                            {vehicle.name}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="nx-label text-neutral-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Pickup
                            </div>
                            <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                                {loc.primary}
                            </div>
                            <div className="nx-meta text-neutral-500">{loc.secondary}</div>
                        </div>
                        <div>
                            <div className="nx-label text-neutral-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> When
                            </div>
                            <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                                {formatDate(reservation.pickup?.date, "MMM d")}
                            </div>
                            <div className="nx-meta text-neutral-500">{reservation.pickup?.time}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Perforation */}
            <div className="relative">
                <div className="border-t border-dashed border-neutral-300" />
                <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-neutral-50 border border-neutral-200" />
                <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-neutral-50 border border-neutral-200" />
            </div>

            {/* Footer status + handoff */}
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="nx-label text-neutral-400">Document status</span>
                    <StatusBadge status={ready ? "approved" : status} size="sm" />
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                    <ShieldCheck className="w-4 h-4 text-[#1E41FC] mt-0.5 shrink-0" />
                    <p className="text-[0.85rem] text-neutral-600">
                        {ready
                            ? "Show this pass to your Nexus operator at the arrivals hall. They will verify your identity and hand over the keys."
                            : "Your pass activates as soon as your documents are approved. You will be notified the moment it is ready."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SmartTicketCard;
