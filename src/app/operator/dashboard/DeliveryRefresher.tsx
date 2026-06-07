"use client";

import { useOperatorDeliveryRefresh } from "@/hooks/useOperatorDeliveryRefresh";

/**
 * F3.1 — Invisible client component that subscribes to the operator
 * delivery SSE stream and calls router.refresh() on any DELIVERY_UPDATE.
 *
 * Renders nothing — purely reactive. Mount it once inside the dashboard
 * layout so Server Component data re-fetches automatically when a
 * check-in or QR scan happens on any terminal.
 */
export default function DeliveryRefresher() {
  useOperatorDeliveryRefresh();
  return null;
}
