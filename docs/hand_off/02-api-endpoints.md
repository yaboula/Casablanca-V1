# 02 — API Endpoints

> Full REST API contract the NEXUS frontend expects. All endpoints are relative to the `NEXT_PUBLIC_API_URL` base URL.  
> Unless noted, all requests/responses use `Content-Type: application/json`.  
> All protected routes require a valid session cookie or Bearer token. See [03-auth-and-roles.md](./03-auth-and-roles.md).

---

## Table of Contents

1. [Auth](#1-auth)
2. [Vehicles](#2-vehicles)
3. [Reservations](#3-reservations)
4. [Documents (Check-in)](#4-documents-check-in)
5. [Payments (Stripe)](#5-payments-stripe)
6. [Chat](#6-chat)
7. [QR / Smart Ticket](#7-qr--smart-ticket)
8. [Operator Panel](#8-operator-panel)
9. [Error Codes Reference](#9-error-codes-reference)

---

## Conventions

- **Authentication**: `Authorization: Bearer <token>` header or NextAuth session cookie.
- **Dates**: All dates in `ISO 8601` format (`2025-08-15T10:00:00.000Z`). The frontend sends epoch ms in some stores but converts to ISO before API calls.
- **Prices**: Always in **EUR**. Never MAD.
- **Pagination**: `?page=1&limit=20` where applicable.
- **Errors**: Always return `{ "error": "string", "code": "ERROR_CODE" }`.

---

## 1. Auth

### `POST /api/auth/register`
Create a new customer account.

**Request body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phoneNumber": "+212612345678"
}
```

**Response `201`**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "USER"
  },
  "token": "<jwt>"
}
```

**Errors**: `409 EMAIL_ALREADY_EXISTS`

---

### `POST /api/auth/login`
Authenticate and receive a session token.

**Request body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response `200`**:
```json
{
  "user": {
    "id": "...",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "USER"
  },
  "token": "<jwt>"
}
```

**Errors**: `401 INVALID_CREDENTIALS`

---

### `POST /api/auth/logout`
Invalidate the current session.

**Response `200`**: `{ "success": true }`

---

### `GET /api/auth/session`
Return current authenticated user (used by NextAuth adapter).

**Response `200`**:
```json
{
  "id": "...",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "role": "USER"
}
```

**Response `401`** if not authenticated: `{ "error": "Unauthorized" }`

---

## 2. Vehicles

### `GET /api/vehicles`
Fetch the public vehicle catalogue.

**Query params**:
| Param | Type | Description |
|-------|------|-------------|
| `category` | string? | Filter by category: `SEDAN\|SUV\|LUXURY\|COMPACT` |
| `available` | boolean? | Filter by availability (default: `true`) |
| `pickupDate` | string? | ISO date — used to check availability on that date |
| `returnDate` | string? | ISO date — used with pickupDate for availability |

**Auth**: Public (no auth required).

**Response `200`**:
```json
{
  "vehicles": [
    {
      "id": "550e8400-...",
      "model": "A4",
      "brand": "Audi",
      "category": "SEDAN",
      "pricePerDay": 160,
      "currency": "EUR",
      "imageUrl": "https://...",
      "imageUrls": ["https://...", "https://..."],
      "transmission": "AUTOMATIC",
      "seats": 5,
      "luggageCount": 2,
      "features": ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo", "Sin límite km"],
      "isAvailable": true
    }
  ]
}
```

---

### `GET /api/vehicles/:id`
Fetch a single vehicle by ID.

**Auth**: Public.

**Response `200`**: Single `Vehicle` object (same shape as above).

**Errors**: `404 VEHICLE_NOT_FOUND`

---

## 3. Reservations

### `POST /api/reservations`
Create a new reservation. Called after the customer selects a vehicle and dates.  
> Server must validate dates, compute `totalDays` and `totalPriceEUR` from the vehicle's stored price — **never trust client-computed totals**.

**Auth**: Required — `USER` role.

**Request body**:
```json
{
  "vehicleId": "550e8400-...",
  "pickupDate": "2025-08-15T10:00:00.000Z",
  "returnDate": "2025-08-18T10:00:00.000Z",
  "pickupLocation": "CMN_T1",
  "customerName": "John Doe",
  "customerPhone": "+212612345678"
}
```

**Response `201`**:
```json
{
  "reservation": {
    "id": "CMN-2026-001",
    "vehicleId": "550e8400-...",
    "pickupDate": "2025-08-15T10:00:00.000Z",
    "returnDate": "2025-08-18T10:00:00.000Z",
    "pickupLocation": "CMN_T1",
    "totalDays": 3,
    "totalPriceEUR": 480,
    "depositPaidEUR": 10,
    "balanceDueEUR": 470,
    "status": "PENDING_DEPOSIT",
    "qrCodeHash": null,
    "customerName": "John Doe",
    "customerPhone": "+212612345678"
  },
  "stripeClientSecret": "pi_xxx_secret_yyy"
}
```

> **Note**: `stripeClientSecret` is the Stripe PaymentIntent client secret for the frontend Stripe.js SDK to complete the payment.

**Errors**:
- `400 VEHICLE_NOT_AVAILABLE` — vehicle already booked for those dates
- `400 INVALID_DATES` — returnDate <= pickupDate, or dates in the past
- `409 ACTIVE_RESERVATION_EXISTS` — user already has a CONFIRMED or IN_PROGRESS reservation

---

### `GET /api/reservations`
Fetch all reservations for the authenticated user.

**Auth**: Required — `USER` role.

**Response `200`**:
```json
{
  "reservations": [
    {
      "id": "CMN-2026-001",
      "vehicle": { /* Vehicle object */ },
      "pickupDate": "2025-08-15T10:00:00.000Z",
      "returnDate": "2025-08-18T10:00:00.000Z",
      "pickupLocation": "CMN_T1",
      "totalDays": 3,
      "totalPriceEUR": 480,
      "depositPaidEUR": 10,
      "balanceDueEUR": 470,
      "status": "CONFIRMED",
      "qrCodeHash": "NEXUS-CMN-2026-001-v1-1753000000000"
    }
  ]
}
```

---

### `GET /api/reservations/:id`
Fetch a single reservation by ID.

**Auth**: Required — owner `USER` or `OPERATOR`/`ADMIN`.

**Response `200`**: Single `Reservation` object with `vehicle` joined.

**Errors**: `404 RESERVATION_NOT_FOUND`, `403 FORBIDDEN`

---

### `PATCH /api/reservations/:id/cancel`
Cancel a reservation.

**Auth**: Required — owner `USER` (only if `PENDING_DEPOSIT`) or `OPERATOR`/`ADMIN`.

**Response `200`**:
```json
{
  "reservation": { "id": "...", "status": "CANCELLED" }
}
```

**Errors**: `409 CANNOT_CANCEL_ACTIVE` — cannot cancel `IN_PROGRESS` reservations.

---

## 4. Documents (Check-in)

### `POST /api/documents/upload-url`
Request a presigned S3 URL to upload a document image directly from the browser.

**Auth**: Required — `USER` role.

**Request body**:
```json
{
  "reservationId": "CMN-2026-001",
  "type": "PASSPORT",
  "contentType": "image/jpeg"
}
```

**Response `200`**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/nexus-docs/...?X-Amz-Signature=...",
  "documentId": "doc-uuid-here",
  "expiresIn": 300
}
```

> The frontend uploads the file directly to S3 via `PUT` to `uploadUrl`. After upload succeeds, it calls `POST /api/documents/confirm`.

---

### `POST /api/documents/confirm`
Notify the backend that the S3 upload is complete. Sets status to `PENDING_REVIEW`.

**Auth**: Required — `USER` role.

**Request body**:
```json
{
  "documentId": "doc-uuid-here"
}
```

**Response `200`**:
```json
{
  "document": {
    "id": "doc-uuid-here",
    "type": "PASSPORT",
    "status": "PENDING_REVIEW",
    "reservationId": "CMN-2026-001"
  }
}
```

---

### `GET /api/documents/status?reservationId=CMN-2026-001`
Poll the status of documents for a reservation. Called every **30 seconds** by `WaitingRoomClient`.

**Auth**: Required — owner `USER` or `OPERATOR`.

**Response `200`**:
```json
{
  "reservationId": "CMN-2026-001",
  "documents": [
    {
      "id": "...",
      "type": "PASSPORT",
      "status": "APPROVED",
      "reviewedAt": "2025-08-15T10:30:00.000Z"
    },
    {
      "id": "...",
      "type": "DRIVING_LICENSE",
      "status": "PENDING_REVIEW",
      "reviewedAt": null,
      "rejectionReason": null
    }
  ],
  "allApproved": false,
  "qrCodeHash": null
}
```

When `allApproved = true`, the response also includes:
```json
{
  "allApproved": true,
  "qrCodeHash": "NEXUS-CMN-2026-001-v1-1753000000000"
}
```

> The frontend uses `allApproved` to navigate automatically from `/waiting-room` to `/smart-ticket`.

---

## 5. Payments (Stripe)

### `POST /api/payments/create-intent`
Create a Stripe PaymentIntent for the 10 € deposit.  
> This is also called internally during `POST /api/reservations` — the `stripeClientSecret` is returned from there. This endpoint exists for re-creating the intent if needed.

**Auth**: Required — `USER` role.

**Request body**:
```json
{
  "reservationId": "CMN-2026-001"
}
```

**Response `200`**:
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 1000,
  "currency": "eur"
}
```

> `amount` is in **cents** (Stripe convention). 10 EUR = 1000 cents.

---

### `POST /api/payments/webhook`
Stripe webhook endpoint. Must be publicly accessible (no auth — verified by Stripe signature).

**Headers**: `stripe-signature: <sig>`

**Handled events**:

| Stripe Event | Action |
|---|---|
| `payment_intent.succeeded` | Set reservation `status = CONFIRMED`, record `depositPaidEUR = 10` |
| `payment_intent.payment_failed` | Set reservation `status = CANCELLED` |

**Response**: `200 { "received": true }` — always respond 200 quickly Stripe will retry on failure.

> See [06-payment.md](./06-payment.md) for full Stripe integration details.

---

## 6. Chat

### `POST /api/chat`
Submit a customer chat message. Currently the only chat endpoint on the frontend.

**Auth**: Required — `USER` role.

**Request body**:
```json
{
  "messageId": "msg-uuid-client-generated",
  "text": "Hola, tengo una pregunta sobre mi reserva",
  "timestamp": 1753012345678
}
```

> `messageId` is client-generated UUID used as idempotency key — deduplicate if retried.

**Response `200`**:
```json
{
  "success": true,
  "messageId": "msg-uuid-client-generated",
  "receivedAt": 1753012345679
}
```

**Response `400`**:
```json
{
  "error": "Missing required fields: text, messageId"
}
```

**Backend actions** (to implement):
1. Insert into `chat_messages` table (idempotent by `id`).
2. Push notification to operator (FCM / web push).
3. Forward to WhatsApp Business API (optional).
4. Emit WebSocket event to operator panel.

---

### `GET /api/chat/history`
Fetch chat history for the current user. Used if chat store is cleared.

**Auth**: Required — `USER` role.

**Response `200`**:
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "text": "Hola, tengo una pregunta",
      "sender": "user",
      "timestamp": 1753012345678,
      "status": "read"
    },
    {
      "id": "reply-uuid",
      "text": "Buenos días, ¿en qué le puedo ayudar?",
      "sender": "operator",
      "timestamp": 1753012350000,
      "status": "delivered"
    }
  ]
}
```

---

### `POST /api/chat/operator-reply` *(operator-facing)*
Operator sends a reply message.

**Auth**: Required — `OPERATOR` or `ADMIN` role.

**Request body**:
```json
{
  "userId": "user-uuid",
  "text": "Su reserva está confirmada.",
  "messageId": "op-msg-uuid"
}
```

**Response `200`**: `{ "success": true, "messageId": "op-msg-uuid" }`

**Backend actions**: Insert message, emit WebSocket event to customer's browser.

---

### `PATCH /api/chat/mark-read` *(operator-facing)*
Mark all messages from a user as read.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Request body**: `{ "userId": "user-uuid" }`

**Response `200`**: `{ "success": true }`

---

## 7. QR / Smart Ticket

### `GET /api/tickets/:reservationId`
Fetch the smart ticket data for display. Called by `SmartTicketClient`.

**Auth**: Required — owner `USER` or `OPERATOR`.

**Response `200`**:
```json
{
  "reservation": {
    "id": "CMN-2026-001",
    "vehicle": { /* Vehicle object */ },
    "pickupDate": "2025-08-15T10:00:00.000Z",
    "returnDate": "2025-08-18T10:00:00.000Z",
    "pickupLocation": "CMN_T1",
    "totalDays": 3,
    "totalPriceEUR": 480,
    "depositPaidEUR": 10,
    "balanceDueEUR": 470,
    "status": "CONFIRMED",
    "qrCodeHash": "NEXUS-CMN-2026-001-v4-1753000000000",
    "customerName": "John Doe"
  }
}
```

**Errors**: `403 DOCUMENTS_NOT_APPROVED` if accessed before both documents are approved.

---

### `POST /api/tickets/:reservationId/validate`
Operator scans QR and validates it to mark the vehicle as picked up.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Request body**:
```json
{
  "qrCodeHash": "NEXUS-CMN-2026-001-v4-1753000000000"
}
```

**Response `200`**:
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

**Response `400`**: `{ "valid": false, "error": "INVALID_QR_HASH" }`

---

## 8. Operator Panel

### `GET /api/operator/reservations`
Fetch all reservations for operator review.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Query params**: `?status=CONFIRMED&page=1&limit=20`

**Response `200`**:
```json
{
  "reservations": [ /* Array of Reservation objects with vehicle + documents joined */ ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/operator/documents`
Fetch documents pending review.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Query params**: `?status=PENDING_REVIEW`

**Response `200`**:
```json
{
  "documents": [
    {
      "id": "doc-uuid",
      "type": "PASSPORT",
      "status": "PENDING_REVIEW",
      "fileUrl": "https://s3.../presigned-url?X-Amz-...",
      "reservation": { /* summary */ },
      "user": { "id": "...", "fullName": "John Doe" }
    }
  ]
}
```

---

### `PATCH /api/operator/documents/:id/approve`
Approve a document.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Response `200`**:
```json
{
  "document": { "id": "...", "status": "APPROVED", "reviewedAt": "2025-08-15T10:30:00.000Z" }
}
```

**Side effect**: If both documents for the reservation are now `APPROVED`, the backend MUST:
1. Generate `qrCodeHash` (format: `NEXUS-{reservationId}-{vehicleId}-{timestamp}`)
2. Set it on the reservation record
3. Push a notification or WebSocket event to the customer's waiting-room page

---

### `PATCH /api/operator/documents/:id/reject`
Reject a document with a reason.

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Request body**:
```json
{
  "rejectionReason": "La foto está borrosa. Por favor vuelva a subir una imagen más clara."
}
```

**Response `200`**:
```json
{
  "document": {
    "id": "...",
    "status": "REJECTED",
    "rejectionReason": "La foto está borrosa...",
    "reviewedAt": "2025-08-15T10:32:00.000Z"
  }
}
```

---

### `PATCH /api/operator/reservations/:id/status`
Update reservation status (pickup confirmation, return, etc.).

**Auth**: Required — `OPERATOR` or `ADMIN`.

**Request body**:
```json
{
  "status": "IN_PROGRESS"
}
```

**Allowed transitions**: See status machine in [04-booking-flow.md](./04-booking-flow.md).

**Response `200`**: Updated `Reservation` object.

---

## 9. Error Codes Reference

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `MISSING_FIELDS` | Required fields absent in request body |
| 400 | `INVALID_DATES` | Dates invalid, in past, or returnDate ≤ pickupDate |
| 400 | `INVALID_QR_HASH` | QR code hash does not match database record |
| 400 | `VEHICLE_NOT_AVAILABLE` | Requested vehicle is booked for overlapping dates |
| 401 | `UNAUTHORIZED` | No valid session or token |
| 403 | `FORBIDDEN` | Authenticated but lacks permission |
| 403 | `DOCUMENTS_NOT_APPROVED` | Ticket accessed before document approval |
| 404 | `VEHICLE_NOT_FOUND` | Vehicle ID does not exist |
| 404 | `RESERVATION_NOT_FOUND` | Reservation ID does not exist |
| 409 | `EMAIL_ALREADY_EXISTS` | Registration with duplicate email |
| 409 | `ACTIVE_RESERVATION_EXISTS` | User already has an active reservation |
| 409 | `CANNOT_CANCEL_ACTIVE` | Cannot cancel IN_PROGRESS reservation |
| 422 | `INVALID_CONTENT_TYPE` | Document upload with unsupported file type |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
