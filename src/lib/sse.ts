/**
 * SSE connection helper with exponential backoff reconnect.
 * Connects to the internal Next.js proxy (/api/sse/proxy) which injects
 * the Authorization header server-side — the JWT never appears in URLs.
 */

export type ConnectionStatus = "connecting" | "connected" | "error";

export interface SSEHandlers {
  onDocumentApproved?: (data: {
    documentType: string;
    reservationId: string;
  }) => void;
  onDocumentRejected?: (data: {
    documentType: string;
    reason: string;
    reservationId: string;
  }) => void;
  onReservationConfirmed?: (data: { reservationId: string }) => void;
  onReservationCompleted?: (data: { reservationId: string }) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Creates an SSE connection to `/api/sse/proxy` with automatic exponential-backoff
 * reconnection on failure (capped at 30 s per T7-6).
 *
 * Returns a cleanup function — call it in the `useEffect` return to close properly.
 */
export function createSSEConnection(handlers: SSEHandlers): () => void {
  let retries = 0;
  let es: EventSource | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (closed) return;

    handlers.onStatusChange?.("connecting");

    // The URL contains NO token — cookie is sent automatically by the browser
    es = new EventSource("/api/sse/proxy");

    es.onopen = () => {
      retries = 0; // reset backoff counter on successful connect
      handlers.onStatusChange?.("connected");
    };

    es.onerror = () => {
      if (closed) return;
      es?.close();
      handlers.onStatusChange?.("error");
      const delay = Math.min(1_000 * 2 ** retries++, 30_000);
      retryTimer = setTimeout(connect, delay);
    };

    // Bind named SSE event listeners
    bindEvent("document.approved", handlers.onDocumentApproved);
    bindEvent("document.rejected", handlers.onDocumentRejected);
    bindEvent("reservation.confirmed", handlers.onReservationConfirmed);
    bindEvent("reservation.completed", handlers.onReservationCompleted);
  }

  function bindEvent<T>(event: string, handler?: (data: T) => void) {
    if (!handler || !es) return;
    es.addEventListener(event, (e: MessageEvent) => {
      try {
        handler(JSON.parse(e.data) as T);
      } catch {
        /* malformed payload — skip silently */
      }
    });
  }

  connect();

  // Return cleanup function for useEffect
  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    es?.close();
  };
}
