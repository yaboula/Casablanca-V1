"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, Maximize2, X } from "lucide-react";
import { TicketQrCode } from "./TicketQrCode";

type SmartTicketQrPanelProps = {
  ticketToken: string;
  manualCode: string;
  expiresLabel: string | null;
};

export function SmartTicketQrPanel({
  ticketToken,
  manualCode,
  expiresLabel,
}: SmartTicketQrPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  async function copyManualCode() {
    try {
      await navigator.clipboard.writeText(manualCode.replace(/\s/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group mx-auto flex w-full max-w-[19rem] flex-col items-center rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1E41FC]"
          aria-label="Enlarge QR code for operator scanning"
        >
          <span className="flex aspect-square w-full items-center justify-center rounded-xl bg-white">
            <TicketQrCode ticketToken={ticketToken} />
          </span>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#1E41FC]">
            <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
            Tap to enlarge for scan
          </span>
        </button>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Manual pickup code
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-[0.18em] text-neutral-950 sm:text-3xl">
            {manualCode}
          </p>
          <p className="mx-auto mt-2 max-w-[18rem] text-xs leading-relaxed text-neutral-600">
            If the camera cannot scan, read this code to the operator.
          </p>
          <button
            type="button"
            onClick={copyManualCode}
            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-100"
          >
            {copied ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <div className="w-full max-w-[29rem] rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-1 pb-3">
              <div>
                <h2
                  id={dialogTitleId}
                  className="text-base font-semibold text-neutral-950"
                >
                  Scan pickup pass
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                  Hold the phone steady and keep brightness high.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-100"
                aria-label="Close enlarged QR code"
                autoFocus
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mx-auto aspect-square w-full max-w-[24rem]">
                <TicketQrCode ticketToken={ticketToken} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-neutral-950 px-4 py-3 text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Manual code
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-[0.18em]">
                {manualCode}
              </p>
              {expiresLabel && (
                <p className="mt-2 text-xs text-neutral-300">
                  Valid until {expiresLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
