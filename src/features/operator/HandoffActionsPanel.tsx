"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";
import type { DeliveryViewModel, DeliveryActionState } from "./types";

type HandoffActionsPanelProps = {
  delivery: DeliveryViewModel;
};

export function HandoffActionsPanel({ delivery }: HandoffActionsPanelProps) {
  const router = useRouter();
  const [actionState, setActionState] = useState<DeliveryActionState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState("");

  const isBusy = ["scanning", "checking_in", "completing"].includes(actionState);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const docsReady =
    delivery.documents.length >= 2 &&
    delivery.documents.every((d) => d.status === "APPROVED");

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleScanQr(e: React.FormEvent) {
    e.preventDefault();
    if (!qrPayload.trim()) return;

    setActionState("scanning");
    setFeedbackMessage(null);

    try {
      await clientFetch(
        `/operator/delivery/${delivery.id}/scan-qr`,
        {
          method: "POST",
          body: { qrCodeHash: qrPayload.trim() },
        }
      );
      setActionState("success");
      setFeedbackMessage("QR scan successful. Delivery in progress.");
      setQrPayload("");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Invalid or expired QR code.");
    }
  }

  async function handleManualCheckIn() {
    if (!window.confirm("Confirm manual vehicle handover without QR scan?")) return;

    setActionState("checking_in");
    setFeedbackMessage(null);

    try {
      await clientFetch(
        `/operator/delivery/${delivery.id}/checkin`,
        { method: "PATCH" }
      );
      setActionState("success");
      setFeedbackMessage("Manual check-in successful. Delivery in progress.");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Manual check-in failed.");
    }
  }

  async function handleComplete() {
    if (!window.confirm("Mark vehicle as returned and reservation completed?")) return;

    setActionState("completing");
    setFeedbackMessage(null);

    try {
      await clientFetch(
        `/reservations/${delivery.id}/complete`,
        { method: "PATCH" }
      );
      setActionState("success");
      setFeedbackMessage("Reservation marked as completed.");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Failed to complete reservation.");
    }
  }

  // ---------------------------------------------------------------------------
  // Render based on status
  // ---------------------------------------------------------------------------

  if (delivery.status === "COMPLETED") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-lg font-black text-green-900">Delivery completed</h3>
        <p className="mt-2 text-sm text-green-800">
          The vehicle has been returned and this reservation is finalized.
        </p>
      </div>
    );
  }

  if (delivery.status === "IN_PROGRESS") {
    return (
      <div className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
        <h3 className="text-sm font-black text-neutral-950">Active Rental</h3>
        <p className="mt-1 text-sm text-neutral-500">
          The customer currently has the vehicle. When they return it, complete the reservation.
        </p>

        {feedbackMessage && actionState === "error" && (
          <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {feedbackMessage}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleComplete}
            disabled={isBusy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {actionState === "completing" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            )}
            Complete reservation (Vehicle returned)
          </button>
        </div>
      </div>
    );
  }

  // Pending handover (CONFIRMED)
  return (
    <div className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
      <h3 className="text-sm font-black text-neutral-950">Vehicle Handoff</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Scan the customer&apos;s smart ticket to securely release the vehicle.
      </p>

      {!docsReady && (
        <div className="mt-4 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          <ShieldAlert aria-hidden="true" className="h-5 w-5 shrink-0" />
          Warning: Documents are not fully approved. Proceed with caution.
        </div>
      )}

      {feedbackMessage && actionState !== "idle" && (
        <div
          role={actionState === "error" ? "alert" : "status"}
          className={`mt-4 rounded border px-4 py-3 text-sm font-bold ${
            actionState === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {feedbackMessage}
        </div>
      )}

      <form onSubmit={handleScanQr} className="mt-6 flex gap-2">
        <label htmlFor="qr-payload" className="sr-only">
          QR Code Payload
        </label>
        <div className="relative flex-1">
          <QrCode aria-hidden="true" className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
          <input
            id="qr-payload"
            type="text"
            value={qrPayload}
            onChange={(e) => setQrPayload(e.target.value)}
            disabled={isBusy}
            placeholder="Scan or enter QR hash..."
            className="h-11 w-full rounded-md border border-[var(--nx-line)] bg-white pl-10 pr-4 text-sm text-neutral-950 placeholder-neutral-400 focus:border-neutral-950 focus:outline-none disabled:opacity-50"
            autoComplete="off"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isBusy || !qrPayload.trim()}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {actionState === "scanning" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          )}
          Validate
        </button>
      </form>

      <div className="mt-6 border-t border-[var(--nx-line)] pt-6">
        <p className="text-xs text-neutral-500 mb-3">
          Fallback action if scanner fails or customer cannot produce ticket:
        </p>
        <button
          type="button"
          onClick={handleManualCheckIn}
          disabled={isBusy}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--nx-line)] bg-white px-6 font-bold text-neutral-950 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {actionState === "checking_in" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            "Manual check-in (Bypass QR)"
          )}
        </button>
      </div>
    </div>
  );
}
