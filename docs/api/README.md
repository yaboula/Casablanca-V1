# NEXUS — Backend Engineering Documentation

> **Audience**: Senior backend engineers responsible for implementing the NEXUS server-side API.  
> **Frontend stack**: Next.js App Router · React 19 · Zustand · Stripe  
> **Last updated**: Based on completed frontend `v1.0.0`

---

## Overview

NEXUS is a premium car-rental platform operating exclusively at **Casablanca Mohammed V Airport (CMN)**, Morocco. Customers book vehicles online, pay a 10 € deposit via Stripe, complete a document check-in (passport + driving licence), and receive approval from an operator before picking up their vehicle.

The frontend is fully implemented and currently runs against **mock data**. Your task is to build the real backend API that the frontend will call.

---

## Document Index

| # | File | Topic |
|---|------|-------|
| 01 | [01-data-models.md](./01-data-models.md) | Database schema, domain entities, field constraints |
| 02 | [02-api-endpoints.md](./02-api-endpoints.md) | Full REST API contract — all routes the frontend expects |
| 03 | [03-auth-and-roles.md](./03-auth-and-roles.md) | Authentication, JWT/session strategy, role permission matrix |
| 04 | [04-booking-flow.md](./04-booking-flow.md) | End-to-end reservation lifecycle, status machine |
| 05 | [05-document-upload.md](./05-document-upload.md) | Identity check-in flow, S3 upload, operator review workflow |
| 06 | [06-payment.md](./06-payment.md) | Stripe integration, deposit capture, balance collection |
| 07 | [07-chat-system.md](./07-chat-system.md) | In-app messaging API, WebSocket spec, operator panel |
| 08 | [08-environment-variables.md](./08-environment-variables.md) | All required env vars with descriptions and examples |
| 09 | [09-qr-and-smart-ticket.md](./09-qr-and-smart-ticket.md) | QR code generation, hash format, validation at pickup |

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Customer Browser                          │
│   Next.js App Router (Vercel / Node server)                  │
│   ├── /api/chat           → POSTs chat messages             │
│   ├── /api/auth/**        → NextAuth session management      │
│   └── /api/proxy          → Operator auth proxy             │
└──────────────────┬───────────────────────────────────────────┘
                   │  HTTP / WebSocket
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                 Backend REST API                              │
│   (Technology choice: yours — Node/Express, NestJS, etc.)    │
│                                                               │
│   Modules:                                                    │
│   ├── Auth (NextAuth adapter or custom JWT)                   │
│   ├── Vehicles (CRUD + availability)                          │
│   ├── Reservations (lifecycle + status machine)               │
│   ├── Documents (upload presigned URLs + review)              │
│   ├── Payments (Stripe webhooks + balance tracking)           │
│   ├── Chat (persist + operator notifications)                 │
│   └── QR (generation + validation)                           │
└──────────────────┬───────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
     PostgreSQL         AWS S3
   (primary store)   (document images)
```

---

## Core Business Rules

1. **One active reservation per user** — a user cannot have two simultaneous `CONFIRMED` or `IN_PROGRESS` reservations.
2. **Deposit is always 10 EUR** — hardcoded, collected via Stripe at time of booking.
3. **Balance = totalPrice − 10 EUR** — collected physically at pickup.
4. **Reservation becomes `CONFIRMED` only after deposit payment** — Stripe webhook triggers the status change.
5. **Check-in requires both documents** — PASSPORT + DRIVING_LICENSE must both be `APPROVED` before generating a QR ticket.
6. **Availability window** — bookings can be made up to 30 days in advance from today.
7. **Pickup locations**: only `CMN_T1` (Terminal 1) and `CMN_T2` (Terminal 2).
8. **Pricing in EUR** — all prices stored and computed in EUR. MAD conversion (rate: 10.8) is display-only on the frontend; the backend never sees MAD.

---

## Roles Summary

| Role | Access |
|------|--------|
| `USER` | Book vehicles, upload documents, view own reservations/tickets |
| `OPERATOR` | Review documents, approve/reject, manage reservations, read chat |
| `ADMIN` | Full access: manage fleet, users, operators, config |

See [03-auth-and-roles.md](./03-auth-and-roles.md) for full permission matrix.

---

## Key Constants (reproduced from frontend source)

```typescript
DEPOSIT_AMOUNT_EUR        = 10
EUR_TO_MAD_RATE           = 10.8   // display-only, backend ignores MAD
DOCUMENT_POLLING_INTERVAL = 30_000 // ms — frontend polls document status
```

---

## Contact & Coordination

All questions about frontend behaviour or API contract expectations should be directed to the frontend team. The source of truth for expected request/response shapes is [02-api-endpoints.md](./02-api-endpoints.md).
