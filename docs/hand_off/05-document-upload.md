# 05 — Document Upload & Check-in Flow

> Covers the identity verification step: customer uploads PASSPORT and DRIVING_LICENSE, operator reviews, system generates QR ticket upon approval.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Upload Architecture (Presigned S3)](#2-upload-architecture-presigned-s3)
3. [Frontend Flow (CheckInFlow + DocumentUploadStep)](#3-frontend-flow-checkinflow--documentuploadstep)
4. [API Sequence](#4-api-sequence)
5. [Operator Review Workflow](#5-operator-review-workflow)
6. [Polling Protocol (WaitingRoomClient)](#6-polling-protocol-waitingroomclient)
7. [Rejection & Re-upload Flow](#7-rejection--re-upload-flow)
8. [S3 Bucket Configuration](#8-s3-bucket-configuration)
9. [File Validation Rules](#9-file-validation-rules)

---

## 1. Overview

After a reservation is confirmed (deposit paid), the customer must upload two identity documents before the vehicle can be released:

1. **PASSPORT** — photo page, clear, no reflections
2. **DRIVING_LICENSE** — front of licence, valid and in date

Both documents must be individually approved by an operator. Only when **both are `APPROVED`** does the system generate the QR code and allow access to the Smart Ticket.

---

## 2. Upload Architecture (Presigned S3)

Files are uploaded **directly from the browser to S3** — they never transit through the backend server. This avoids large file handling on the API layer.

```
Browser                   Backend API              AWS S3
  │                           │                      │
  ├── POST /documents/upload-url ──────────────────► │
  │   { reservationId, type, contentType }           │
  │                           │                      │
  │◄── { uploadUrl, documentId } ─────────────────── │
  │         (presigned PUT URL, TTL: 5 min)          │
  │                           │                      │
  ├── PUT {uploadUrl} ────────────────────────────► S3
  │   (raw file bytes, Content-Type header)          │
  │                           │                      │
  ├── POST /documents/confirm ──────────────────────►│
  │   { documentId }          │                      │
  │                           │ (verify object exists in S3)
  │◄── { document: { status: "PENDING_REVIEW" } }    │
```

---

## 3. Frontend Flow (CheckInFlow + DocumentUploadStep)

The check-in UI at `/check-in?reservationId=XXX` is a 2-step animated flow:

**Step 1 — Passport upload**
- Component: `DocumentUploadStep` with `type="PASSPORT"`
- User takes photo or selects file
- On completion → advance to step 2

**Step 2 — Driving licence upload**
- Component: `DocumentUploadStep` with `type="DRIVING_LICENSE"`
- On completion → navigate to `/waiting-room?reservationId=XXX`

The `reservationId` is passed via URL query param and propagated through every subsequent step.

---

## 4. API Sequence

### 4.1 Request presigned URL
```http
POST /api/documents/upload-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "reservationId": "CMN-2026-001",
  "type": "PASSPORT",
  "contentType": "image/jpeg"
}
```

**Backend logic**:
1. Verify user owns this reservation and it's in `CONFIRMED` status
2. Verify no `APPROVED` document of this type already exists (re-upload is allowed for `REJECTED`)
3. Generate S3 key: `documents/{userId}/{reservationId}/{type}/{uuid}.jpg`
4. Create a `reservation_documents` record with `status = PENDING_REVIEW` (or update existing rejected)
5. Generate presigned PUT URL (TTL: 300 seconds)
6. Return `{ uploadUrl, documentId, expiresIn: 300 }`

### 4.2 Browser uploads directly to S3
```http
PUT {uploadUrl}
Content-Type: image/jpeg

<binary file data>
```

### 4.3 Confirm upload complete
```http
POST /api/documents/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "doc-uuid"
}
```

**Backend logic**:
1. Verify `documentId` belongs to the authenticated user
2. Optionally: verify the S3 object exists (`HeadObject` call)
3. Set `status = PENDING_REVIEW` (or keep as is if already set in step 4.1)
4. Trigger notification to operator (push/email/Slack)
5. Return updated document record

---

## 5. Operator Review Workflow

### Operator sees pending documents
```http
GET /api/operator/documents?status=PENDING_REVIEW
Authorization: Bearer <operator-token>
```

Response includes `fileUrl` — a **freshly generated presigned GET URL** (TTL: 15 minutes) for the operator to view the image:
```json
{
  "fileUrl": "https://nexus-docs.s3.amazonaws.com/documents/...?X-Amz-Signature=..."
}
```

> Never return the raw S3 key or a permanent URL. Always generate short-lived presigned GET URLs.

### Approve document
```http
PATCH /api/operator/documents/{id}/approve
Authorization: Bearer <operator-token>
```

**Backend logic**:
1. Set `status = APPROVED`, `reviewed_by = operatorId`, `reviewed_at = now()`
2. Check if **both** documents for the reservation are now `APPROVED`
3. If yes:
   - Generate `qrCodeHash` (see [09-qr-and-smart-ticket.md](./09-qr-and-smart-ticket.md))
   - Store `qrCodeHash` on the reservation
   - Push WebSocket event or push notification to customer: "Documentos aprobados, tu ticket está listo"

### Reject document
```http
PATCH /api/operator/documents/{id}/reject
Authorization: Bearer <operator-token>
Content-Type: application/json

{
  "rejectionReason": "La foto está borrosa. Por favor vuelva a subir una imagen más clara."
}
```

**Backend logic**:
1. Set `status = REJECTED`, `rejection_reason`, `reviewed_by`, `reviewed_at`
2. Push notification to customer (WebSocket or push): "Un documento ha sido rechazado"

---

## 6. Polling Protocol (WaitingRoomClient)

The frontend polls every **30,000 ms** (30 seconds):

```http
GET /api/documents/status?reservationId=CMN-2026-001
Authorization: Bearer <token>
```

Response shape the frontend reads:
```json
{
  "reservationId": "CMN-2026-001",
  "documents": [
    { "id": "...", "type": "PASSPORT", "status": "APPROVED", "reviewedAt": "2025-08-15T10:30:00.000Z" },
    { "id": "...", "type": "DRIVING_LICENSE", "status": "PENDING_REVIEW", "rejectionReason": null }
  ],
  "allApproved": false,
  "qrCodeHash": null
}
```

When approved:
```json
{
  "allApproved": true,
  "qrCodeHash": "NEXUS-CMN-2026-001-v4-1753000000000"
}
```

**Frontend behaviour on response**:
- `allApproved = true` → stop polling, navigate to `/smart-ticket?reservationId=XXX`
- Any document `status = "REJECTED"` → show rejection reason, offer re-upload link
- `allApproved = false`, no rejections → keep polling

> ⚠️ The backend must be efficient for this endpoint — it will be called repeatedly. Add an index on `(reservation_id)` in `reservation_documents`. Consider adding a Redis cache if load is high.

---

## 7. Rejection & Re-upload Flow

When a document is rejected, the customer sees the `rejectionReason` on `/waiting-room` and is offered a link:

```
/check-in?reservationId=CMN-2026-001&retry=true
```

The `retry=true` flag tells the frontend to skip the "already uploaded" check and show the upload UI again.

On the backend, when a new presigned URL is requested for the same `(reservationId, type)`:
1. **If existing record is `REJECTED`**: update the existing record, generate new S3 key, set status back to `PENDING_REVIEW`.
2. **If existing record is `APPROVED`**: reject the re-upload request (`400 DOCUMENT_ALREADY_APPROVED`).

---

## 8. S3 Bucket Configuration

### Bucket settings
- **Name**: `nexus-documents` (or configure via env `AWS_S3_BUCKET`)
- **Region**: `eu-west-1` (Ireland) — close to Morocco, low latency
- **Public access**: **BLOCKED** — all files are private
- **Versioning**: optional for V1
- **Lifecycle policy**: auto-delete objects older than 90 days (operational decision)

### IAM policy for the backend service
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::nexus-documents/documents/*"
    }
  ]
}
```

### S3 key format
```
documents/{userId}/{reservationId}/{type}/{uuid}.{ext}

Examples:
documents/550e8400/CMN-2026-001/PASSPORT/a1b2c3d4.jpg
documents/550e8400/CMN-2026-001/DRIVING_LICENSE/e5f6g7h8.jpg
```

---

## 9. File Validation Rules

| Rule | Value |
|------|-------|
| Accepted MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Maximum file size | 10 MB |
| Minimum dimensions | 600 × 400 px (recommended, not enforced in V1) |
| Accepted extensions | `.jpg`, `.jpeg`, `.png`, `.webp` |

### Server-side validation (presigned URL stage)
- Only generate presigned URL for accepted `contentType` values
- Set `ContentLengthRange` condition in presigned URL policy: max 10 MB

```javascript
// Example AWS SDK v3 presigned URL with conditions
const command = new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: s3Key,
  ContentType: validatedContentType,
});
// Add conditions via createPresignedPost for size limits
```
