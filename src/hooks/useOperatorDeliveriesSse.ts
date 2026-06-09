"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * useOperatorDeliveriesSse
 *
 * Subscribes to the operator delivery live updates stream.
 * Triggers a Server Component data refresh (`router.refresh()`) whenever
 * a delivery update event is received, ensuring the operator always sees
 * the latest backend truth.
 *
 * Reconnects automatically. Uses the standard EventSource API pointing
 * at our Next.js API proxy to include the secure session cookie.
 */
export function useOperatorDeliveriesSse() {
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      // Clean up previous connection if any
      if (esRef.current) {
        esRef.current.close();
      }

      // We point to the Next.js API proxy which attaches the session cookie
      // and forwards to the backend.
      const es = new EventSource("/api/v1/sse/operator/deliveries");
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          // We don't need to parse the payload strictly, we just know
          // an update happened and we should re-fetch Server Components.
          const payload = JSON.parse(event.data);
          if (payload.type === "DELIVERY_UPDATE") {
            router.refresh();
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      es.onerror = () => {
        // SSE connection dropped or errored. Close and attempt reconnect.
        es.close();
        esRef.current = null;
        
        // Exponential backoff could be added here, but a simple 3s delay
        // prevents tight loops.
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [router]);
}
