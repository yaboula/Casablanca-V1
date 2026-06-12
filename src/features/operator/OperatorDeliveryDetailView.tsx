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
    <article className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14 space-y-8">
      <header className="mb-2">
        <Link
          href="/operator/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to console
        </Link>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="nx-eyebrow text-neutral-500 font-medium">Delivery details</span>
            <h1 className="text-3xl font-display font-light text-neutral-900 mt-2">
              Rental delivery status
            </h1>
            <p className="mt-1 text-xs text-neutral-500 font-mono">
              Reservation ID: {delivery.id.toUpperCase()}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                isCompleted
                  ? "bg-white text-neutral-500 border-neutral-200"
                  : delivery.status === "IN_PROGRESS"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                isCompleted
                  ? "bg-neutral-400"
                  : delivery.status === "IN_PROGRESS"
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`} />
              {delivery.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_360px] items-start">
        {/* Main Details */}
        <div className="space-y-6">
          
          {/* Customer & Trip */}
          <section className="rounded-[1.25rem] border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-300 transition-colors duration-300">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-5 border-b border-neutral-100 pb-3">
              Customer &amp; Trip info
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
                  <User aria-hidden="true" className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">Primary Driver</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">{delivery.customerName}</p>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">{delivery.customerPhone || "No phone provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">Pickup terminal</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">{formatPickupLocation(delivery.pickupLocation)}</p>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">Casablanca Mohammed V Airport · CMN</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">Rental period</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">
                    {formatDate(delivery.pickupDate)} at {formatTime(delivery.pickupDate)}
                  </p>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Return: {formatDate(delivery.returnDate)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vehicle */}
          {delivery.vehicle && (
            <section className="rounded-[1.25rem] border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-300 transition-colors duration-300">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-5 border-b border-neutral-100 pb-3">
                Vehicle Assignment
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200/50">
                  <Car aria-hidden="true" className="h-6 w-6 text-neutral-600" />
                </div>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">Assigned Vehicle</p>
                    <p className="text-[1.05rem] font-display font-semibold text-neutral-900 mt-1">
                      {delivery.vehicle.brand} {delivery.vehicle.model}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 text-white rounded-lg px-3 py-1.5 text-xs font-mono font-bold tracking-widest uppercase shadow-sm select-none">
                      {delivery.vehicle.licensePlate}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Documents Status */}
          <section className="rounded-[1.25rem] border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-300 transition-colors duration-300">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-5 border-b border-neutral-100 pb-3">
              Document Readiness
            </h2>
            {delivery.documents.length === 0 ? (
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 py-2">
                <FileText aria-hidden="true" className="h-4 w-4 text-neutral-400" />
                No documents uploaded yet.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {delivery.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                      {doc.type.replace("_", " ")}
                    </span>
                    {doc.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700 border border-green-200 shadow-sm">
                        <CheckCircle2 aria-hidden="true" className="h-3 w-3 animate-pulse" /> Approved
                      </span>
                    )}
                    {doc.status === "PENDING_REVIEW" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-750 border border-amber-200 shadow-sm">
                        <Clock aria-hidden="true" className="h-3 w-3" /> Pending
                      </span>
                    )}
                    {doc.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700 border border-red-200 shadow-sm">
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
          <section className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50/50 p-6 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-5 border-b border-neutral-100 pb-3">
              Financial Summary
            </h2>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-neutral-500 font-light">Rental contract type</span>
              <span className="text-xs font-semibold text-neutral-800">All-Inclusive</span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-4 border-t border-neutral-200">
              <span className="text-xs text-neutral-700 font-bold uppercase tracking-wider">Balance Due</span>
              <span className="text-xl font-display font-semibold text-neutral-950">€{delivery.balanceDueEUR.toFixed(2)}</span>
            </div>
          </section>

          <HandoffActionsPanel delivery={delivery} />
        </div>
      </div>
    </article>
  );
}
