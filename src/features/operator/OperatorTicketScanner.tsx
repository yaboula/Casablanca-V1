"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, Loader2, QrCode, Search, X } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";

type TicketResolutionResponse = {
  data?: {
    reservationId?: string;
  };
};

export function OperatorTicketScanner() {
  const router = useRouter();
  const [ticketToken, setTicketToken] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const scanLockedRef = useRef(false);

  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;

    async function startScanner() {
      scanLockedRef.current = false;

      try {
        const stream = cameraStreamRef.current;
        if (!stream) return;

        setScannerError(null);
        const reader = new BrowserQRCodeReader();
        scannerControlsRef.current = await reader.decodeFromStream(
          stream,
          videoRef.current ?? undefined,
          (result) => {
            const value = result?.getText();
            if (!value || scanLockedRef.current || cancelled) return;

            scanLockedRef.current = true;
            setTicketToken(value);
            setScannerOpen(false);
            void resolveTicket(value);
          },
        );
      } catch {
        setScannerError(
          "Camera scanner could not start. Use localhost/HTTPS, allow camera access, or paste the ticket token.",
        );
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  async function openScanner() {
    setFeedback(null);
    setScannerError(null);
    scanLockedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerOpen(true);
      setScannerError(
        "Camera access is unavailable in this browser or connection. Paste the ticket token instead.",
      );
      return;
    }

    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      setScannerOpen(true);
    } catch {
      setScannerOpen(true);
      setScannerError(
        "Camera access was blocked. Allow camera permission, use localhost/HTTPS, or paste the ticket token.",
      );
    }
  }

  function closeScanner() {
    setScannerOpen(false);
  }

  async function resolveTicket(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) return;

    setIsResolving(true);
    setFeedback(null);

    try {
      const response = await clientFetch<TicketResolutionResponse>(
        "/operator/tickets/resolve",
        {
          method: "POST",
          body: { ticketToken: normalizedToken },
        },
      );
      const reservationId = response.data?.reservationId;
      if (!reservationId) {
        throw new Error("Ticket did not resolve to an operator case.");
      }

      router.push(`/operator/delivery/${reservationId}`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setFeedback(normalized.message || "Ticket could not be resolved.");
      setIsResolving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await resolveTicket(ticketToken);
  }

  return (
    <section className="rounded-[1.5rem] border border-neutral-200 bg-neutral-950 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            Fast case lookup
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Scan pickup QR to open the correct case
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-300">
            The QR does not release the vehicle. It only resolves the verified
            reservation case so the operator can review customer, vehicle, and
            document details before handoff.
          </p>
        </div>

        <button
          type="button"
          onClick={openScanner}
          disabled={isResolving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-100 disabled:opacity-60"
        >
          <Camera aria-hidden="true" className="h-4 w-4" />
          Scan QR
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="operator-ticket-token" className="sr-only">
          Signed ticket token
        </label>
        <div className="relative flex-1">
          <QrCode aria-hidden="true" className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
          <input
            id="operator-ticket-token"
            value={ticketToken}
            onChange={(e) => setTicketToken(e.target.value)}
            disabled={isResolving}
            placeholder="Paste signed QR token if camera cannot scan..."
            className="h-12 w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-white/40 disabled:opacity-60"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isResolving || !ticketToken.trim()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1E41FC] px-5 text-sm font-bold text-white transition hover:bg-[#1938d8] disabled:opacity-60"
        >
          {isResolving ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Search aria-hidden="true" className="h-4 w-4" />
          )}
          Open case
        </button>
      </form>

      {feedback && (
        <div role="alert" className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
          {feedback}
        </div>
      )}

      {scannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Scan pickup QR code"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold">Scan pickup QR</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  We will open the verified operator case automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-100"
                aria-label="Close QR scanner"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-neutral-950 p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80" />
                <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-[#1E41FC]" />
              </div>
            </div>
            <div
              role={scannerError ? "alert" : "status"}
              className={`px-5 py-4 text-sm ${
                scannerError ? "text-red-700" : "text-neutral-600"
              }`}
            >
              {scannerError ?? "Waiting for QR code..."}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
