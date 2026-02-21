# 09 — QR Code & Smart Ticket

> The Smart Ticket is the customer's digital pass to claim their vehicle. It is generated on the backend after both identity documents are approved and displayed at `/smart-ticket`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [QR Code Hash Format](#2-qr-code-hash-format)
3. [Generation Logic](#3-generation-logic)
4. [Smart Ticket Data](#4-smart-ticket-data)
5. [Frontend Rendering (reference)](#5-frontend-rendering-reference)
6. [Operator Validation Flow](#6-operator-validation-flow)
7. [Security Notes](#7-security-notes)

---

## 1. Overview

```
Both docs APPROVED (operator action)
        │
        ▼
Backend generates qrCodeHash
Stores it on reservation record
        │
        ▼
Customer sees Smart Ticket at /smart-ticket
QR code generated client-side from qrCodeHash (SVG)
        │
        ▼
Customer shows QR to operator at pickup desk
        │
        ▼
Operator scans QR → POST /api/tickets/:id/validate
Backend verifies hash → marks IN_PROGRESS
```

---

## 2. QR Code Hash Format

### Format (current frontend reference)
```
NEXUS-{reservationId}-{vehicleId}-{timestamp}
```

**Examples**:
```
NEXUS-CMN-2026-001-v4-1753012345678
NEXUS-550e8400-e29b-41d4-a716-446655-a1b2c3d4-1753012345678
```

> This is the format currently used in `SmartTicketClient.tsx`:
> ```javascript
> const hash = `NEXUS-${reservationId}-${selectedVehicleId}-${Date.now()}`;
> ```

### Recommended improvements for production

The current client-generated hash has limitations:
1. It's generated **client-side** → timestamp can be spoofed
2. It's predictable → no cryptographic entropy

**Recommended production format**:
```
NEXUS-{reservationId}-{hmac_signature}
```

Where `hmac_signature` is:
```javascript
const hmac = crypto.createHmac("sha256", process.env.QR_SIGNING_SECRET);
hmac.update(`${reservationId}:${vehicleId}:${generatedAt}`);
const signature = hmac.digest("hex").slice(0, 32); // 32-char hex
const hash = `NEXUS-${reservationId}-${signature}`;
```

This makes the hash:
- **Unforgeable** (requires the secret)
- **Verifiable** server-side without a DB lookup for format check
- **Traceable** (can reconstruct from `reservationId`)

---

## 3. Generation Logic

### When to generate
Generate `qrCodeHash` immediately after **both** documents reach `APPROVED` status:

```javascript
async function onDocumentApproved(documentId: string) {
  const doc = await db.reservationDocuments.findById(documentId);
  await db.reservationDocuments.update({ id: documentId, status: "APPROVED" });

  // Check if both are now approved
  const allDocs = await db.reservationDocuments.findAll({
    where: { reservationId: doc.reservationId }
  });

  const allApproved =
    allDocs.length === 2 &&
    allDocs.every(d => d.status === "APPROVED");

  if (allApproved) {
    const hash = generateQrHash(doc.reservationId, vehicleId);

    await db.reservations.update({
      id: doc.reservationId,
      qrCodeHash: hash
    });

    // Notify customer (WebSocket / push)
    await notifyCustomer(doc.userId, {
      event: "documents_approved",
      qrCodeHash: hash
    });
  }
}
```

### `generateQrHash` function (backend)
```javascript
import crypto from "crypto";

export function generateQrHash(reservationId: string, vehicleId: string): string {
  const timestamp = Date.now();
  const input = `${reservationId}:${vehicleId}:${timestamp}`;

  const hmac = crypto
    .createHmac("sha256", process.env.QR_SIGNING_SECRET!)
    .update(input)
    .digest("hex")
    .slice(0, 32);

  return `NEXUS-${reservationId}-${hmac}`;
}
```

Add `QR_SIGNING_SECRET` to your environment variables (see [08-environment-variables.md](./08-environment-variables.md)).

---

## 4. Smart Ticket Data

The frontend fetches full ticket data from `GET /api/tickets/:reservationId`.

### Complete response shape (what frontend renders)
```json
{
  "reservation": {
    "id": "CMN-2026-001",
    "status": "CONFIRMED",
    "pickupDate": "2025-08-15T10:00:00.000Z",
    "returnDate": "2025-08-18T10:00:00.000Z",
    "pickupLocation": "CMN_T1",
    "totalDays": 3,
    "totalPriceEUR": 480,
    "depositPaidEUR": 10,
    "balanceDueEUR": 470,
    "qrCodeHash": "NEXUS-CMN-2026-001-a1b2c3d4e5f67890...",
    "customerName": "John Doe",
    "vehicle": {
      "id": "v4",
      "brand": "BMW",
      "model": "Serie 3",
      "category": "LUXURY",
      "pricePerDay": 220,
      "imageUrl": "https://...",
      "seats": 5,
      "transmission": "AUTOMATIC",
      "features": ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo"]
    }
  }
}
```

### What the Smart Ticket UI displays
From `SmartTicketClient.tsx`:
- **QR code** (SVG generated client-side from `qrCodeHash`)
- **Vehicle** brand, model, photo
- **Pickup date** formatted (e.g. "viernes, 15 de agosto de 2025")
- **Return date** formatted
- **Pickup location** label (`CMN · Terminal 1` or `CMN · Terminal 2`)
- **Countdown** to pickup time (live countdown timer)
- **Balance due** in EUR or MAD toggle (e.g. "470 €" or "5,076 DH")
- **Deposit paid** indicator (10 €)
- **Customer name** (from reservation or session)
- Operator phone link for emergencies

---

## 5. Frontend Rendering (reference)

The QR code is rendered **client-side** using a utility function in `src/lib/qr.ts`:

```typescript
// Called in SmartTicketClient:
const hash = `NEXUS-${reservationId}-${selectedVehicleId}-${Date.now()}`;
generateQRCodeSVG(hash).then(setQrSvg);
```

The SVG is injected via `dangerouslySetInnerHTML` and displayed in a white container.

> In production, `hash` will come from the backend (`reservation.qrCodeHash`) rather than being generated client-side with `Date.now()`. The frontend is already designed to accept and use `qrCodeHash` from the API response.

---

## 6. Operator Validation Flow

### Scan & validate
```http
POST /api/tickets/{reservationId}/validate
Authorization: Bearer <operator-token>
Content-Type: application/json

{
  "qrCodeHash": "NEXUS-CMN-2026-001-a1b2c3d4e5f67890..."
}
```

### Backend validation logic
```javascript
async function validateQR(reservationId: string, submittedHash: string) {
  const reservation = await db.reservations.findById(reservationId);

  if (!reservation) return { valid: false, error: "RESERVATION_NOT_FOUND" };
  if (reservation.qrCodeHash !== submittedHash) return { valid: false, error: "INVALID_QR_HASH" };
  if (reservation.status !== "CONFIRMED") return { valid: false, error: "INVALID_STATUS" };

  // Advance status
  await db.reservations.update({
    id: reservationId,
    status: "IN_PROGRESS"
  });

  return {
    valid: true,
    reservation: {
      id: reservation.id,
      status: "IN_PROGRESS",
      customerName: reservation.customerName,
      balanceDueEUR: reservation.balanceDueEUR
    }
  };
}
```

### Response to operator
```json
{
  "valid": true,
  "reservation": {
    "id": "CMN-2026-001",
    "status": "IN_PROGRESS",
    "customerName": "John Doe",
    "balanceDueEUR": 470
  }
}
```

The operator's screen then shows:
- ✅ QR válido
- Customer name
- Balance to collect in cash (`470 €` / `5,076 DH`)

### Invalid QR response
```json
{
  "valid": false,
  "error": "INVALID_QR_HASH"
}
```

---

## 7. Security Notes

### One-time use
Once a QR is validated (reservation moves to `IN_PROGRESS`), the same QR hash should be rejected on subsequent scans:
```javascript
if (reservation.status !== "CONFIRMED") {
  return { valid: false, error: "ALREADY_USED_OR_INVALID_STATUS" };
}
```

### Hash rotation
If the operator rejects a document after QR generation (rare edge case):
1. Nullify `qrCodeHash` on the reservation
2. Set the relevant document back to `PENDING_REVIEW`
3. Generate new hash only after both documents are re-approved

### Expiry (optional V1+)
Consider adding expiry to the QR hash — e.g. valid only on the `pickupDate ± 24 hours`. This prevents a customer from using an old ticket from a cancelled/rescheduled reservation. 

Embed the intended pickup date in the HMAC input and verify on the server:
```javascript
const now = Date.now();
const pickupMs = new Date(reservation.pickupDate).getTime();
const windowMs = 24 * 60 * 60 * 1000; // 24 hours

if (Math.abs(now - pickupMs) > windowMs) {
  return { valid: false, error: "QR_EXPIRED" };
}
```
