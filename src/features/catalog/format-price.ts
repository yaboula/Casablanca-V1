const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEurCents(cents: number): string {
  return eurFormatter.format(cents / 100);
}

export function formatCategory(category: string | null): string {
  if (!category) return "Categoria no indicada";
  return titleCaseEnum(category);
}

export function formatTransmission(transmission: string | null): string {
  if (!transmission) return "Transmision no indicada";
  return titleCaseEnum(transmission);
}

function titleCaseEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
