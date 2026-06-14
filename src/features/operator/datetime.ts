const OPERATOR_LOCALE = "en-GB";
const OPERATOR_TIME_ZONE = "Africa/Casablanca";

export function formatOperatorDate(
  iso: string,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "-";

  try {
    return new Intl.DateTimeFormat(OPERATOR_LOCALE, {
      timeZone: OPERATOR_TIME_ZONE,
      ...options,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatOperatorShortDate(iso: string): string {
  return formatOperatorDate(iso, {
    day: "numeric",
    month: "short",
  });
}

export function formatOperatorLongDate(iso: string): string {
  return formatOperatorDate(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatOperatorTime(iso: string): string {
  return formatOperatorDate(iso, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOperatorBusinessDate(iso: string): string {
  if (!iso) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: OPERATOR_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(iso));
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    return year && month && day ? `${year}-${month}-${day}` : "";
  } catch {
    return "";
  }
}
