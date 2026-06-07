"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * F3.1 / F3.3 — Live delivery list refresh via SSE.
 *
 * Subscribes to the operator deliveries SSE stream. When a DELIVERY_UPDATE
 * event is received (e.g. check-in, QR scan), calls router.refresh() to
 * re-trigger the Server Component fetch and update the UI without a full reload.
 *
 * AbortController (F3.3): the EventSource is closed on component unmount,
 * preventing the memory leak from DEUDA-FE-02.
 *
 * Usage: render <DeliveryRefresher /> anywhere inside the dashboard layout.
 */
export function useOperatorDeliveryRefresh() {
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    let closed = false;

    function connect() {
      if (closed) return;

      es = new EventSource("/api/sse/operator-deliveries");

      es.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data as string) as { type?: string };
          if (payload.type === "DELIVERY_UPDATE") {
            router.refresh();
          }
        } catch {
          // malformed JSON — ignore
        }
      });

      es.addEventListener("open", () => {
        retries = 0;
      });

      es.addEventListener("error", () => {
        es?.close();
        es = null;
        if (closed) return;

        // Exponential backoff: 2s, 4s, 8s … capped at 30s
        const delay = Math.min(2_000 * 2 ** retries, 30_000);
        retries++;
        retryTimer = setTimeout(connect, delay);
      });
    }

    connect();

    // F3.3: cleanup — close EventSource to prevent memory leak
    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [router]);
}
