"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  Eye,
  QrCode,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { OperatorDelivery } from "@/types";
import { getDeliveryUrgency, getDocOverallStatus } from "@/lib/utils";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";

interface Props {
  deliveries: OperatorDelivery[];
}

export default function DeliveryListClient({ deliveries }: Props) {
  if (deliveries.length === 0) {
    return (
      <div className="px-5 pb-6 text-center py-12">
        <p className="text-sm text-slate-500">Sin entregas programadas para hoy.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-3">
      {deliveries.map((delivery, i) => {
        const urgency = getDeliveryUrgency(delivery.pickupDate);
        const docStatus = getDocOverallStatus(delivery.documents);
        const arrivalFormatted = format(new Date(delivery.pickupDate), "HH:mm");

        return (
          <motion.div
            key={delivery.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm"
          >
            {/* Urgency badge */}
            <div className="flex items-center justify-between">
              <UrgencyBadge level={urgency.level} label={urgency.label} />
              <span className="text-xs text-slate-500 font-mono">
                #{delivery.id.split("-").pop()}
              </span>
            </div>

            {/* Customer + Vehicle */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{delivery.customerName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {PICKUP_LOCATION_LABELS[delivery.pickupLocation]} · Llegada {arrivalFormatted}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  {delivery.vehicle.brand} {delivery.vehicle.model}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {delivery.vehicle.id.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Doc status + Balance */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <DocStatusBadge
                status={docStatus.status}
                label={docStatus.label}
                reservationId={delivery.id}
              />
              <p className="text-sm font-bold text-slate-900 tabular-nums">
                Cobrar: {delivery.balanceDueEUR} €
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/operator/delivery/${delivery.id}`}
                className="flex-1 min-h-[44px] bg-blue-600/10 text-blue-600 font-semibold text-xs rounded-xl
                           flex items-center justify-center gap-1.5 hover:bg-blue-600/20 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                Escanear QR
              </Link>
              <Link
                href={`/operator/delivery/${delivery.id}`}
                className="flex-1 min-h-[44px] bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl
                           flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver detalles
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function UrgencyBadge({ level, label }: { level: string; label: string }) {
  if (level === "CRITICAL") {
    return (
      <motion.span
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {label}
      </motion.span>
    );
  }

  if (level === "SOON") {
    return (
      <motion.span
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {label}
      </motion.span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}

function DocStatusBadge({
  status,
  label,
  reservationId,
}: {
  status: string;
  label: string;
  reservationId: string;
}) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Docs: {label}
      </span>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <Link
        href={`/operator/documents`}
        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Docs: {label} →
      </Link>
    );
  }

  return (
    <Link
      href={`/operator/documents`}
      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-500 transition-colors"
    >
      Docs: RECHAZADOS →
    </Link>
  );
}
