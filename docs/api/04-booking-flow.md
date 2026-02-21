# 04 — Booking Flow

> End-to-end reservation lifecycle: from vehicle selection to vehicle return.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Step-by-Step Flow](#2-step-by-step-flow)
3. [Reservation Status Machine](#3-reservation-status-machine)
4. [Frontend State (sessionStorage)](#4-frontend-state-sessionstorage)
5. [Availability Logic](#5-availability-logic)
6. [Pricing Calculation](#6-pricing-calculation)
7. [Edge Cases & Business Rules](#7-edge-cases--business-rules)

---

## 1. Overview

```
/catalog → /book → /booking (Stripe) → /check-in → /waiting-room → /smart-ticket → Pickup
```

The booking involves **two financial events**:
1. **Deposit (10 EUR)** — charged online via Stripe at time of booking confirmation
2. **Balance (totalPrice − 10 EUR)** — collected physically at vehicle pickup

---

## 2. Step-by-Step Flow

### Step 1 — Vehicle Catalogue (`/catalog`)
- Frontend calls `GET /api/vehicles?available=true`
- User can filter by category
- Each vehicle card shows `pricePerDay` in EUR (or MAD if currency toggled)
- User clicks "Reservar" → navigates to `/book` with vehicle pre-selected

### Step 2 — Date & Location Selector (`/book`)
- User picks `pickupDate`, `returnDate` (limited to 30 days from today)
- User picks `pickupLocation`: `CMN_T1` or `CMN_T2`
- Frontend computes `totalDays` and `totalPriceEUR` for display only
- State stored in `sessionStorage` under key `nexus-booking`:
  ```
  pickupDate (epoch ms), returnDate (epoch ms), pickupLocation,
  selectedVehicleId, selectedVehiclePricePerDay
  ```
- User clicks "Confirmar" → navigates to `/booking`

### Step 3 — Booking Confirmation & Payment (`/booking`)
- Frontend calls `POST /api/reservations` with date/location/vehicle details
- Backend creates reservation record with `status = PENDING_DEPOSIT`
- Backend creates Stripe PaymentIntent for 1000 cents (10 EUR)
- Backend returns `{ reservation, stripeClientSecret }`
- Frontend uses Stripe.js to collect card and confirm the PaymentIntent
- **On Stripe success** → Stripe sends webhook to `POST /api/payments/webhook`
- Webhook handler sets `status = CONFIRMED`
- Frontend stores `reservationId` in sessionStorage
- Frontend redirects to `/check-in?reservationId=XXX`

### Step 4 — Document Check-in (`/check-in`)
- User uploads PASSPORT and DRIVING_LICENSE (two-step flow)
- See [05-document-upload.md](./05-document-upload.md) for full detail

### Step 5 — Waiting Room (`/waiting-room`)
- Frontend polls `GET /api/documents/status?reservationId=XXX` every **30 seconds**
- When `allApproved = true` → navigate to `/smart-ticket?reservationId=XXX`

### Step 6 — Smart Ticket (`/smart-ticket`)
- Frontend calls `GET /api/tickets/:reservationId`
- Displays QR code (generated client-side from `qrCodeHash`), vehicle info, balance due
- User shows QR to operator at pickup

### Step 7 — Vehicle Pickup (Operator action)
- Operator scans QR → `POST /api/tickets/:id/validate`
- If valid: `status = IN_PROGRESS`, operator collects balance in cash

### Step 8 — Vehicle Return (Operator action)
- Operator marks return: `PATCH /api/operator/reservations/:id/status` with `{ status: "COMPLETED" }`
- Rental is closed

---

## 3. Reservation Status Machine

```
                    ┌────────────────┐
                    │ PENDING_DEPOSIT │  ← Created at POST /api/reservations
                    └───────┬────────┘
                            │
               Stripe webhook: payment_intent.succeeded
                            │
                    ┌───────▼──────┐
                    │  CONFIRMED   │  ← Deposit paid, awaiting check-in + operator approval
                    └───────┬──────┘
                            │
              Operator validates QR at pickup
                            │
                    ┌───────▼──────────┐
                    │   IN_PROGRESS    │  ← Vehicle is out with the customer
                    └───────┬──────────┘
                            │
              Operator confirms vehicle return
                            │
                    ┌───────▼──────┐
                    │  COMPLETED   │  ← Rental complete
                    └──────────────┘

     PENDING_DEPOSIT ──(user/operator cancels)──► CANCELLED
     CONFIRMED       ──(operator cancels)────────► CANCELLED
```

### Backend rules for status transitions
| From | To | Who can trigger | Conditions |
|------|----|-----------------|------------|
| `PENDING_DEPOSIT` | `CONFIRMED` | System (Stripe webhook) | `payment_intent.succeeded` received |
| `PENDING_DEPOSIT` | `CANCELLED` | User or Operator | Any time before payment |
| `CONFIRMED` | `IN_PROGRESS` | Operator | QR validated at pickup |
| `CONFIRMED` | `CANCELLED` | Operator | Manual cancellation (refund may apply) |
| `IN_PROGRESS` | `COMPLETED` | Operator | Vehicle returned |
| `COMPLETED` | — | Nobody | Terminal state |
| `CANCELLED` | — | Nobody | Terminal state |

---

## 4. Frontend State (sessionStorage)

Key: `nexus-booking` — persisted via Zustand `persist` middleware.

```typescript
{
  // Persisted:
  pickupDate: number | null,             // epoch ms
  returnDate: number | null,             // epoch ms
  pickupLocation: "CMN_T1" | "CMN_T2",
  selectedVehicleId: string | null,
  selectedVehiclePricePerDay: number,    // EUR
  reservationId: string | null,          // set after POST /api/reservations succeeds

  // Derived (recalculated on read, not stored):
  totalDays: number | null,
  totalPriceEUR: number | null
}
```

> The `reservationId` from the backend is stored in `sessionStorage` and passed as `?reservationId=` query param to subsequent pages (`/check-in`, `/waiting-room`, `/smart-ticket`). The backend must accept this ID in all subsequent calls.

---

## 5. Availability Logic

A vehicle is **unavailable** for a date range if it has any reservation with:
- `status` NOT IN (`CANCELLED`)
- AND `pickup_date < requestedReturnDate AND return_date > requestedPickupDate` (overlapping intervals)

### SQL availability check
```sql
SELECT COUNT(*) > 0 AS is_blocked
FROM reservations
WHERE vehicle_id = $1
  AND status NOT IN ('CANCELLED')
  AND pickup_date < $3          -- $3 = requested return date
  AND return_date > $2;         -- $2 = requested pickup date
```

If `is_blocked = TRUE`, the vehicle cannot be booked for those dates → return `400 VEHICLE_NOT_AVAILABLE`.

---

## 6. Pricing Calculation

### Server-side (authoritative)
```
totalDays   = CEIL((returnDate − pickupDate) / 86400000)
totalEUR    = vehicle.pricePerDay × totalDays
depositEUR  = 10  (always)
balanceEUR  = totalEUR − 10
```

> Example: Audi A4 (160 EUR/day) × 3 days = 480 EUR total. Deposit = 10 EUR. Balance = 470 EUR.

### Client-side (display only)
The frontend calculates these values for display in the booking form before submission. The backend **must recalculate and validate** them against the vehicle's stored price. If the client-computed total does not match the server's calculation, reject the request.

---

## 7. Edge Cases & Business Rules

| Scenario | Handling |
|----------|----------|
| User has active reservation and tries to book again | Return `409 ACTIVE_RESERVATION_EXISTS` |
| Stripe payment succeeds but webhook is delayed | Frontend should handle "pending" state; reservation remains `PENDING_DEPOSIT` until webhook arrives |
| Stripe payment fails | Set reservation `CANCELLED` on `payment_intent.payment_failed` event |
| User submits same reservation twice (double-click) | Idempotency — check if a `PENDING_DEPOSIT` reservation for same user/vehicle/dates exists within last 60s |
| Document rejected — user re-uploads | Status goes back to `PENDING_REVIEW`; old `REJECTED` document replaced |
| Operator rejects after QR generated | Rare edge case — invalidate `qrCodeHash`, set documents back to `PENDING_REVIEW` |
| Vehicle becomes unavailable after booking (admin marks it) | Do not cancel existing `CONFIRMED` reservations — only blocks new bookings |
| Pickup date comes and user is `CONFIRMED` but no QR yet | Operator can manually advance to `IN_PROGRESS` (admin bypass — document to this as a policy decision) |
