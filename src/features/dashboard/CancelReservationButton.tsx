"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api/client-fetch";
import { Loader2, AlertTriangle, X } from "lucide-react";

type Props = {
  reservationId: string;
};

export function CancelReservationButton({ reservationId }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    try {
      await clientFetch(`/reservations/${reservationId}/cancel`, {
        method: "PATCH",
      });
      // Refresh the dashboard to show it under Cancelled
      setShowConfirm(false);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to cancel reservation:", err);
      setError(err.message || "Failed to cancel reservation. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        disabled={isCancelling}
        className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        Cancel reservation
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from triggering anything behind
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={isCancelling}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <h3 className="mb-2 text-lg font-bold text-neutral-950">
              Cancel reservation?
            </h3>
            <p className="mb-6 text-sm text-neutral-600">
              This action cannot be undone. Are you sure you want to cancel this reservation? The vehicle will be released for other customers.
            </p>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-100">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={isCancelling}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-bold uppercase tracking-wider text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                disabled={isCancelling}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-red-600 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
