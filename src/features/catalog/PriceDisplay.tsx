import { formatEurCents } from "./format-price";

export function PriceDisplay({ cents }: { cents: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-2xl font-black text-neutral-950">
        {formatEurCents(cents)}
      </span>
      <span className="text-sm font-semibold text-neutral-500">/ day</span>
    </span>
  );
}
