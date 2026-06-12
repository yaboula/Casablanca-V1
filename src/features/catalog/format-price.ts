const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const madFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 0,
});

const EUR_TO_MAD_DISPLAY_RATE = 10.8;

export function formatEurCents(cents: number): string {
  return eurFormatter.format(cents / 100);
}

export function formatMadFromEurCents(cents: number): string {
  return madFormatter.format((cents / 100) * EUR_TO_MAD_DISPLAY_RATE);
}

export function formatCategory(category: string | null): string {
  if (!category) return "Category to confirm";
  return titleCaseEnum(category);
}

export function formatTransmission(transmission: string | null): string {
  if (!transmission) return "Transmission to confirm";
  return titleCaseEnum(transmission);
}

function titleCaseEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
