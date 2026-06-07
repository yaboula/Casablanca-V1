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
export function createSSEConnection(
  handlers: SSEHandlers,
  reservationId?: string,
): () => void {
  let retries = 0;
  let es: EventSource | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (closed) return;

    handlers.onStatusChange?.("connecting");

    // Pass reservationId so the proxy can use the correct NestJS endpoint
    const url = reservationId
      ? `/api/sse/proxy?reservationId=${encodeURIComponent(reservationId)}`
      : "/api/sse/proxy";
    es = new EventSource(url);

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

    // Bug 16 fix: NestJS @Sse sends UNNAMED events (no "event:" field).
    // Use onmessage instead of addEventListener for named events.
    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "ping") return; // ignore keepalive

        if (data.type === "DOCUMENT_STATUS_UPDATE") {
          if (data.documentStatus === "APPROVED") {
            handlers.onDocumentApproved?.({
              documentType: data.documentType ?? "",
              reservationId: data.reservationId,
            });
          } else if (data.documentStatus === "REJECTED") {
            handlers.onDocumentRejected?.({
              documentType: data.documentType ?? "",
              reason: data.rejectionReason ?? "",
              reservationId: data.reservationId,
            });
          }
        }

        if (data.type === "RESERVATION_STATUS_UPDATE") {
          if (data.status === "CONFIRMED") {
            handlers.onReservationConfirmed?.({
              reservationId: data.reservationId,
            });
          } else if (data.status === "COMPLETED") {
            handlers.onReservationCompleted?.({
              reservationId: data.reservationId,
            });
          }
        }
      } catch {
        /* malformed payload — skip silently */
      }
    };
  }

  connect();

  // Return cleanup function for useEffect
  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    es?.close();
  };
}
