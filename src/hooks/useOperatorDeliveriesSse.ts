"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OperatorSseConnectionState } from "@/features/operator/types";

const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 15_000;
const MAX_FAILURES = 5;
const POLL_INTERVAL_MS = 20_000;

export function useOperatorDeliveriesSse() {
  return useOperatorInvalidationStream("/api/v1/sse/operator/deliveries");
}

export function useOperatorDocumentsSse() {
  return useOperatorInvalidationStream("/api/v1/sse/operator/documents");
}

function useOperatorInvalidationStream(path: string): OperatorSseConnectionState {
  const router = useRouter();
  const [connectionState, setConnectionState] =
    useState<OperatorSseConnectionState>("degraded");
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failureCountRef = useRef(0);
  const delayRef = useRef(INITIAL_DELAY_MS);

  useEffect(() => {
    let isUnmounted = false;

    const refreshPage = () => {
      router.refresh();
    };

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const closeStream = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };

    const startPolling = () => {
      clearPolling();
      setConnectionState("fallback");
      pollTimerRef.current = setInterval(() => {
        if (!isUnmounted) {
          refreshPage();
        }
      }, POLL_INTERVAL_MS);
    };

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      closeStream();
      clearReconnect();

      let eventSource: EventSource;
      try {
        eventSource = new EventSource(path, { withCredentials: true });
      } catch {
        startPolling();
        return;
      }

      esRef.current = eventSource;

      eventSource.onopen = () => {
        if (isUnmounted) {
          return;
        }

        failureCountRef.current = 0;
        delayRef.current = INITIAL_DELAY_MS;
        setConnectionState("live");
      };

      eventSource.onmessage = (event) => {
        if (isUnmounted) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as { type?: string };
          if (payload.type === "keepalive") {
            return;
          }
        } catch {
          return;
        }

        refreshPage();
      };

      eventSource.onerror = () => {
        if (isUnmounted) {
          return;
        }

        closeStream();
        failureCountRef.current += 1;

        if (failureCountRef.current >= MAX_FAILURES) {
          startPolling();
          return;
        }

        setConnectionState("degraded");
        const nextDelay = delayRef.current;
        delayRef.current = Math.min(delayRef.current * 2, MAX_DELAY_MS);
        reconnectTimerRef.current = setTimeout(connect, nextDelay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      closeStream();
      clearReconnect();
      clearPolling();
    };
  }, [path, router]);

  return connectionState;
}
