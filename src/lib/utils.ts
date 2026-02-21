import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Operator helpers ─────────────────────────────────────────

/** Compute time-based urgency for an operator delivery card. */
export function getDeliveryUrgency(arrivalTime: string): {
  level: "CRITICAL" | "SOON" | "NORMAL";
  minutesLeft: number;
  label: string;
} {
  const diff = new Date(arrivalTime).getTime() - Date.now();
  const mins = Math.max(0, Math.floor(diff / 60_000));

  if (mins < 30) {
    return { level: "CRITICAL", minutesLeft: mins, label: `EN ${mins} MIN` };
  }
  if (mins < 120) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return {
      level: "SOON",
      minutesLeft: mins,
      label: h > 0 ? `EN ${h}h ${m}min` : `EN ${mins} MIN`,
    };
  }
  const h = Math.floor(mins / 60);
  return { level: "NORMAL", minutesLeft: mins, label: `EN ${h}h` };
}

/** Derive overall document status for a delivery from its documents array. */
export function getDocOverallStatus(
  documents: { status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" }[]
): { status: "APPROVED" | "PENDING_REVIEW" | "REJECTED"; label: string } {
  if (documents.some((d) => d.status === "REJECTED")) {
    return { status: "REJECTED", label: "RECHAZADOS" };
  }
  if (documents.some((d) => d.status === "PENDING_REVIEW")) {
    return { status: "PENDING_REVIEW", label: "EN REVISIÓN" };
  }
  return { status: "APPROVED", label: "APROBADOS" };
}
