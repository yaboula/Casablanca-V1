# 06 — Payment (Stripe)

> NEXUS collects a fixed 10 EUR deposit online via Stripe at the time of booking. The remaining balance is collected in cash at the pickup desk.

---

## Table of Contents

1. [Payment Model](#1-payment-model)
2. [Stripe Integration Flow](#2-stripe-integration-flow)
3. [PaymentIntent Creation](#3-paymentintent-creation)
4. [Webhook Handling](#4-webhook-handling)
5. [Refund Policy (V1)](#5-refund-policy-v1)
6. [Database Tracking](#6-database-tracking)
7. [Testing](#7-testing)

---

## 1. Payment Model

| Item | Amount | When | Method |
|------|--------|------|--------|
| Deposit | **10 EUR** (fixed) | Online at booking | Stripe (card) |
| Balance | `totalPriceEUR − 10 EUR` | At vehicle pickup | Cash (operator collects) |

**Examples**:
| Vehicle | Days | Total | Deposit | Balance (cash) |
|---------|------|-------|---------|----------------|
| Renault Clio | 3 | 195 EUR | 10 EUR | 185 EUR |
| Audi A4 | 5 | 800 EUR | 10 EUR | 790 EUR |
| BMW Serie 3 | 2 | 440 EUR | 10 EUR | 430 EUR |

> The deposit amount (10 EUR) is hardcoded in the frontend (`DEPOSIT_AMOUNT_EUR = 10`) and must match the Stripe charge amount exactly.

---

## 2. Stripe Integration Flow

```
Frontend                      Backend                    Stripe
   │                             │                          │
   ├── POST /api/reservations ──►│                          │
   │                             ├── stripe.paymentIntents.create({
   │                             │     amount: 1000,        │
   │                             │     currency: "eur",     │
   │                             │     metadata: {...}      │
   │                             │   })                     │
   │                             │◄─────── { id, client_secret }
   │                             │                          │
   │◄── { reservation, stripeClientSecret } ───────────────│
   │                             │                          │
   │ (Stripe.js confirms payment)│                          │
   ├────────────────────────────────────────────────────── ►│
   │           (card input + confirm)                       │
   │                             │                          │
   │                             │◄── POST /api/payments/webhook
   │                             │    (payment_intent.succeeded)
   │                             │                          │
   │                             ├── reservation.status = CONFIRMED
   │                             └── store stripe_payment_intent_id
```

---

## 3. PaymentIntent Creation

### Called from inside `POST /api/reservations`

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,           // cents — always 1000 (= 10 EUR)
  currency: "eur",
  automatic_payment_methods: { enabled: true },
  metadata: {
    reservationId: reservation.id,
    userId: user.id,
    vehicleId: reservation.vehicleId,
    pickupDate: reservation.pickupDate,
  },
  description: `NEXUS deposit — Reservation ${reservation.id}`,
});
```

**Return to frontend**: `paymentIntent.client_secret`

### Stripe.js (frontend — for reference)
```javascript
const { error } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/booking/success`,
  },
});
```

---

## 4. Webhook Handling

### Endpoint
```
POST /api/payments/webhook
```

This endpoint must be publicly reachable (no auth header). Stripe sends POST requests here after payment events.

### Stripe signature verification (required)
```javascript
const sig = req.headers["stripe-signature"];
let event;
try {
  event = stripe.webhooks.constructEvent(
    rawBody,          // MUST be raw Buffer, not parsed JSON
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

> ⚠️ Use the **raw body** for signature verification. Express: use `express.raw()` on this route, not `express.json()`.

### Events to handle

#### `payment_intent.succeeded`
```javascript
case "payment_intent.succeeded": {
  const intent = event.data.object;
  const reservationId = intent.metadata.reservationId;

  await db.reservations.update({
    where: { id: reservationId },
    data: {
      status: "CONFIRMED",
      stripe_payment_intent_id: intent.id,
      deposit_paid_eur: 10,
    },
  });

  // Optionally: send confirmation email to customer
  break;
}
```

#### `payment_intent.payment_failed`
```javascript
case "payment_intent.payment_failed": {
  const intent = event.data.object;
  const reservationId = intent.metadata.reservationId;

  await db.reservations.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });
  break;
}
```

#### `charge.refunded` (V1 — logging only)
Log the refund event. No automatic action in V1.

### Response
Always respond `200` immediately:
```javascript
res.status(200).json({ received: true });
```
Stripe will retry on non-200 responses.

---

## 5. Refund Policy (V1)

| Scenario | Refund |
|----------|--------|
| Cancellation before pickup | Manual — operator initiates via Stripe Dashboard |
| No-show | No refund (policy decision) |
| Operator cancels | Full deposit refund — operator initiates |
| Payment failed (auto-cancelled) | No charge, no refund needed |

### Issuing a refund (backend endpoint — V1 optional)
```javascript
const refund = await stripe.refunds.create({
  payment_intent: reservation.stripe_payment_intent_id,
  amount: 1000,   // 10 EUR in cents
  reason: "requested_by_customer",
});
```

---

## 6. Database Tracking

The `reservations` table stores:
```sql
stripe_payment_intent_id TEXT  -- stored on CONFIRMED
deposit_paid_eur NUMERIC       -- always 10.00
```

For audit purposes, consider a separate `payments` table:
```sql
CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id          UUID NOT NULL REFERENCES reservations(id),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount_eur              NUMERIC(10,2) NOT NULL,
  status                  TEXT NOT NULL,           -- "succeeded" | "failed" | "refunded"
  stripe_event_id         TEXT,                    -- idempotency key from Stripe event
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> Use `stripe_event_id` as an idempotency key — Stripe may send the same event multiple times.

---

## 7. Testing

### Stripe test card numbers
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | 3D Secure required |

> Use expiry: any future date. CVV: any 3 digits.

### Local webhook testing
Use the Stripe CLI to forward events to your local server:
```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

This outputs a webhook signing secret for local use (set as `STRIPE_WEBHOOK_SECRET` in `.env.local`).

### Key test scenarios
1. Happy path: payment succeeds → reservation `CONFIRMED` ✅
2. Card declined: reservation remains `PENDING_DEPOSIT` → should auto-cancel after TTL
3. Webhook received twice (duplicate): idempotent — no duplicate status changes
4. Webhook signature invalid: return `400`, no DB change
