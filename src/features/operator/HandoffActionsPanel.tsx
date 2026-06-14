"use client";

import {
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";
import type { DeliveryActionState, DeliveryViewModel } from "./types";

const ConfirmDialogContent = AlertDialogContent as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogHeader = AlertDialogHeader as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogTitle = AlertDialogTitle as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogDescription = AlertDialogDescription as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogFooter = AlertDialogFooter as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogCancel = AlertDialogCancel as ComponentType<{
  children?: ReactNode;
  className?: string;
}>;
const ConfirmDialogAction = AlertDialogAction as ComponentType<{
  children?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}>;

type HandoffActionsPanelProps = {
  delivery: DeliveryViewModel;
};

function GateRow({
  label,
  detail,
  ready,
}: {
  label: string;
  detail: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-neutral-200 py-3 first:border-t-0">
      <div>
        <p className="text-sm font-bold text-neutral-950">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
          {detail}
        </p>
      </div>
      {ready ? (
        <CheckCircle2
          aria-label="Ready"
          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
        />
      ) : (
        <AlertTriangle
          aria-label="Blocked"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
        />
      )}
    </div>
  );
}

export function HandoffActionsPanel({ delivery }: HandoffActionsPanelProps) {
  const router = useRouter();
  const [actionState, setActionState] = useState<DeliveryActionState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<
    "release" | "manual" | "return" | null
  >(null);
  const [manualCode, setManualCode] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [returnChecklist, setReturnChecklist] = useState({
    vehicleInspected: false,
    keysRecovered: false,
    returnRecorded: false,
  });

  const isBusy = ["checking_in", "completing"].includes(actionState);
  const docsReady =
    delivery.documents.length >= 2 &&
    delivery.documents.every((d) => d.status === "APPROVED");
  const paymentReady = delivery.depositStatus === "CAPTURED";
  const collectionReady =
    delivery.balanceDueEUR <= 0.009 ||
    delivery.deskCollectionStatus === "RECEIVED";
  const releaseReady =
    docsReady &&
    paymentReady &&
    collectionReady &&
    identityConfirmed &&
    documentsConfirmed;
  const reservationCode = delivery.id
    .replace(/-/g, "")
    .toUpperCase()
    .slice(0, 8);
  const normalizedManualCode = manualCode.replace(/[\s-]/g, "").toUpperCase();
  const manualReasonIsValid = manualReason.trim().length >= 5;
  const manualCodeMatches = normalizedManualCode === reservationCode;
  const manualReady = releaseReady && manualCodeMatches && manualReasonIsValid;
  const returnReady =
    returnChecklist.vehicleInspected &&
    returnChecklist.keysRecovered &&
    returnChecklist.returnRecorded;
  const releaseBlockReason = !docsReady
    ? "Release disabled because both required documents are not approved."
    : !paymentReady
      ? "Release disabled because deposit capture is not confirmed."
      : !collectionReady
        ? "Release disabled because desk payment has not been recorded."
      : !identityConfirmed || !documentsConfirmed
        ? "Release disabled until desk identity and original document checks are confirmed."
        : null;
  const returnBlockReason = !returnChecklist.vehicleInspected
    ? "Complete is blocked until the operator inspects the returned vehicle condition."
    : !returnChecklist.keysRecovered
      ? "Complete is blocked until the keys and vehicle accessories are recovered."
      : !returnChecklist.returnRecorded
        ? "Complete is blocked until return notes, fuel, and visible damage status are recorded at desk."
        : null;

  async function submitManualCheckIn() {
    if (!manualReady) {
      setActionState("error");
      setFeedbackMessage(
        "Manual release requires clear system gates, matching customer code, reason, and both desk confirmations.",
      );
      return;
    }

    setActionState("checking_in");
    setFeedbackMessage(null);

    try {
      await clientFetch(`/operator/delivery/${delivery.id}/checkin`, {
        method: "PATCH",
        body: {
          reason: manualReason.trim(),
          manualCode: manualCode.trim(),
          identityConfirmed,
          documentsConfirmed,
        },
      });
      setActionState("success");
      setFeedbackMessage("Manual release recorded. Delivery is now in progress.");
      setManualCode("");
      setManualReason("");
      setIdentityConfirmed(false);
      setDocumentsConfirmed(false);
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Manual release failed.");
    }
  }

  async function submitConfirmHandoff() {
    if (!releaseReady) {
      setActionState("error");
      setFeedbackMessage(
        "Release requires approved documents, captured deposit, recorded desk payment when due, identity match, and physical document check.",
      );
      return;
    }

    setActionState("checking_in");
    setFeedbackMessage(null);

    try {
      await clientFetch(`/operator/delivery/${delivery.id}/handoff`, {
        method: "PATCH",
        body: {
          identityConfirmed,
          documentsConfirmed,
        },
      });
      setActionState("success");
      setFeedbackMessage("Vehicle released. Delivery is now in progress.");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Failed to confirm release.");
    }
  }

  async function submitComplete() {
    if (!returnReady) {
      setActionState("error");
      setFeedbackMessage(
        "Return completion requires the operator return checklist to be fully confirmed.",
      );
      return;
    }

    setActionState("completing");
    setFeedbackMessage(null);

    try {
      await clientFetch(`/operator/deliveries/${delivery.id}/complete`, {
        method: "PATCH",
      });
      setActionState("success");
      setFeedbackMessage("Reservation marked as completed.");
      router.refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackMessage(normalized.message || "Failed to complete reservation.");
    }
  }

  function renderConfirmDialog() {
    const isOpen = confirmDialog !== null;

    let title = "";
    let description = "";
    let actionLabel = "";
    let actionClassName = "";
    let action: (() => Promise<void>) | null = null;

    if (confirmDialog === "release") {
      title = "Confirm final vehicle release";
      description =
        "This will move the reservation into the active rental state. Confirm the person at desk matches the reservation and the original documents were checked physically.";
      actionLabel = "Release vehicle";
      actionClassName = "bg-neutral-950 text-white hover:bg-neutral-800";
      action = submitConfirmHandoff;
    } else if (confirmDialog === "manual") {
      title = "Record audited manual release";
      description =
        "Use this only when the ticket flow is unavailable and the visible customer code was matched on the open reservation case. This action remains audited.";
      actionLabel = "Record manual release";
      actionClassName = "bg-neutral-950 text-white hover:bg-neutral-800";
      action = submitManualCheckIn;
    } else if (confirmDialog === "return") {
      title = "Confirm vehicle return";
      description =
        "This will finalize the reservation as completed. Confirm the return checklist was physically completed before closing the case.";
      actionLabel = "Complete reservation";
      actionClassName = "bg-neutral-950 text-white hover:bg-neutral-800";
      action = submitComplete;
    }

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <ConfirmDialogContent className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-0 shadow-[0_28px_120px_rgba(15,23,42,0.26)]">
          <div className="border-b border-neutral-100 px-6 py-5">
            <ConfirmDialogHeader className="space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                Operator confirmation
              </p>
              <ConfirmDialogTitle className="text-xl font-black text-neutral-950">
                {title}
              </ConfirmDialogTitle>
              <ConfirmDialogDescription className="text-sm leading-relaxed text-neutral-600">
                {description}
              </ConfirmDialogDescription>
            </ConfirmDialogHeader>
          </div>

          <div className="px-6 py-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Reservation code <span className="font-mono font-black text-neutral-950">{reservationCode}</span>
            </div>
          </div>

          <ConfirmDialogFooter className="border-t border-neutral-100 px-6 py-5">
            <ConfirmDialogCancel className="rounded-xl border-neutral-200 text-sm font-bold text-neutral-700">
              Cancel
            </ConfirmDialogCancel>
            <ConfirmDialogAction
              className={`rounded-xl text-sm font-bold ${actionClassName}`}
              onClick={(event) => {
                event.preventDefault();
                void (async () => {
                  if (!action) return;
                  await action();
                  setConfirmDialog(null);
                })();
              }}
            >
              {actionLabel}
            </ConfirmDialogAction>
          </ConfirmDialogFooter>
        </ConfirmDialogContent>
      </AlertDialog>
    );
  }

  if (delivery.status === "COMPLETED") {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-green-900">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10" />
        <h2 className="mt-4 text-base font-black">Delivery completed</h2>
        <p className="mt-2 text-sm leading-relaxed">
          The vehicle has been returned and this reservation is finalized.
        </p>
      </section>
    );
  }

  if (delivery.status === "IN_PROGRESS") {
    return (
      <>
        {renderConfirmDialog()}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-neutral-950">
              Return vehicle
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Close the rental only after the vehicle is back on site and the return desk checklist is complete.
            </p>
          </div>
        </div>

        {feedbackMessage && actionState === "error" ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
          >
            {feedbackMessage}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4">
          <GateRow
            label="Vehicle condition reviewed"
            detail="Walk around the vehicle and confirm visible damage, fuel level, and general condition."
            ready={returnChecklist.vehicleInspected}
          />
          <GateRow
            label="Keys and accessories recovered"
            detail="Confirm the key set, parking ticket, and required vehicle accessories were returned."
            ready={returnChecklist.keysRecovered}
          />
          <GateRow
            label="Return notes recorded"
            detail="Confirm desk notes are complete for fuel, mileage, damage remarks, and any follow-up needed."
            ready={returnChecklist.returnRecorded}
          />
        </div>

        <fieldset className="mt-5 space-y-3" disabled={isBusy}>
          <legend className="sr-only">Return checklist confirmations</legend>

          <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition hover:border-neutral-300">
            <Checkbox
              checked={returnChecklist.vehicleInspected}
              onCheckedChange={(checked) =>
                setReturnChecklist((current) => ({
                  ...current,
                  vehicleInspected: checked === true,
                }))
              }
              className="mt-0.5"
              aria-label="Vehicle condition reviewed"
            />
            <span>
              <span className="block font-bold">Vehicle condition reviewed</span>
              <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                Exterior, cabin, fuel, and visible damage have been checked on return.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition hover:border-neutral-300">
            <Checkbox
              checked={returnChecklist.keysRecovered}
              onCheckedChange={(checked) =>
                setReturnChecklist((current) => ({
                  ...current,
                  keysRecovered: checked === true,
                }))
              }
              className="mt-0.5"
              aria-label="Keys and accessories recovered"
            />
            <span>
              <span className="block font-bold">Keys and accessories recovered</span>
              <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                Key set, documents, and required accessories are back with the operator.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition hover:border-neutral-300">
            <Checkbox
              checked={returnChecklist.returnRecorded}
              onCheckedChange={(checked) =>
                setReturnChecklist((current) => ({
                  ...current,
                  returnRecorded: checked === true,
                }))
              }
              className="mt-0.5"
              aria-label="Return notes recorded"
            />
            <span>
              <span className="block font-bold">Return notes recorded</span>
              <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                Fuel, mileage, damages, and any customer follow-up have been recorded before closure.
              </span>
            </span>
          </label>
        </fieldset>

        {returnBlockReason ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            {returnBlockReason}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirmDialog("return")}
          disabled={isBusy || !returnReady}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionState === "completing" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          )}
          Complete after return
        </button>
        </section>
      </>
    );
  }

  return (
    <>
      {renderConfirmDialog()}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-neutral-950">
            Release vehicle
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            Final desk checklist after the correct case has been opened.
          </p>
        </div>
      </div>

      {feedbackMessage && actionState !== "idle" ? (
        <div
          role={actionState === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
            actionState === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4">
        <GateRow
          label="Documents approved"
          detail={
            docsReady
              ? "Passport and driving licence are approved."
              : "Release is blocked until both required documents are approved."
          }
          ready={docsReady}
        />
        <GateRow
          label="Deposit captured"
          detail={
            paymentReady
              ? "Deposit capture is confirmed."
              : "Release is blocked until deposit capture succeeds."
          }
          ready={paymentReady}
        />
        {delivery.balanceDueEUR > 0.009 ? (
          <GateRow
            label="Desk payment recorded"
            detail={
              collectionReady
                ? "Outstanding desk balance has been received and referenced."
                : "Release is blocked until the desk balance is received and recorded."
            }
            ready={collectionReady}
          />
        ) : null}
      </div>

      <fieldset className="mt-5 space-y-3" disabled={isBusy}>
        <legend className="sr-only">Desk release confirmations</legend>
        <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition hover:border-neutral-300">
          <Checkbox
            checked={identityConfirmed}
            onCheckedChange={(checked) => setIdentityConfirmed(checked === true)}
            className="mt-0.5"
            aria-label="Identity matches the presenting customer"
          />
          <span>
            <span className="block font-bold">
              Identity matches the presenting customer
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
              Compare the person at the desk with the reservation holder and
              original photo ID.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition hover:border-neutral-300">
          <Checkbox
            checked={documentsConfirmed}
            onCheckedChange={(checked) => setDocumentsConfirmed(checked === true)}
            className="mt-0.5"
            aria-label="Original passport and licence checked"
          />
          <span>
            <span className="block font-bold">
              Original passport and licence checked
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
              Confirm the physical documents match the approved uploaded files.
            </span>
          </span>
        </label>
      </fieldset>

      {releaseBlockReason ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          {releaseBlockReason}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirmDialog("release")}
        disabled={isBusy || !releaseReady}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {actionState === "checking_in" ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        )}
        Confirm vehicle release
      </button>

      <details className="group mt-5 border-t border-neutral-200 pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-neutral-500 transition hover:text-neutral-950">
          Manual audited fallback
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 transition group-open:rotate-180"
          />
        </summary>

        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-neutral-500">
            Use only when the ticket flow is unavailable and this exact case is
            already open. Manual fallback cannot override payment capture,
            uncollected desk balance, or document approval.
          </p>

          <div>
            <label
              htmlFor="manual-code"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500"
            >
              Visible customer code
            </label>
            <input
              id="manual-code"
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              disabled={isBusy}
              placeholder={reservationCode}
              autoComplete="off"
              className={`h-11 w-full rounded-xl border bg-white px-4 font-mono text-sm font-black uppercase tracking-[0.2em] text-neutral-950 placeholder-neutral-300 outline-none transition disabled:opacity-50 ${
                manualCode && !manualCodeMatches
                  ? "border-red-300 focus:border-red-600"
                  : "border-neutral-200 focus:border-neutral-950"
              }`}
            />
            {manualCode ? (
              <p
                className={`mt-1 text-xs font-semibold ${
                  manualCodeMatches ? "text-green-700" : "text-red-700"
                }`}
              >
                {manualCodeMatches
                  ? "Customer code matched."
                  : `Code must match ${reservationCode}.`}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="manual-reason"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500"
            >
              Audit reason
            </label>
            <textarea
              id="manual-reason"
              value={manualReason}
              onChange={(event) => setManualReason(event.target.value)}
              disabled={isBusy}
              rows={3}
              placeholder="Example: customer phone camera unavailable"
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={() => setConfirmDialog("manual")}
            disabled={isBusy || !manualReady}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-black text-neutral-950 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {actionState === "checking_in" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              "Record manual release"
            )}
          </button>
        </div>
      </details>
      </section>
    </>
  );
}
