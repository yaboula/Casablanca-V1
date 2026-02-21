# 01 — Data Models

> Canonical definitions for every domain entity. All types are derived directly from `src/types/index.ts` and `src/stores/*.ts`.

---

## Table of Contents

1. [Enumerations](#1-enumerations)
2. [User](#2-user)
3. [Vehicle](#3-vehicle)
4. [Reservation](#4-reservation)
5. [ReservationDocument](#5-reservationdocument)
6. [ChatMessage](#6-chatmessage)
7. [BookingDraft (frontend state reference)](#7-bookingdraft-frontend-state-reference)
8. [Suggested Database Schema (PostgreSQL)](#8-suggested-database-schema-postgresql)

---

## 1. Enumerations

### `UserRole`
```
USER      — standard customer, can book and upload documents
OPERATOR  — NEXUS staff, reviews documents and manages reservations
ADMIN     — full system access
```

### `ReservationStatus`
```
PENDING_DEPOSIT  — reservation created, deposit not yet paid
CONFIRMED        — deposit paid (Stripe webhook confirmed)
IN_PROGRESS      — vehicle has been picked up
COMPLETED        — vehicle returned and rental closed
CANCELLED        — reservation cancelled (by user or operator)
```

Status transitions:
```
PENDING_DEPOSIT → CONFIRMED    (via Stripe webhook: charge.succeeded)
CONFIRMED       → IN_PROGRESS  (operator action: marks vehicle as picked up)
IN_PROGRESS     → COMPLETED    (operator action: marks return confirmed)
PENDING_DEPOSIT → CANCELLED    (user cancels before paying, or payment fails)
CONFIRMED       → CANCELLED    (operator or user cancels after deposit)
```

### `DocumentStatus`
```
PENDING_REVIEW  — uploaded, awaiting operator review
APPROVED        — operator approved the document
REJECTED        — operator rejected with a reason
```

### `VehicleCategory`
```
SEDAN    — standard saloon cars
SUV      — sport utility vehicles
LUXURY   — premium/luxury segment
COMPACT  — small city cars
```

### `PickupLocation`
```
CMN_T1  — Mohammed V Airport, Terminal 1
CMN_T2  — Mohammed V Airport, Terminal 2
```
Display labels: `{ CMN_T1: "CMN · Terminal 1", CMN_T2: "CMN · Terminal 2" }`

### `Currency` (display only)
```
EUR  — Euro (primary — all prices stored in EUR)
MAD  — Moroccan Dirham (display conversion only, rate: 10.8)
```
> ⚠️ The backend must always store and transact in **EUR**. MAD conversion is purely a client-side display feature.

---

## 2. User

### TypeScript interface (from `src/types/index.ts`)
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole; // "USER" | "OPERATOR" | "ADMIN"
}
```

### Field notes
| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string/uuid | Primary key, immutable |
| `email` | string | Unique, validated, lowercase |
| `fullName` | string | Required, max 120 chars |
| `phoneNumber` | string | International format preferred, e.g. `+212612345678` |
| `role` | enum | Default: `USER` |

### PostgreSQL table
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  full_name    TEXT NOT NULL,
  phone_number TEXT,
  role         TEXT NOT NULL DEFAULT 'USER'
                  CHECK (role IN ('USER', 'OPERATOR', 'ADMIN')),
  password_hash TEXT,                      -- null if OAuth-only
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Vehicle

### TypeScript interface
```typescript
interface Vehicle {
  id: string;
  model: string;
  brand: string;
  category: VehicleCategory; // "SEDAN" | "SUV" | "LUXURY" | "COMPACT"
  pricePerDay: number;        // EUR
  currency: "EUR";            // always EUR
  imageUrl: string;           // primary image URL
  imageUrls?: string[];       // gallery (2–4 images)
  transmission: "AUTOMATIC" | "MANUAL";
  seats: number;
  luggageCount: number;
  features: string[];         // e.g. ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo"]
  isAvailable: boolean;
}
```

### Mock fleet (current seed data from `src/lib/mock-data.ts`)

| id | Brand | Model | Category | Price/day (EUR) | Transmission |
|----|-------|-------|----------|-----------------|-------------|
| v1 | Audi | A4 | SEDAN | 160 | AUTOMATIC |
| v2 | Mercedes | Clase C | SEDAN | 190 | AUTOMATIC |
| v3 | Hyundai | Tucson | SUV | 120 | AUTOMATIC |
| v4 | BMW | Serie 3 | LUXURY | 220 | AUTOMATIC |
| v5 | Renault | Clio | COMPACT | 65 | MANUAL |
| v6 | Land Rover | Range Rover Evoque | SUV | 280 | AUTOMATIC |

> These mock records must be seeded in the database on first deployment.

### Standard features (common values to expect)
- `"SIM 5GB"` — included SIM card data
- `"Tag Jawaz"` — Moroccan motorway toll transponder
- `"Seguro Todo Riesgo"` — full comprehensive insurance
- `"Sin límite km"` — unlimited mileage
- `"GPS integrado"` — built-in GPS navigation

### PostgreSQL table
```sql
CREATE TABLE vehicles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model          TEXT NOT NULL,
  brand          TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('SEDAN', 'SUV', 'LUXURY', 'COMPACT')),
  price_per_day  NUMERIC(10,2) NOT NULL,          -- EUR
  currency       TEXT NOT NULL DEFAULT 'EUR',
  image_url      TEXT NOT NULL,
  image_urls     TEXT[],                           -- gallery
  transmission   TEXT NOT NULL CHECK (transmission IN ('AUTOMATIC', 'MANUAL')),
  seats          INTEGER NOT NULL,
  luggage_count  INTEGER NOT NULL,
  features       TEXT[] NOT NULL DEFAULT '{}',
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4. Reservation

### TypeScript interface
```typescript
interface Reservation {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;          // optionally joined
  pickupDate: string;         // ISO 8601, e.g. "2025-08-15T10:00:00.000Z"
  returnDate: string;         // ISO 8601
  pickupLocation: PickupLocation; // "CMN_T1" | "CMN_T2"
  totalDays: number;
  totalPriceEUR: number;      // pricePerDay × totalDays
  depositPaidEUR: number;     // always 10
  balanceDueEUR: number;      // totalPriceEUR − 10
  status: ReservationStatus;
  qrCodeHash: string | null;  // null until documents approved
  customerName?: string;
  customerPhone?: string;
}
```

### Derived fields (computed, not stored)
- `totalDays` = `(returnDate − pickupDate)` in full calendar days
- `balanceDueEUR` = `totalPriceEUR − depositPaidEUR` — **must be recalculated server-side, not trusted from client**

### Constraints
- `depositPaidEUR` is always `10`. Never variable.
- `totalPriceEUR` must equal `vehicle.pricePerDay × totalDays`.
- `pickupDate` must be ≥ today. `returnDate` must be > `pickupDate`.
- `qrCodeHash` is set by the server after **both** documents are `APPROVED`.

### PostgreSQL table
```sql
CREATE TABLE reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  vehicle_id       UUID NOT NULL REFERENCES vehicles(id),
  pickup_date      TIMESTAMPTZ NOT NULL,
  return_date      TIMESTAMPTZ NOT NULL,
  pickup_location  TEXT NOT NULL CHECK (pickup_location IN ('CMN_T1', 'CMN_T2')),
  total_days       INTEGER NOT NULL,
  total_price_eur  NUMERIC(10,2) NOT NULL,
  deposit_paid_eur NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  balance_due_eur  NUMERIC(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING_DEPOSIT'
                      CHECK (status IN (
                        'PENDING_DEPOSIT','CONFIRMED','IN_PROGRESS',
                        'COMPLETED','CANCELLED'
                      )),
  qr_code_hash     TEXT,                            -- null until docs approved
  customer_name    TEXT,
  customer_phone   TEXT,
  stripe_payment_intent_id TEXT,                    -- from Stripe
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (return_date > pickup_date),
  CHECK (balance_due_eur = total_price_eur - deposit_paid_eur)
);
```

---

## 5. ReservationDocument

### TypeScript interface
```typescript
interface ReservationDocument {
  id: string;
  userId: string;
  reservationId: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  fileUrl: string;           // presigned S3 URL (time-limited, for display)
  status: DocumentStatus;   // "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  rejectionReason?: string; // set when status = "REJECTED"
  reviewedAt?: string;      // ISO 8601, set when approved or rejected
}
```

### Notes
- Each reservation requires exactly **two** documents: one `PASSPORT` and one `DRIVING_LICENSE`.
- `fileUrl` returned to the client must be a **presigned S3 URL** (short TTL, e.g. 15 minutes) — never expose the raw S3 key.
- When operator rejects a document, they must provide a `rejectionReason` string. The frontend displays this message to the customer on the waiting-room screen.
- After rejection, the customer returns to `/check-in?reservationId=X&retry=true` to re-upload.

### PostgreSQL table
```sql
CREATE TABLE reservation_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  reservation_id    UUID NOT NULL REFERENCES reservations(id),
  type              TEXT NOT NULL CHECK (type IN ('PASSPORT', 'DRIVING_LICENSE')),
  s3_key            TEXT NOT NULL,             -- internal S3 key (never sent to client)
  status            TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
                       CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES users(id), -- operator user id
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (reservation_id, type)               -- one per doc type per reservation
);
```

---

## 6. ChatMessage

### TypeScript interface (from `src/stores/useChatStore.ts`)
```typescript
interface ChatMessage {
  id: string;           // UUID, generated client-side
  text: string;
  sender: "user" | "operator" | "system";
  timestamp: number;    // epoch milliseconds
  status: "sending" | "sent" | "delivered" | "read" | "error";
}
```

### Notes
- `id` is generated by the **client** and submitted with the request. The backend should use it for idempotency (deduplicate retries).
- `sender = "system"` is reserved for automated messages (welcome, status updates).
- `status` transitions: `sending → sent → delivered → read` — backend controls `delivered` and `read` states.

### PostgreSQL table
```sql
CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY,          -- client-generated, idempotency key
  user_id        UUID NOT NULL REFERENCES users(id),
  reservation_id UUID REFERENCES reservations(id),
  text           TEXT NOT NULL,
  sender         TEXT NOT NULL CHECK (sender IN ('user', 'operator', 'system')),
  status         TEXT NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sending','sent','delivered','read','error')),
  timestamp      BIGINT NOT NULL,           -- epoch ms, from client
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. BookingDraft (frontend state reference)

This is **not a server entity** — it lives in `sessionStorage` under key `nexus-booking`. Provided here so backend engineers understand the data shape submitted at checkout.

```typescript
interface BookingDraft {
  pickupDate: number | null;          // epoch ms
  returnDate: number | null;          // epoch ms
  pickupLocation: PickupLocation;
  selectedVehicleId: string | null;
  selectedVehiclePricePerDay: number; // EUR
  reservationId: string | null;       // set after POST /reservations
  // derived (not persisted):
  totalDays: number | null;
  totalPriceEUR: number | null;
}
```

> ⚠️ The backend must **recalculate** `totalDays` and `totalPriceEUR` from the submitted dates and the vehicle's stored price — **never trust client-computed totals**.

---

## 8. Suggested Database Schema (PostgreSQL)

Full ERD relationships:

```
users ──< reservations >── vehicles
 │              │
 │              └──< reservation_documents
 │
 └──< chat_messages
```

### Indexing recommendations
```sql
-- Fast reservation lookups by user
CREATE INDEX idx_reservations_user_id ON reservations(user_id);

-- Operator dashboard: filter by status
CREATE INDEX idx_reservations_status ON reservations(status);

-- Document review queue
CREATE INDEX idx_documents_status ON reservation_documents(status);
CREATE INDEX idx_documents_reservation ON reservation_documents(reservation_id);

-- Chat queries
CREATE INDEX idx_chat_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_timestamp ON chat_messages(timestamp DESC);
```
