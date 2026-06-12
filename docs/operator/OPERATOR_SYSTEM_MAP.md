# Operator System Map

## Scope
- Project: `Casablanca-V1`
- Audit basis: code inspection only, no behavior changes
- Backend API prefix: `/api/v1`
- Customer role name in backend code: `USER`
- Requested business role label `CUSTOMER` maps to backend `USER`

## Evidence Levels
- `Verified`: directly confirmed in code
- `Inferred`: consistent with code but not enforced end-to-end
- `Unknown`: missing from code or needs product/business confirmation

## High-Level Operator Workflow
1. Customer authenticates and creates a reservation through `POST /api/v1/reservations`.
2. Backend recalculates pricing, creates a manual-capture Stripe PaymentIntent, stores reservation as `PENDING_DEPOSIT`, and enqueues a 15-minute expiry job.
3. Customer authorizes the Stripe payment from `/reservations/[id]/confirmed`.
4. Customer uploads passport and driving licence through `POST /api/v1/documents/presign` and `POST /api/v1/documents/confirm`.
5. Operator reviews pending documents in `/operator/documents`.
6. First approval only marks the document `APPROVED`.
7. Second approval marks the reservation `AWAITING_CAPTURE`, generates `qrCodeHash`, emits customer SSE, and enqueues the BullMQ `capture-stripe` job.
8. `capture-stripe` captures the PaymentIntent outside the DB transaction, updates the reservation to `CONFIRMED`, and emits customer SSE again.
9. Customer waiting room moves from review state to ready state; customer ticket UI becomes available when reservation status is `CONFIRMED` or `IN_PROGRESS`.
10. Operator delivery dashboard shows confirmed same-day deliveries.
11. Operator performs QR scan or manual check-in, moving the reservation to `IN_PROGRESS` and the vehicle to `RENTED`.
12. Operator completes the reservation with `PATCH /api/v1/reservations/:id/complete`, moving it to `COMPLETED` and possibly returning the vehicle to `AVAILABLE`.

## Backend Modules Involved
- `auth`
  - `auth.controller.ts`, `auth.service.ts`
  - JWT auth, refresh rotation by `tokenVersion`
- `users`
  - `user.entity.ts`, `users.controller.ts`, `users.service.ts`
  - Role source of truth: `USER | OPERATOR | ADMIN`
- `common`
  - `roles.decorator.ts`, `roles.guard.ts`, `jwt-auth.guard.ts`
- `reservations`
  - `reservation.entity.ts`, `reservations.controller.ts`, `reservations.service.ts`, `reservation-policy.ts`, `pricing.service.ts`
- `documents`
  - `reservation-document.entity.ts`, `documents.controller.ts`, `documents.service.ts`
- `operator`
  - `operator.controller.ts`, `operator.service.ts`
  - `services/operator-delivery.service.ts`
  - `services/operator-document.service.ts`
  - `services/operator-search.service.ts`
  - `audit-log.entity.ts`
  - `processors/capture-stripe.processor.ts`
  - `processors/reservation-expiry.processor.ts`
- `stripe`
  - `stripe.service.ts`, `webhooks.controller.ts`, `webhooks.service.ts`
- `qr`
  - `qr.service.ts`
- `sse`
  - `sse.controller.ts`, `sse.service.ts`
- `admin`
  - role/user/vehicle admin endpoints that shape staff boundaries

## Frontend Operator/Staff Surface

### Operator Pages
- `/operator/dashboard`
  - Server-side role gate: `requireRouteRole(["OPERATOR", "ADMIN"])`
  - Data sources:
    - `GET /api/v1/operator/deliveries`
    - `GET /api/v1/operator/deliveries/stats`
  - Live update hook:
    - `useOperatorDeliveriesSse()` -> `/api/v1/sse/operator/deliveries`
- `/operator/documents`
  - Server-side role gate: `requireRouteRole(["OPERATOR", "ADMIN"])`
  - Data source:
    - `GET /api/v1/operator/documents/pending`
  - Mutations:
    - `PATCH /api/v1/operator/documents/:id/approve`
    - `PATCH /api/v1/operator/documents/:id/reject`
- `/operator/delivery/[reservationId]`
  - Server-side role gate: `requireRouteRole(["OPERATOR", "ADMIN"])`
  - Current detail data source:
    - no dedicated detail endpoint
    - frontend fetches `GET /api/v1/operator/deliveries` and finds the ID in today’s confirmed list
  - Mutations:
    - `POST /api/v1/operator/delivery/:reservationId/scan-qr`
    - `PATCH /api/v1/operator/delivery/:reservationId/checkin`
    - `PATCH /api/v1/reservations/:reservationId/complete`

### Shared Staff Entry Points
- `SessionNav` adds `Operator` link for `OPERATOR` or `ADMIN`
- `SessionNav` adds `Admin` link for `ADMIN`
- Root footer exposes a public `Staff access` link to `/operator/dashboard`

## Customer Flow Connections To Operator Actions

### Reservation Creation To Payment Authorization
- `POST /api/v1/reservations` always recalculates pricing on the backend.
- `PricingService` sets:
  - `depositEurCents = 1000`
  - `totalDueNowEurCents = 1000`
- `StripeService.createPaymentIntent()` authorizes only `totalDueNowEurCents`.
- Verified implication: the current backend authorizes only the deposit, not total rental + deposit.

### Payment Authorization To Document Review
- Confirmation UI mounts Stripe Elements when reservation is `PENDING_DEPOSIT`.
- After authorization, frontend expects reservation to remain pending until backend confirmation catches up.
- Customer then proceeds to `/reservations/[id]/check-in` to upload required documents.

### Document Upload To Approval
- `DocumentsService.presign()` and `confirm()` allow uploads only when reservation is `PENDING_DEPOSIT` or `CONFIRMED`.
- Every confirmed upload is stored as `PENDING_REVIEW`.
- `/operator/documents` consumes the pending-review queue and exposes presigned read URLs to operators.

### Approval To Smart Ticket
- When both required docs are approved:
  - reservation moves `PENDING_DEPOSIT -> AWAITING_CAPTURE`
  - `qrCodeHash` is generated immediately
  - `capture-stripe` job is queued
- After capture succeeds:
  - reservation moves `AWAITING_CAPTURE -> CONFIRMED`
  - customer SSE emits reservation status
- Customer ticket page becomes available based on status, not on direct operator confirmation.

### Handoff To Completion
- Operator dashboard only lists same-day `CONFIRMED` deliveries.
- QR scan or manual check-in moves reservation to `IN_PROGRESS`.
- Completion moves `IN_PROGRESS -> COMPLETED`.

## Reservation And Document Lifecycle Map

### From Upload To Approval To Pickup
1. Customer uploads docs to S3 via presigned URL.
2. Backend `confirm()` creates or replaces document row as `PENDING_REVIEW`.
3. Operator reviews queue.
4. Approval path:
   - first doc approved: document only
   - second doc approved: reservation becomes `AWAITING_CAPTURE`, QR hash created, Stripe capture queued
5. Stripe capture success sets reservation `CONFIRMED`.
6. Customer waiting room/ticket react to updated reservation state.
7. Operator handoff uses QR or manual check-in.

### From Payment Authorization To Handoff/Completion
1. Reservation creation authorizes deposit via manual-capture PaymentIntent.
2. Reservation stays `PENDING_DEPOSIT`.
3. Document approval gates the transition to `AWAITING_CAPTURE`.
4. BullMQ capture is the only normal capture path.
5. Webhook `payment_intent.succeeded` acts as an idempotent safety-net to force `CONFIRMED` if the processor failed after Stripe capture.
6. Operator delivers vehicle and later completes rental.

## Assumptions Discovered In Code
- `Verified`: backend considers `USER` the customer role; no `CUSTOMER` enum exists.
- `Verified`: operator/admin can access `GET /api/v1/reservations/my` and receive all reservations.
- `Verified`: operator/admin can access `GET /api/v1/reservations/:id` and `GET /api/v1/documents/:reservationId` for any reservation.
- `Verified`: operator dashboard and detail are built around same-day confirmed pickups only.
- `Inferred`: the intended airport handoff flow is “operator meets customer at terminal, verifies identity physically, then releases vehicle.”
- `Inferred`: manual check-in is a deliberate override for lost-ticket situations, but no additional approval/audit step is enforced.
- `Verified`: SSE is implemented with in-memory `Subject`s, so it is single-instance only.

## Unknowns Requiring Product Or Business Decisions
- Whether operators should be allowed to access the generic customer dashboard at all.
- Whether admins should inherit operator/customer UI access or have separate shells.
- Whether QR should be an actual scanable payload or only a reference string for manual comparison.
- Whether manual check-in should require a reason, second approval, or audit log entry.
- Whether document rejection should notify only the customer waiting room or also other operator sessions.
- Whether post-handoff operator detail pages must support `IN_PROGRESS` and `COMPLETED` reservations.
- Whether multi-instance deployment is planned; if yes, current SSE implementation is insufficient.
- Whether deposit-only authorization is the intended payment model, because some UI copy implies a broader checkout hold.
