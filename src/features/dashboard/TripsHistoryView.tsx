import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Award } from "lucide-react";
import type { DashboardData } from "./types";
import type { ReservationViewModel } from "@/features/reservations/types";

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatEurCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  userName: string;
  data: DashboardData;
};

// ---------------------------------------------------------------------------
// View Component
// ---------------------------------------------------------------------------

export function TripsHistoryView({ userName, data }: Props) {
  // Filter for history
  const historyReservations = data.reservations.filter(
    (r) => r.status === "COMPLETED" || r.status === "CANCELLED"
  );

  // Group by status
  const completed = historyReservations.filter((r) => r.status === "COMPLETED");
  const cancelled = historyReservations.filter((r) => r.status === "CANCELLED");



  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Trip History
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            A complete record of your past journeys with Nexus Mobility.
          </p>
        </div>
      </header>

      {/* Loyalty Placeholder Module */}
      <section className="mb-12 overflow-hidden rounded-3xl bg-neutral-950 p-6 sm:p-8 relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="h-32 w-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              <Award className="h-3.5 w-3.5" />
              Nexus Rewards
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">
              Coming soon
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {userName}
            </p>
          </div>
          <div className="mt-6 sm:mt-0 sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Nexus Rewards
            </p>
            <p className="text-sm font-light text-neutral-400 max-w-[200px]">
              Earn points on every rental. The loyalty program will launch in the next update.
            </p>
          </div>
        </div>
      </section>

      {/* Completed Trips */}
      <section className="mb-12" aria-labelledby="history-completed-heading">
        <h2 id="history-completed-heading" className="mb-6 text-sm font-bold uppercase tracking-wider text-neutral-950">
          Completed Trips
        </h2>
        {completed.length > 0 ? (
          <div className="flex flex-col gap-4">
            {completed.map((reservation) => (
              <HistoryCard key={reservation.id} reservation={reservation} type="completed" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-8 text-center">
            <p className="text-sm text-neutral-500">You have no completed trips yet.</p>
          </div>
        )}
      </section>

      {/* Cancelled Trips */}
      {cancelled.length > 0 && (
        <section aria-labelledby="history-cancelled-heading">
          <h2 id="history-cancelled-heading" className="mb-6 text-sm font-bold uppercase tracking-wider text-neutral-950">
            Cancelled Reservations
          </h2>
          <div className="flex flex-col gap-4">
            {cancelled.map((reservation) => (
              <HistoryCard key={reservation.id} reservation={reservation} type="cancelled" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal Components
// ---------------------------------------------------------------------------

function HistoryCard({ reservation, type }: { reservation: ReservationViewModel; type: "completed" | "cancelled" }) {
  const vehicleName = reservation.vehicle?.name ?? "Vehicle";
  const vehicleImage = reservation.vehicle?.imageUrl;
  const isCancelled = type === "cancelled";

  return (
    <div className={`flex flex-col sm:flex-row overflow-hidden rounded-2xl border ${isCancelled ? "border-red-100 bg-white" : "border-neutral-200 bg-white"}`}>
      
      {/* Thumbnail */}
      <div className={`relative h-32 w-full shrink-0 sm:h-auto sm:w-48 bg-neutral-100 ${isCancelled ? "opacity-40 grayscale" : ""}`}>
        {vehicleImage ? (
          <Image
            src={vehicleImage}
            alt={vehicleName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 192px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold ${isCancelled ? "text-neutral-500 line-through decoration-neutral-300" : "text-neutral-950"}`}>
              {vehicleName}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {formatDateShort(reservation.pickupDate)} — {formatDateShort(reservation.returnDate)}
            </p>
            <p className="mt-1 text-xs text-neutral-400">Ref: {reservation.id.slice(0, 8)}</p>
          </div>

          <div className="sm:text-right">
            <p className={`text-sm font-bold ${isCancelled ? "text-neutral-400" : "text-neutral-950"}`}>
              {formatEurCents(reservation.totalPriceEurCents)}
            </p>
            {isCancelled && (
              <span className="mt-1 inline-block rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Invoice Action */}
        {!isCancelled && (
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-end">
            <button
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-400"
              type="button"
            >
              <Download className="h-3.5 w-3.5" />
              Receipt soon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
