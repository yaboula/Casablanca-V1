# Operator Gaps And Risks

## Critical

### Customer shell leaks privileged reservation access
- Frontend customer routes use `requireAuthenticatedUser()` instead of customer-only role gating.
- Backend `GET /api/v1/reservations/my` deliberately returns all reservations for `OPERATOR` and `ADMIN`.
- Result: operator/admin users can enter `/dashboard` and consume a customer shell backed by all reservations.

### Smart ticket and operator QR scan contracts do not match
- Operator scan endpoint expects `qrCodeHash`.
- Customer ticket UI renders a decorative faux-QR based on `reservation.id` and never exposes the real backend QR payload.
- Real scan-based handoff cannot work as advertised.

### SSE proxy likely breaks live updates
- Both operator and customer SSE hooks point to Next catch-all `/api/v1/...`.
- The proxy reads upstream responses as `text()` and wraps them in `NextResponse`, which does not preserve ongoing event streaming.
- “Live updates active” is therefore likely false in production behavior.

### Operator delivery detail lifecycle is broken after handoff
- Detail page fetches from `GET /operator/deliveries`, which only returns same-day `CONFIRMED` reservations.
- After check-in, reservation becomes `IN_PROGRESS` and disappears from the source list.
- Page can 404 after successful handoff, preventing reliable completion flow.

## High

### Concurrency risk on document rejection
- `approveDocument()` uses transaction + pessimistic lock.
- `rejectDocument()` does not.
- Two operators can race approve vs reject on the same pending document.

### Overexposed data in operator search
- `GET /api/v1/operator/search` returns raw `Reservation` entities.
- That likely includes `stripeClientSecret`, `stripePaymentIntentId`, `qrCodeHash`, customer contact data, and other fields not needed for search results.

### Operator delivery list exposes `qrCodeHash`
- `GET /api/v1/operator/deliveries` includes `qrCodeHash` in every row.
- That is stronger disclosure than the dashboard needs.

### Staff can subscribe to customer reservation SSE
- `/api/v1/sse/reservation/:id` only enforces ownership for `USER`.
- Operators/admins can subscribe to any reservation stream if they know the ID.

### Payment copy mismatch
- Backend authorizes deposit only.
- `ConfirmationView` states “Total authorized checkout hold” as rental total + deposit.
- Risk of misleading customers and operators about what Stripe has actually authorized.

## Medium

### Multi-instance stale data risk
- SSE service is in-memory only.
- Multi-instance deployment would partition events by node.

### Document queue staleness between operators
- No operator-facing document SSE.
- Queue refresh occurs only after local actions or manual refresh.

### Customer/operator state mismatch risk around `AWAITING_CAPTURE`
- QR hash exists before `CONFIRMED`.
- Customer UI hides it correctly today, but backend raw data is already populated.

### Missing audit on manual check-in and completion
- Document review writes immutable audit logs.
- Manual handoff override and completion do not.

### Airport-floor operational risk
- Manual check-in requires only a browser confirm dialog.
- No required reason, no second-person control, no immutable override record.

## Low

### Public `Staff access` footer link
- Not inherently unsafe because backend/frontend role guards still apply.
- Could attract unnecessary probing traffic.

### Document queue customer label fallback to email
- If full name is absent, UI can display email instead.
- More identity exposure than necessary for a review queue.

## Missing Tests
- No integration tests found for:
  - operator controller endpoints
  - operator document review concurrency
  - operator delivery scan/check-in lifecycle
  - SSE end-to-end behavior through the Next proxy
  - customer smart ticket vs operator scan compatibility
- Existing coverage is stronger around:
  - reservation creation/cancel basics
  - admin role update basics
  - document service unit behaviors
  - Stripe webhook and BullMQ processor unit behaviors

## Contract Match Verdict
- Backend/frontend contracts do **not** fully match.
- Biggest mismatches:
  - ticket QR payload
  - delivery detail lifecycle
  - SSE transport path
  - payment authorization copy
