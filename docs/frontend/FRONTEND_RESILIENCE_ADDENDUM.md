# Frontend Resilience Addendum

Date: 2026-06-09

## Purpose

This addendum captures the resilience concerns raised by the audits, especially the Gemini audit. Casablanca-V1 is an airport pickup product. Users may be on weak mobile connections, switching networks, refreshing payment pages, uploading documents, or waiting for operator approval. The frontend must recover without inventing backend truth.

## Resilience Principles

| Principle | Requirement |
|---|---|
| Backend-confirmed truth | Never show completion until backend confirms it |
| Recoverable state | Draft UI state can persist, backend-owned entities cannot be faked |
| Explicit uncertainty | When connection status is unclear, say so and retry safely |
| Single source of identity | Reservation UUIDs and backend statuses drive all recovery |
| No duplicate charges/bookings | Reservation creation must use idempotency |

## SSE Strategy For Waiting Room

Waiting room should combine:

1. Initial HTTP fetch of reservation detail.
2. Initial HTTP fetch of documents for the reservation.
3. SSE subscription to `GET /sse/reservation/:id`.
4. Refetch on relevant SSE event.
5. Reconnect with exponential backoff and jitter.
6. HTTP polling fallback after repeated SSE failure.

### Suggested Reconnect Defaults

| Setting | Recommended default |
|---|---:|
| Initial delay | 1s |
| Maximum delay | 30s |
| Jitter | Random 0-500ms |
| Fallback threshold | 5 consecutive SSE failures |
| Polling fallback interval | 15s to 30s |

These values can be changed during implementation, but the behavior must remain: retry safely, avoid tight loops, and fall back to HTTP.

### Cleanup Requirements

| Situation | Required behavior |
|---|---|
| Route leave | Close EventSource |
| Reservation ID changes | Close old stream before opening new one |
| Logout | Close all reservation streams |
| Tab reconnects | Refetch reservation before trusting cached state |
| SSE event received | Invalidate/refetch reservation and documents instead of manually inventing final state |

## HTTP Polling Fallback

If SSE is unavailable, the waiting room should keep functioning in degraded mode:

| Behavior | Requirement |
|---|---|
| Poll source | `GET /reservations/:id` and `GET /documents/:reservationId` |
| User message | Show that live updates are delayed, not broken |
| Stop condition | Stop polling when final state is reached or route is left |
| Backoff | Increase delay on repeated HTTP failures |

## Idempotency-Key Lifecycle

Reservation creation and payment intent creation happen through `POST /reservations`. The frontend must send a durable `Idempotency-Key` for the final create action.

| Lifecycle step | Requirement |
|---|---|
| Generate | Generate once when the user reaches the final reservation create/payment step |
| Persist | Store with the booking draft in session-scoped storage |
| Reuse | Reuse on refresh/retry for the same draft |
| Clear on success | Clear after backend confirms reservation creation |
| Clear on cancel | Clear when the user intentionally abandons the draft |
| Clear on unrecoverable validation | Clear if backend rejects the draft as invalid and the user must restart |
| Expire | Add TTL; recommended default is 24 hours |

Do not create a new idempotency key on every button click. That defeats the purpose and risks duplicate reservation/payment attempts.

## Booking Draft Rules

| Field type | Storage rule |
|---|---|
| User-entered dates/location/preferences | May persist as draft UI state |
| Selected vehicle UUID | May persist as draft reference but must be revalidated before create |
| Price totals | Must be refetched/recomputed from backend-backed data before payment |
| Reservation UUID/status | Backend-owned; do not fake |
| Payment success | Backend-owned; do not fake |

## Silent Refresh And 401 Handling

The frontend server/proxy should handle session refresh consistently:

1. Call backend with current access cookie/session.
2. If backend returns 401, call backend refresh once.
3. If refresh succeeds, update cookies.
4. Retry the original backend request once.
5. If retry fails or refresh fails, return an auth error to the UI.

Never create an infinite refresh loop. Never expose refresh tokens to browser JavaScript.

## SSR To CSR Serialization

Adapters crossing from server to client must return plain JSON.

| Value type | Rule |
|---|---|
| Date | Serialize as ISO string |
| BigInt | Convert to string or safe number explicitly |
| Class instances | Convert to plain object |
| Methods/functions | Do not pass |
| Maps/Sets | Convert to arrays or objects |
| Undefined | Avoid in serialized payloads; use `null` when intentional |

## Error Recovery UX

| Flow | Recovery behavior |
|---|---|
| Login | Preserve email, clear password, explain retry or account issue |
| Register | Preserve valid fields, attach backend validation to fields |
| Booking create | Reuse idempotency key on retry |
| Payment | Show backend-derived payment/reservation state, not optimistic success |
| Document presign | Retry presign safely; do not reuse expired upload URLs |
| Document confirm | If upload succeeded but confirm failed, allow confirm retry |
| Waiting room | Reconnect SSE, then poll; refetch on visibility change |
| Operator approve/reject | Disable duplicate action while mutation is pending; refetch pending list after completion |
| Scan QR | Treat unknown/expired/invalid scans as backend-confirmed errors |

## UI State Model

Every data-driven screen should model:

| State | Meaning |
|---|---|
| `isLoading` | First load or blocking mutation in progress |
| `data` | Backend-confirmed data |
| `isEmpty` | Successful response with no records |
| `error` | Recoverable or terminal error, normalized |
| `isStale` | Showing previous data while refetching |
| `isOfflineOrDegraded` | Connection is poor, SSE unavailable, or polling fallback active |

Avoid rendering a screen from partial mock defaults. Empty and loading states should be explicit.

## Resilience Tests To Add Later

| Test | Purpose |
|---|---|
| Refresh during booking | Same idempotency key is reused |
| Double-click reserve | Only one backend reservation is created |
| SSE disconnect | UI reconnects and then polls after threshold |
| Backend 401 then refresh | Request retries once and succeeds |
| Refresh failure | User returns to login without loop |
| Server date payload | Client receives ISO strings only |
| Document confirm retry | Upload can recover after confirm failure |
| Operator duplicate approve | Second click is blocked or idempotently handled |

