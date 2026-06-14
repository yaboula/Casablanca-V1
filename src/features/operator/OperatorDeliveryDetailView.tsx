"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCcw,
  ShieldCheck,
  CircleAlert,
  FileText,
  User,
  MapPin,
  CalendarDays,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { OperatorCaseDocumentsPanel } from "./OperatorCaseDocumentsPanel";
import { HandoffActionsPanel } from "./HandoffActionsPanel";
import { useOperatorDeliveriesSse } from "@/hooks/useOperatorDeliveriesSse";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeliveryViewModel } from "./types";

function formatDepositStatus(status: string) {
  switch (status) {
    case "AWAITING_CAPTURE":
      return "Hold Pending";
    case "CAPTURE_QUEUED":
      return "Processing";
    case "CAPTURED":
      return "Captured";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function formatOperatorLongDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatOperatorTime(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatPickupLocation(loc: string) {
  if (loc === "TERMINAL_1") return "Terminal 1";
  if (loc === "TERMINAL_2") return "Terminal 2";
  return loc;
}

function formatMoney(delivery: DeliveryViewModel) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(delivery.balanceDueEUR);
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "info" | "success" | "warning";
}) {
  const styles = {
    neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function getOperationalDecision(input: {
  status: string;
  docsReady: boolean;
  paymentReady: boolean;
  collectionReady: boolean;
}) {
  if (input.status === "COMPLETED") {
    return {
      title: "Case completed",
      detail: "This reservation is complete. No further action is required.",
      className: "border-neutral-200 bg-neutral-50 text-neutral-900",
      releaseLabel: "Complete",
      releaseTone: "neutral" as const,
    };
  }

  if (input.status === "IN_PROGRESS") {
    return {
      title: "Vehicle is with customer",
      detail: "Complete the reservation only after the vehicle is returned.",
      className: "border-green-200 bg-green-50 text-green-900",
      releaseLabel: "Release in progress",
      releaseTone: "success" as const,
    };
  }

  if (!input.docsReady) {
    return {
      title: "Step 1: Document Verification Required",
      detail:
        "Please review and approve all uploaded customer documents to unlock the payment section.",
      className: "border-amber-200 bg-amber-50 text-amber-950",
      releaseLabel: "Action Required",
      releaseTone: "warning" as const,
    };
  }

  if (!input.paymentReady || !input.collectionReady) {
    return {
      title: "Step 2: Financial Clearance Required",
      detail:
        "Documents are approved. Now verify deposit capture and collect any pending desk balance to unlock the handoff.",
      className: "border-amber-200 bg-amber-50 text-amber-950",
      releaseLabel: "Action Required",
      releaseTone: "warning" as const,
    };
  }

  return {
    title: "Step 3: Ready for Final Handoff",
    detail:
      "All system gates are clear. Confirm physical identity and hand over the vehicle keys.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    releaseLabel: "Release clear",
    releaseTone: "success" as const,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW CARDS
// ─────────────────────────────────────────────────────────────────────────────

function WorkflowStepWrapper({
  title,
  stepNumber,
  isLocked,
  isCompleted,
  children,
}: {
  title: string;
  stepNumber: number;
  isLocked: boolean;
  isCompleted: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isLocked
          ? "border-neutral-200 bg-neutral-50/50"
          : isCompleted
            ? "border-emerald-200 bg-white"
            : "border-neutral-300 bg-white shadow-sm ring-1 ring-neutral-200/50"
      }`}
    >
      <div
        className={`flex items-center gap-3 border-b px-5 py-4 ${
          isLocked
            ? "border-neutral-200"
            : isCompleted
              ? "border-emerald-100 bg-emerald-50/50"
              : "border-neutral-100 bg-neutral-50/50"
        }`}
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isLocked
              ? "bg-neutral-200 text-neutral-500"
              : isCompleted
                ? "bg-emerald-500 text-white"
                : "bg-neutral-950 text-white"
          }`}
        >
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
        </div>
        <h2
          className={`text-sm font-bold uppercase tracking-wider ${
            isLocked ? "text-neutral-500" : "text-neutral-900"
          }`}
        >
          {title}
        </h2>
        {isLocked && (
          <Lock className="ml-auto h-4 w-4 text-neutral-400" aria-label="Locked" />
        )}
      </div>

      <div
        className={`p-5 sm:p-6 ${
          isLocked ? "pointer-events-none opacity-50 grayscale select-none" : ""
        }`}
      >
        {children}
      </div>
      
      {/* Decorative lock overlay to prevent clicks physically just in case */}
      {isLocked && <div className="absolute inset-0 z-10" />}
    </section>
  );
}

function PaymentWorkflowCard({ delivery }: { delivery: DeliveryViewModel }) {
  const router = useRouter();
  const [method, setMethod] = useState<NonNullable<DeliveryViewModel["deskCollectionMethod"]>>("CASH");
  const [receiptReference, setReceiptReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  
  const paymentReady = delivery.depositStatus === "CAPTURED";
  const hasBalance = delivery.balanceDueEUR > 0.009;
  const collectionRecorded = delivery.deskCollectionStatus === "RECEIVED";
  const depositCapture = formatDepositStatus(delivery.depositStatus);

  async function handleConfirmCollection() {
    if (!hasBalance || collectionRecorded) return;
    if (receiptReference.trim().length < 2) {
      setMessageTone("error");
      setMessage("Add a receipt or reference before confirming desk payment.");
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      await clientFetch(`/operator/delivery/${delivery.id}/collection`, {
        method: "PATCH",
        body: { method, receiptReference },
      });
      setMessageTone("success");
      setMessage("Collection recorded. System state will refresh shortly.");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setMessageTone("error");
      if (
        normalized.message.includes("Cannot PATCH") ||
        normalized.message.includes("/collection")
      ) {
        setMessage(
          "Collection endpoint is not available from the running backend. Restart the backend on localhost:3900 with the latest operator collection changes.",
        );
      } else {
        setMessage(normalized.message || "Failed to record collection");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Financial Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Stripe Deposit Hold</span>
            <span className={`font-semibold ${paymentReady ? "text-emerald-700" : "text-amber-600"}`}>
              {depositCapture}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-700">Desk Balance Due</span>
            <span className="font-display text-xl font-semibold text-neutral-950">
              {formatMoney(delivery)}
            </span>
          </div>
        </div>
      </div>

      {hasBalance && !collectionRecorded && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmCollection();
          }}
          className="space-y-5 rounded-xl border border-blue-100 bg-blue-50/30 p-5"
        >
          <div className="flex items-start gap-3 text-blue-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              This reservation has an outstanding desk balance. You must collect payment before releasing the vehicle.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="payment-method" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Payment Method</label>
              <Select
                value={method}
                onValueChange={(value) =>
                  setMethod(
                    value as NonNullable<
                      DeliveryViewModel["deskCollectionMethod"]
                    >,
                  )
                }
              >
                <SelectTrigger
                  id="payment-method"
                  className="h-10 w-full rounded-md border-neutral-200 bg-white text-sm"
                >
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TPE">Card Terminal (TPE)</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="receipt-reference" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Receipt / Auth Reference</label>
              <input
                id="receipt-reference"
                value={receiptReference}
                onChange={(e) => setReceiptReference(e.target.value)}
                placeholder={method === "CASH" ? "e.g. Receipt #1234" : "e.g. Auth Code"}
                required
                minLength={2}
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded border px-3 py-2 text-xs font-semibold ${
                messageTone === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-green-200 bg-green-50 text-green-900"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Recording..." : "Confirm Collection"}
          </button>
        </form>
      )}

      {hasBalance && collectionRecorded && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Desk Balance Collected</p>
            <p className="text-xs opacity-80">Reference: {delivery.deskCollectionReference}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────

type OperatorDeliveryDetailViewProps = {
  delivery: DeliveryViewModel;
};

export function OperatorDeliveryDetailView({
  delivery,
}: OperatorDeliveryDetailViewProps) {
  const router = useRouter();
  const connectionState = useOperatorDeliveriesSse();
  
  // Status Calculations
  const approvedDocuments = delivery.documents.filter((doc) => doc.status === "APPROVED").length;
  const pendingDocuments = delivery.documents.filter((doc) => doc.status === "PENDING_REVIEW").length;
  const rejectedDocuments = delivery.documents.filter((doc) => doc.status === "REJECTED").length;
  const docsReady = approvedDocuments >= 2 && pendingDocuments === 0 && rejectedDocuments === 0;
  
  const paymentReady = delivery.depositStatus === "CAPTURED";
  const collectionReady = delivery.balanceDueEUR <= 0.009 || delivery.deskCollectionStatus === "RECEIVED";
  const financialClearanceReady = paymentReady && collectionReady;

  const decision = getOperationalDecision({
    status: delivery.status,
    docsReady,
    paymentReady,
    collectionReady,
  });

  const shortCode = delivery.id.replace(/-/g, "").toUpperCase().slice(0, 8);
  const isHandoffLifecycle =
    delivery.status === "CONFIRMED" ||
    delivery.status === "IN_PROGRESS" ||
    delivery.status === "COMPLETED";

  return (
    <article className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <Link
          href="/operator/dashboard"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500 transition hover:text-neutral-950"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to console
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {connectionState !== "live" && (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mr-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-950"
            >
              <RefreshCcw aria-hidden="true" className="h-3 w-3" />
              Refresh
            </button>
          )}
          <StatusBadge label={decision.releaseLabel} tone={decision.releaseTone} />
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        
        {/* LEFT PANEL: STICKY CONTEXT SIDEBAR */}
        <aside className="space-y-6 lg:sticky lg:top-8">
          <div>
            <p className="nx-eyebrow text-neutral-500">Command Center</p>
            <h1 className="mt-1 font-display text-3xl font-light leading-tight text-neutral-950">
              {shortCode}
            </h1>
            <p className="mt-1 font-mono text-[10px] text-neutral-400">
              {delivery.id.toUpperCase()}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-neutral-200/60 pb-5">
              <User aria-hidden="true" className="h-8 w-8 rounded-full bg-neutral-200 p-1.5 text-neutral-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-950">
                  {delivery.customerName}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {delivery.customerPhone || "No phone provided"}
                </p>
              </div>
            </div>

            <div className="border-b border-neutral-200/60 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Assigned Vehicle
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-neutral-950">
                  {delivery.vehicle ? `${delivery.vehicle.brand} ${delivery.vehicle.model}` : "Unassigned"}
                </p>
                <span className="rounded bg-neutral-950 px-2 py-1 font-mono text-[10px] font-black text-white">
                  {delivery.vehicle?.licensePlate || "N/A"}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {delivery.vehicle?.category || "Category unavailable"}
              </p>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  <MapPin className="h-3 w-3" /> Pickup Location
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {formatPickupLocation(delivery.pickupLocation)} — Casablanca Airport
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  <CalendarDays className="h-3 w-3" /> Timing
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {formatOperatorLongDate(delivery.pickupDate)} at {formatOperatorTime(delivery.pickupDate)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Return: {formatOperatorLongDate(delivery.returnDate)}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border px-5 py-4 ${decision.className}`}>
            <div className="flex items-start gap-3">
              {docsReady && financialClearanceReady ? (
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <h2 className="text-sm font-black">{decision.title}</h2>
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {decision.detail}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: PROGRESSIVE WORKFLOW */}
        <main className="space-y-6 pb-20">
          <WorkflowStepWrapper
            title="Document Verification"
            stepNumber={1}
            isLocked={false}
            isCompleted={docsReady}
          >
            <OperatorCaseDocumentsPanel
              documents={delivery.documents}
              customerName={delivery.customerName}
            />
          </WorkflowStepWrapper>

          <WorkflowStepWrapper
            title="Financial Clearance"
            stepNumber={2}
            isLocked={!docsReady}
            isCompleted={financialClearanceReady}
          >
            <PaymentWorkflowCard delivery={delivery} />
          </WorkflowStepWrapper>

          <WorkflowStepWrapper
            title="Vehicle Release"
            stepNumber={3}
            isLocked={!docsReady || !financialClearanceReady || !isHandoffLifecycle}
            isCompleted={delivery.status === "IN_PROGRESS" || delivery.status === "COMPLETED"}
          >
            {isHandoffLifecycle ? (
              <HandoffActionsPanel delivery={delivery} />
            ) : (
              <div className="flex items-center gap-3 text-neutral-500">
                <FileText aria-hidden="true" className="h-5 w-5" />
                <p className="text-sm">Reservation has not reached the delivery lifecycle.</p>
              </div>
            )}
          </WorkflowStepWrapper>
        </main>
      </div>
    </article>
  );
}
