# Payment / Document / Handoff Flow

## Short Answer To The Key Question
- `Verified`: document approval does **not** directly call Stripe capture.
- `Verified`: once the second required document is approved, backend sets reservation to `AWAITING_CAPTURE` and enqueues the BullMQ `capture-stripe` job.
- `Verified`: actual capture happens in `backend/src/operator/processors/capture-stripe.processor.ts`.

## End-to-End Flow

### 1. Customer creates reservation
- Endpoint: `POST /api/v1/reservations`
- Backend actions:
  - validates dates and availability
  - recalculates pricing on server
  - saves reservation as `PENDING_DEPOSIT`
  - creates manual-capture Stripe PaymentIntent
  - stores `stripePaymentIntentId` and `stripeClientSecret`
  - enqueues 15-minute expiry job

### 2. Backend quote / pricing snapshot
- Source: `PricingService.calculateReservationPrice()`
- Stored fields include:
  - `dailyRateEurCentsSnapshot`
  - `subtotalEurCents`
  - `depositEurCents`
  - `totalDueNowEurCents`
  - `pricingPolicyVersion`
- Verified current behavior:
  - deposit = `1000`
  - `totalDueNowEurCents = 1000`
  - PaymentIntent amount is deposit only

### 3. Payment authorization / deposit
- Customer UI: `StripeDepositPanel`
- Payment intent config:
  - `capture_method = manual`
- Customer confirms through Stripe Elements.
- Reservation does not automatically move to `CONFIRMED` from the frontend action itself.

### 4. Customer uploads documents
- Endpoints:
  - `POST /api/v1/documents/presign`
  - direct S3 upload
  - `POST /api/v1/documents/confirm`
- Constraints:
  - reservation must belong to user
  - reservation status must be `PENDING_DEPOSIT` or `CONFIRMED`
  - approved doc of same type cannot be replaced

### 5. Operator reviews documents
- Queue endpoint:
  - `GET /api/v1/operator/documents/pending`
- Decision endpoints:
  - `PATCH /api/v1/operator/documents/:id/approve`
  - `PATCH /api/v1/operator/documents/:id/reject`
- Approval path:
  - first required doc approved: document changes only
  - second required doc approved:
    - reservation locked
    - reservation set to `AWAITING_CAPTURE`
    - `qrCodeHash` generated
    - audit log written
    - customer SSE emits document approval and reservation status update
    - `capture-stripe` job enqueued

### 6. Payment capture or authorization state changes
- Primary path:
  - `capture-stripe` processor reads only reservations in `AWAITING_CAPTURE`
  - captures PaymentIntent
  - updates reservation to `CONFIRMED`
  - emits reservation SSE
- Failure path:
  - BullMQ retries up to 5 times with exponential backoff
  - final failure compensates `AWAITING_CAPTURE -> CANCELLED`
- Safety-net path:
  - Stripe webhook `payment_intent.succeeded` will set `CONFIRMED` if still allowed

### 7. Smart ticket / QR unlock
- Backend condition:
  - `qrCodeHash` exists after second document approval
- Customer UI condition:
  - ticket is rendered only when status is `CONFIRMED` or `IN_PROGRESS`
- Current mismatch:
  - UI does not render the real backend QR hash as a true scannable QR payload

### 8. Operator scans QR or uses manual check-in
- QR endpoint:
  - `POST /api/v1/operator/delivery/:reservationId/scan-qr`
- Manual override:
  - `PATCH /api/v1/operator/delivery/:reservationId/checkin`
- Shared outcome:
  - reservation becomes `IN_PROGRESS`
  - vehicle becomes `RENTED`
  - operator delivery SSE emits `DELIVERY_UPDATE`

### 9. Reservation enters `IN_PROGRESS`
- Customer meaning:
  - handoff happened
- Operator meaning:
  - active rental

### 10. Operator completes reservation
- Endpoint:
  - `PATCH /api/v1/reservations/:reservationId/complete`
- Effects:
  - reservation becomes `COMPLETED`
  - vehicle can return to `AVAILABLE` if no other confirmed/in-progress reservations remain

### 11. Final state
- Success path:
  - `COMPLETED`
- Failure/abort paths:
  - `CANCELLED` from expiry, payment failure, payment cancel, capture failure compensation, or explicit cancel

## Event / Queue Timeline
- Reservation create:
  - queue `reservation-expiry`
- Second document approval:
  - queue `capture-stripe`
  - customer SSE `DOCUMENT_STATUS_UPDATE`
  - customer SSE `RESERVATION_STATUS_UPDATE(AWAITING_CAPTURE)`
- Capture success:
  - customer SSE `RESERVATION_STATUS_UPDATE(CONFIRMED)`
- Handoff:
  - operator SSE `DELIVERY_UPDATE`

## Important Verified Details
- Stripe capture is outside DB transactions.
- Stripe webhook processing is idempotent via `stripe_webhook_logs`.
- Reservation expiry cancels `PENDING_DEPOSIT` reservations and then cancels the PaymentIntent outside the transaction.

## Flow Risks
- `Critical`: customer smart ticket is not contract-compatible with operator QR scanning.
- `High`: `AWAITING_CAPTURE` creates QR hash before capture is complete; safe in current customer UI, but sensitive raw backend data exists early.
- `High`: capture failure compensation cancels reservation after both docs were approved, which may create confusing customer/operator messaging unless surfaced clearly.
