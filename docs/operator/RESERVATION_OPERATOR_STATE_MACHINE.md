# Reservation / Operator State Machine

## Reservation Statuses

### `PENDING_DEPOSIT`
- Customer meaning:
  - Reservation row exists.
  - Deposit authorization or confirmation is still pending.
  - Customer can still cancel own reservation.
- Operator meaning:
  - Not ready for handoff.
  - Operator can review documents if customer uploaded them.
- Admin meaning:
  - Reservation is open but not confirmed.
- Allowed customer actions:
  - Complete deposit authorization
  - Upload/replace documents
  - Cancel own reservation
- Allowed operator actions:
  - Approve/reject documents
- Blocked actions:
  - QR handoff
  - Completion
- Payment implications:
  - Manual-capture PaymentIntent exists after creation
  - Authorized amount is currently deposit only (`totalDueNowEurCents`)
- Document implications:
  - Uploads allowed
  - Documents move through `PENDING_REVIEW`
- Ticket/QR implications:
  - No usable customer ticket
  - `qrCodeHash` is still null until both docs are approved
- Next possible statuses:
  - `AWAITING_CAPTURE`
  - `CANCELLED`

### `AWAITING_CAPTURE`
- Customer meaning:
  - Documents are approved and payment capture is being processed.
- Operator meaning:
  - Review is complete; wait for backend payment capture to finish.
- Admin meaning:
  - Reservation is in a payment-processing intermediate state.
- Allowed customer actions:
  - Wait and refresh
- Allowed operator actions:
  - None meaningful through operator UI
- Blocked actions:
  - Handoff
  - Completion
  - Document upload through normal customer flow
- Payment implications:
  - BullMQ `capture-stripe` job is queued or retrying
  - Permanent capture failure compensates to `CANCELLED`
- Document implications:
  - Both required documents are already `APPROVED`
- Ticket/QR implications:
  - `qrCodeHash` is already generated on the reservation
  - Customer UI still keeps ticket unavailable because status is not yet `CONFIRMED`
- Next possible statuses:
  - `CONFIRMED`
  - `CANCELLED`

### `CONFIRMED`
- Customer meaning:
  - Reservation is confirmed and handoff can be prepared.
  - Customer can access waiting room/ticket flow.
- Operator meaning:
  - Delivery can appear in the operator dashboard on the pickup day.
- Admin meaning:
  - Reservation is active and can still be cancelled/refunded by staff.
- Allowed customer actions:
  - View ticket/waiting room
  - Upload documents remains technically allowed by `DocumentsService`
- Allowed operator actions:
  - Scan QR
  - Manual check-in
  - Cancel reservation
- Blocked actions:
  - Completion before check-in
- Payment implications:
  - Capture succeeded or webhook safety-net confirmed it
- Document implications:
  - Normal path expects both docs approved already
  - Backend still allows doc upload/replace in this status
- Ticket/QR implications:
  - Customer ticket is shown
  - Operator delivery list includes `qrCodeHash`
- Next possible statuses:
  - `IN_PROGRESS`
  - `CANCELLED`

### `IN_PROGRESS`
- Customer meaning:
  - Vehicle has been handed over.
- Operator meaning:
  - Rental is active; operator should eventually complete on return.
- Admin meaning:
  - Reservation is live.
- Allowed customer actions:
  - View active trip states
- Allowed operator actions:
  - Complete reservation
- Blocked actions:
  - QR scan/check-in again
  - Cancellation
- Payment implications:
  - Capture already succeeded
- Document implications:
  - Review complete
- Ticket/QR implications:
  - Ticket remains conceptually valid for reference only
- Next possible statuses:
  - `COMPLETED`

### `COMPLETED`
- Customer meaning:
  - Rental is finished.
- Operator meaning:
  - No more handoff actions
- Admin meaning:
  - Historical record
- Allowed customer actions:
  - Historical viewing
- Allowed operator actions:
  - None
- Blocked actions:
  - Check-in
  - Completion again
  - Cancellation
- Payment implications:
  - No further payment transitions in current code
- Document implications:
  - Historical only
- Ticket/QR implications:
  - Ticket no longer operationally relevant
- Next possible statuses:
  - None

### `CANCELLED`
- Customer meaning:
  - Reservation is closed
- Operator meaning:
  - Do not proceed with handoff
- Admin meaning:
  - Closed/cancelled record
- Allowed customer actions:
  - Browse/create a new booking
- Allowed operator actions:
  - None through operator flow
- Blocked actions:
  - Approval-to-handoff flow
  - Completion
- Payment implications:
  - Pending or awaiting-capture reservations may cancel PI
  - Confirmed cancellations trigger refund attempt
- Document implications:
  - Uploads blocked
- Ticket/QR implications:
  - Ticket should not be shown as usable
- Next possible statuses:
  - None

## Document Statuses

### `PENDING_REVIEW`
- Customer meaning:
  - File uploaded and waiting for operator decision
- Operator action:
  - Approve or reject
- Effect on reservation:
  - No reservation status change until both required docs are approved
- Effect on payment/capture:
  - No capture trigger yet
- Effect on smart ticket / QR unlock:
  - None

### `APPROVED`
- Customer meaning:
  - This document is accepted
- Operator action:
  - No further action unless another doc still pending
- Effect on reservation:
  - If both passport and driving licence are approved while reservation is `PENDING_DEPOSIT`, reservation moves to `AWAITING_CAPTURE`
- Effect on payment/capture:
  - Second required approval enqueues `capture-stripe`
- Effect on smart ticket / QR unlock:
  - Second required approval generates `qrCodeHash`, but customer ticket still waits for `CONFIRMED`

### `REJECTED`
- Customer meaning:
  - Re-upload required
- Operator action:
  - Provide reason
- Effect on reservation:
  - Reservation status stays unchanged
- Effect on payment/capture:
  - No capture
- Effect on smart ticket / QR unlock:
  - No unlock

## Verified Transition Table
- `PENDING_DEPOSIT -> AWAITING_CAPTURE`
- `PENDING_DEPOSIT -> CANCELLED`
- `AWAITING_CAPTURE -> CONFIRMED`
- `AWAITING_CAPTURE -> CANCELLED`
- `CONFIRMED -> IN_PROGRESS`
- `CONFIRMED -> CANCELLED`
- `IN_PROGRESS -> COMPLETED`

## State Machine Findings
- `Verified`: QR hash is generated before capture succeeds, not after `CONFIRMED`.
- `High risk`: customer/marketing copy sometimes implies “documents after payment verified,” but backend allows customer doc upload in both `PENDING_DEPOSIT` and `CONFIRMED`.
- `High risk`: operator detail frontend cannot reliably represent the full state machine because it only fetches same-day confirmed deliveries.
