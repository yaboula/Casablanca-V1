"use client";

/**
 * useReservationSse — SSE hook for the customer waiting room.
 *
 * Connects to GET /api/v1/sse/reservation/:id (proxied through Next.js
 * API route /api/v1/sse/reservation/:id which passes cookies).
 *
 * SSE lifecycle:
 * - Opens EventSource on mount
 * - Fires onEvent() on each non-ping event, caller decides to refetch
 * - Reports connectionState: live | degraded | fallback | closed
 * - On error: exponential backoff reconnect (1s → 30s, +jitter)
 * - After SSE_MAX_FAILURES consecutive errors: switches to HTTP polling (15-30s)
 * - On route leave (cleanup): closes EventSource AND clears polling timer
 * - On visibility change: reconnects/refetches when page becomes visible
 *
 * Caller contract:
 * - onEvent() should trigger a refetch of reservation + documents.
 * - Do NOT manually apply SSE event data as truth — always refetch.
 * - "ping" events are filtered here — caller never sees them.
 *
 * Backend SSE URL: /api/v1/sse/reservation/:id
 * Auth: EventSource uses credentials:"include" (cookie auth).
 */

import { useEffect, useRef, useCallback } from "react";
import type { SseConnectionState, SseRawEvent } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SSE_INITIAL_DELAY_MS = 1_000;
const SSE_MAX_DELAY_MS = 30_000;
const SSE_MAX_FAILURES = 5;
const POLL_INTERVAL_MS = 20_000;
const JITTER_MS = 2_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseReservationSseOptions = {
  reservationId: string;
  /** Called when a non-ping SSE event is received. Caller should refetch. */
  onEvent: (event: SseRawEvent) => void;
  /** Called when connection state changes. */
  onConnectionStateChange: (state: SseConnectionState) => void;
  /** Called on polling ticks when SSE falls back to HTTP polling. */
  onPollTick: () => void;
  /** If true, hook does nothing (closed/terminal state reached). */
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useReservationSse({
  reservationId,
  onEvent,
  onConnectionStateChange,
  onPollTick,
  disabled = false,
}: UseReservationSseOptions): void {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failureCountRef = useRef(0);
  const reconnectDelayRef = useRef(SSE_INITIAL_DELAY_MS);
  const isFallbackRef = useRef(false);
  const isUnmountedRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const closeEs = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  // Stable ref to always-current connect function (avoids forward-reference issue)
  const connectRef = useRef<() => void>(() => {});

  const startPolling = useCallback(() => {
    clearPollTimer();
    isFallbackRef.current = true;
    onConnectionStateChange("fallback");

    pollTimerRef.current = setInterval(() => {
      if (!isUnmountedRef.current) {
        onPollTick();
      }
    }, POLL_INTERVAL_MS);
  }, [clearPollTimer, onConnectionStateChange, onPollTick]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || isFallbackRef.current) return;
    closeEs();
    clearReconnectTimer();

    // SSE via the Next.js API proxy — cookies forwarded automatically
    const url = `/api/v1/sse/reservation/${encodeURIComponent(reservationId)}`;

    let es: EventSource;
    try {
      es = new EventSource(url, { withCredentials: true });
    } catch {
      // EventSource constructor failed (e.g. URL error)
      startPolling();
      return;
    }

    esRef.current = es;

    es.onopen = () => {
      if (isUnmountedRef.current) return;
      failureCountRef.current = 0;
      reconnectDelayRef.current = SSE_INITIAL_DELAY_MS;
      onConnectionStateChange("live");
    };

    es.onmessage = (ev) => {
      if (isUnmountedRef.current) return;
      let parsed: SseRawEvent;
      try {
        parsed = JSON.parse(ev.data) as SseRawEvent;
      } catch {
        return; // Malformed event — ignore
      }
      if (parsed.type === "ping") return; // keepalive — ignore
      onEvent(parsed);
    };

    es.onerror = () => {
      if (isUnmountedRef.current) return;
      closeEs();
      failureCountRef.current += 1;

      if (failureCountRef.current >= SSE_MAX_FAILURES) {
        onConnectionStateChange("fallback");
        startPolling();
        return;
      }

      onConnectionStateChange("degraded");
      const jitter = Math.random() * JITTER_MS;
      const delay = Math.min(
        reconnectDelayRef.current + jitter,
        SSE_MAX_DELAY_MS,
      );
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        SSE_MAX_DELAY_MS,
      );

      reconnectTimerRef.current = setTimeout(() => {
        if (!isUnmountedRef.current && !isFallbackRef.current) {
          // Use the stable ref to avoid the forward-reference lint error
          connectRef.current();
        }
      }, delay);
    };
  }, [
    reservationId,
    closeEs,
    clearReconnectTimer,
    startPolling,
    onEvent,
    onConnectionStateChange,
  ]);

  // Keep the stable ref in sync with the current connect callback.
  // Must be done in an effect — React Compiler disallows ref writes during render.
  // useEffect (not useLayoutEffect) is fine here since timers check the ref asynchronously.
  useEffect(() => {
    connectRef.current = connect;
  });

  // ---------------------------------------------------------------------------
  // Visibility change handler — reconnect when tab becomes visible
  // ---------------------------------------------------------------------------

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden || isUnmountedRef.current || isFallbackRef.current)
      return;

    // Reconnect if no active connection
    if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
      connect();
    }

    // Always trigger a refetch on visibility restore
    onPollTick();
  }, [connect, onPollTick]);

  // ---------------------------------------------------------------------------
  // Mount / unmount effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (disabled) return;

    isUnmountedRef.current = false;
    isFallbackRef.current = false;
    failureCountRef.current = 0;
    reconnectDelayRef.current = SSE_INITIAL_DELAY_MS;

    connect();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isUnmountedRef.current = true;
      closeEs();
      clearReconnectTimer();
      clearPollTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // Intentionally excludes connect/close/clear from deps — they are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, disabled]);
}
