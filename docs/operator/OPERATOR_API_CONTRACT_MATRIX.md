# Operator API Contract Matrix

## Notes
- All operator endpoints are under class-level `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(OPERATOR, ADMIN)`.
- `Verified`: document approval does **not** call Stripe directly inside the request. It enqueues the `capture-stripe` BullMQ job after the transaction commits.
- `Verified`: `GET /api/v1/operator/search` is documented in code as paginated, but controller exposes only `q`, so page/limit remain defaulted in the service.

## Core Operator Endpoints

| Endpoint | Role required | Request payload | Response shape | Frontend consumer | Preconditions | Error handling | Security risks | Test coverage |
|---|---|---|---|---|---|---|---|---|
| `GET /api/v1/operator/deliveries?date=YYYY-MM-DD` | OPERATOR, ADMIN | Query `date?` | `{ data: Delivery[], total }` where each row includes customer name, phone, vehicle, status, `qrCodeHash`, doc summaries, balance due | `src/features/operator/operator-service.ts`, `OperatorDashboardView`, `getDeliveryDetail()` | Reservation must be `CONFIRMED` and pickup date in requested day window | Standard 401/403; empty array on no matches | Exposes customer phone and `qrCodeHash` in list payload; no dedicated detail endpoint | No dedicated controller/service tests found |
| `GET /api/v1/operator/deliveries/stats?date=YYYY-MM-DD` | OPERATOR, ADMIN | Query `date?` | `{ data: { date, total, confirmed, inProgress, completed } }` | `operator-service.ts` | Same-day window; statuses limited to `CONFIRMED`, `IN_PROGRESS`, `COMPLETED` | Standard 401/403 | Low data sensitivity | No dedicated tests found |
| `PATCH /api/v1/operator/delivery/:reservationId/checkin` | OPERATOR, ADMIN | none | `{ data: Reservation, message }` | `HandoffActionsPanel` | Reservation must allow `CONFIRMED -> IN_PROGRESS`; idempotent return when already `IN_PROGRESS` | `404` missing reservation, `409` invalid state | Manual override bypasses QR; no audit log or mandatory reason | No direct endpoint tests found |
| `POST /api/v1/operator/delivery/:reservationId/scan-qr` | OPERATOR, ADMIN | `{ qrCodeHash: string }` | `{ data: Reservation, message }` | `HandoffActionsPanel` | Valid QR hash, reservation transition allowed to `IN_PROGRESS` | `404` invalid QR or reservation, `409` already delivered/invalid state | Depends on real QR payload; current customer ticket UI does not expose actual `qrCodeHash` | No direct endpoint tests found |
| `GET /api/v1/operator/search?q=...` | OPERATOR, ADMIN | Query `q` only | `{ data: Reservation[], total }` | No current frontend consumer found | Query length >= 2 | `400` short query | Returns raw reservation entities with potentially sensitive fields (`stripeClientSecret`, `stripePaymentIntentId`, `qrCodeHash`, PII) | No direct tests found |
| `GET /api/v1/operator/documents/pending` | OPERATOR, ADMIN | none | `{ data: PendingDocument[], total }` where each row includes `fileUrl`, reservationId, customerName, uploadedAgo | `operator-service.ts`, `OperatorDocumentsView` | Document status must be `PENDING_REVIEW` | Standard 401/403 | Presigned S3 read URLs; customer name may fall back to email | No direct endpoint tests found |
| `PATCH /api/v1/operator/documents/:id/approve` | OPERATOR, ADMIN | none | `{ document, reservationStatus }` | `OperatorDocumentReviewCard` | Document must be `PENDING_REVIEW`; second approval may move reservation to `AWAITING_CAPTURE` | `404` not found, `409` already processed or invalid transition | Generates QR before capture success; no endpoint-level anti-double-submit token beyond DB lock | No direct endpoint tests; processor/unit coverage exists |
| `PATCH /api/v1/operator/documents/:id/reject` | OPERATOR, ADMIN | `{ reason: string }`, validated 5-500 chars | `{ data: ReservationDocument }` | `OperatorDocumentReviewCard` | Document must be `PENDING_REVIEW` | `404` not found, `409` already processed | No pessimistic lock; concurrent approve/reject race is possible; stores free-text reason | No direct endpoint tests found |
| `GET /api/v1/sse/operator/deliveries` | OPERATOR, ADMIN | SSE stream | `text/event-stream` events with `DELIVERY_UPDATE` or `ping` | `useOperatorDeliveriesSse()` | Active SSE connection | 401/403 before stream | In-memory only; current Next proxy does not special-case streaming | No tests found |

## Adjacent Staff/Admin Endpoints Discovered

| Endpoint | Role required | Request payload | Response shape | Current consumer | Preconditions | Security notes | Test coverage |
|---|---|---|---|---|---|---|---|
| `PATCH /api/v1/reservations/:id/complete` | OPERATOR, ADMIN | none | `{ data: Reservation }` | `HandoffActionsPanel` | Reservation must be `IN_PROGRESS` | Correctly role-guarded, but current operator detail page cannot reliably load `IN_PROGRESS` records | Integration test verifies `USER` gets 403 |
| `GET /api/v1/reservations/:id` | USER own only, OPERATOR, ADMIN | none | `{ data: Reservation }` | Customer flows and staff can also call it | Reservation exists; ownership only enforced for `USER` | Returns `stripeClientSecret` and `qrCodeHash` inside raw reservation | Reservation integration tests cover owner/forbidden for USER |
| `GET /api/v1/documents/:reservationId` | USER own only, OPERATOR, ADMIN | none | `{ data: Document[] }` with presigned read URLs | Customer check-in/waiting; staff can call too | Reservation exists | Presigned doc URLs exposed to staff for any reservation | Documents service unit coverage exists |
| `GET /api/v1/sse/reservation/:id` | Authenticated; ownership check only for `USER` | SSE stream | `DOCUMENT_STATUS_UPDATE`, `RESERVATION_STATUS_UPDATE`, `ping` | `useReservationSse()` | Reservation exists for USER ownership checks | Staff can subscribe to any reservation stream; in-memory single-instance | No tests found |
| `GET /api/v1/admin/users` | ADMIN | `page`, `limit`, `q?` | paginated users | No current admin UI consumer | Admin only | Supports operator/admin boundary management | Admin integration tests cover role updates indirectly |
| `PATCH /api/v1/admin/users/:id` | ADMIN | `{ role?, isActive? }` | `{ data: User }` | No current admin UI consumer | Cannot change own role | Primary route for granting OPERATOR role | Admin integration tests cover self-role block and promote other user |
| `GET /api/v1/admin/stats` | ADMIN | none | KPI payload | No current admin UI consumer | Admin only | Cached aggregate business data | No explicit stats integration test found |

## Required Payload Summaries

### `PATCH /api/v1/operator/documents/:id/reject`
```json
{
  "reason": "Document is blurred and the full page is not visible."
}
```

### `POST /api/v1/operator/delivery/:reservationId/scan-qr`
```json
{
  "qrCodeHash": "64-char-hmac-hex"
}
```

## Current Contract Mismatches
- `Critical`: customer ticket UI does not expose a real `qrCodeHash` or machine-readable QR payload, but operator scan endpoint requires exactly that field.
- `Critical`: `/api/v1/sse/*` endpoints are consumed through the Next catch-all proxy, which reads upstream responses as text and does not preserve streaming semantics.
- `High`: operator detail route depends on today’s confirmed delivery list instead of a stable reservation detail endpoint.
- `High`: operator search returns broader reservation entity data than current UI requires.
