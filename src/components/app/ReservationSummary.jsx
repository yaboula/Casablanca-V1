import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { LOCATIONS } from "@/data/locations";
import { formatCurrency, formatDate } from "@/lib/format";
import StatusBadge from "@/components/app/StatusBadge";

const resolveLocation = (code) =>
    LOCATIONS.find((l) => l.code === code) || LOCATIONS[0];

export const ReservationSummary = ({ reservation, vehicle, showPricing = true }) => {
    if (!reservation || !vehicle) return null;
    const loc = resolveLocation(reservation.pickup?.locationCode);
    const p = reservation.pricing || {};

    return (
        <div className="bg-white border border-neutral-200 rounded-[1.25rem] overflow-hidden" data-testid="reservation-summary">
            <div className="flex items-center gap-4 p-5 border-b border-neutral-100">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                    <div className="nx-label text-neutral-400">{vehicle.categoryLabel}</div>
                    <div className="font-display text-[1.15rem] font-semibold text-neutral-900 truncate">
                        {vehicle.name}
                    </div>
                    <div className="nx-meta text-neutral-500">
                        {formatCurrency(vehicle.pricePerDay)}/day
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#1E41FC] mt-0.5 shrink-0" />
                    <div>
                        <div className="nx-label text-neutral-400">Pickup &amp; return</div>
                        <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                            {loc.primary} · {loc.secondary}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[0.95rem]">
                    <CalendarDays className="w-4 h-4 text-[#1E41FC] shrink-0" />
                    <span className="font-medium text-neutral-900">
                        {formatDate(reservation.pickup?.date)} · {reservation.pickup?.time}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                    <span className="font-medium text-neutral-900">
                        {formatDate(reservation.return?.date)} · {reservation.return?.time}
                    </span>
                </div>
            </div>

            {showPricing && (
                <div className="p-5 border-t border-neutral-100 space-y-2.5">
                    <Row label={`${formatCurrency(p.perDay)} × ${p.days} ${p.days === 1 ? "day" : "days"}`} value={formatCurrency(p.total)} />
                    <Row label="Refundable deposit hold" value={formatCurrency(p.deposit)} muted />
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100">
                        <span className="text-[1rem] font-semibold text-neutral-900">Due at booking</span>
                        <span className="font-display text-[1.5rem] font-medium text-neutral-900">
                            {formatCurrency(p.total)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <StatusBadge status="demo" size="sm" />
                        <span className="nx-meta text-neutral-400">No real payment is processed.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const Row = ({ label, value, muted }) => (
    <div className="flex items-center justify-between text-[0.95rem]">
        <span className={muted ? "text-neutral-500" : "text-neutral-700"}>{label}</span>
        <span className={muted ? "text-neutral-500" : "font-medium text-neutral-900"}>{value}</span>
    </div>
);

export default ReservationSummary;
