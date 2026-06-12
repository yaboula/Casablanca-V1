import { formatEurCents, formatMadFromEurCents } from "./format-price";

export function PriceDisplay({ cents }: { cents: number }) {
  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-baseline gap-1">
        <span className="text-2xl font-black text-neutral-950">
          From {formatEurCents(cents)}
        </span>
        <span className="text-sm font-semibold text-neutral-500">/ day</span>
      </span>
      <span className="text-xs font-semibold text-neutral-500">
        Approx. {formatMadFromEurCents(cents)} / day
      </span>
    </span>
  );
}
