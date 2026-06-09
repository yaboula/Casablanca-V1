"use client";

import Link from "next/link";
import { ArrowLeft, Car, User, CalendarDays, MapPin, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useOperatorDeliveriesSse } from "@/hooks/useOperatorDeliveriesSse";
import { HandoffActionsPanel } from "./HandoffActionsPanel";
import type { DeliveryViewModel } from "./types";

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatPickupLocation(loc: string): string {
  if (loc === "CMN_T1") return "Casablanca T1";
  if (loc === "CMN_T2") return "Casablanca T2";
  return loc;
}

type OperatorDeliveryDetailViewProps = {
  delivery: DeliveryViewModel;
};

export function OperatorDeliveryDetailView({ delivery }: OperatorDeliveryDetailViewProps) {
  // Subscribe to live delivery updates. Will call router.refresh() on event.
  useOperatorDeliveriesSse();

  const isCompleted = delivery.status === "COMPLETED";

  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14">
      <header className="mb-8">
        <Link
          href="/operator/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-neutral-950">
              Delivery Detail
            </h1>
            <p className="mt-1 text-sm text-neutral-500 font-mono">
              Reservation {delivery.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                isCompleted
                  ? "bg-neutral-100 text-neutral-600"
                  : delivery.status === "IN_PROGRESS"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {delivery.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Main Details */}
        <div className="space-y-6">
          
          {/* Customer & Trip */}
          <section className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500 mb-4">
              Customer & Trip
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User aria-hidden="true" className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neutral-950">{delivery.customerName}</p>
                  <p className="text-sm text-neutral-600">{delivery.customerPhone || "No phone provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neutral-950">Pickup Location</p>
                  <p className="text-sm text-neutral-600">{formatPickupLocation(delivery.pickupLocation)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neutral-950">Schedule</p>
                  <p className="text-sm text-neutral-600">
                    {formatDate(delivery.pickupDate)} at {formatTime(delivery.pickupDate)} <br/>
                    Return: {formatDate(delivery.returnDate)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vehicle */}
          {delivery.vehicle && (
            <section className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500 mb-4">
                Vehicle Assignment
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-neutral-100">
                  <Car aria-hidden="true" className="h-6 w-6 text-neutral-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-neutral-950">
                    {delivery.vehicle.brand} {delivery.vehicle.model}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded border border-[var(--nx-line)] bg-neutral-50 px-2 py-0.5 font-mono text-xs text-neutral-600">
                      {delivery.vehicle.licensePlate}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Documents Status */}
          <section className="rounded-lg border border-[var(--nx-line)] bg-white p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500 mb-4">
              Document Readiness
            </h2>
            {delivery.documents.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <FileText aria-hidden="true" className="h-4 w-4" />
                No documents uploaded yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {delivery.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-950">
                      {doc.type.replace("_", " ")}
                    </span>
                    {doc.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 border border-green-200">
                        <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> Approved
                      </span>
                    )}
                    {doc.status === "PENDING_REVIEW" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                        <Clock aria-hidden="true" className="h-3 w-3" /> Pending
                      </span>
                    )}
                    {doc.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                        <AlertTriangle aria-hidden="true" className="h-3 w-3" /> Rejected
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <section className="rounded-lg border border-[var(--nx-line)] bg-neutral-50 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500 mb-4">
              Financial Summary
            </h2>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--nx-line)]">
              <span className="text-sm text-neutral-600">Balance Due</span>
              <span className="text-lg font-black text-neutral-950">€{delivery.balanceDueEUR.toFixed(2)}</span>
            </div>
          </section>

          <HandoffActionsPanel delivery={delivery} />
        </div>
      </div>
    </article>
  );
}
