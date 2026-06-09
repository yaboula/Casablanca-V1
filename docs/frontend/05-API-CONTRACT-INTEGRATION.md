# API Contract Integration

## Backend Baseline

Backend baseline commit:

`b02dc11 - Harden backend auth, reservations, payments, and operations`

Backend prefix:

`/api/v1`

The frontend must not invent endpoints or depend on mocks when backend-owned data exists.

## Auth Endpoints

| Method | Path | Purpose | Frontend use |
|---|---|---|---|
| `POST` | `/auth/register` | create account | register route |
| `POST` | `/auth/login` | login | login route |
| `POST` | `/auth/refresh` | rotate/refresh tokens | Next refresh proxy |
| `POST` | `/auth/logout` | revoke active refresh family | logout |
| `GET` | `/auth/me` | current user | session hydration |

## Vehicle Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/vehicles` | public catalog |
| `GET` | `/vehicles/:id` | public vehicle detail |

Frontend requirements:

- adapt backend category/status/pricing fields to UI models
- use backend UUID as vehicle identity
- do not expose admin-only fields such as license plate in public UI unless backend intentionally returns them

## Reservation Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/reservations` | create reservation and Stripe PaymentIntent |
| `GET` | `/reservations/my` | current user reservations |
| `GET` | `/reservations/:id` | reservation detail |
| `PATCH` | `/reservations/:id/cancel` | cancel reservation |
| `PATCH` | `/reservations/:id/complete` | operator/admin complete |

Frontend requirements:

- send `Idempotency-Key` for reservation creation
- use reservation UUID in routes
- use backend status machine
- do not generate fake reservation refs
- do not calculate transactional total as final truth

## Document Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/documents/presign` | get upload URL/key |
| `POST` | `/documents/confirm` | confirm uploaded document |
| `GET` | `/documents/:reservationId` | list reservation documents |

Document types:

- `PASSPORT`
- `DRIVING_LICENSE`

Frontend upload flow:

1. presign
2. upload file to returned URL
3. confirm with backend
4. refetch documents

## SSE Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/sse/reservation/:id` | customer reservation stream |
| `GET` | `/sse/operator/deliveries` | operator delivery updates |
| `GET` | `/sse/operator/chat` | operator chat updates, later |

SSE must go through a Next proxy because EventSource cannot send custom Authorization headers.

## Operator Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/operator/deliveries` | delivery queue |
| `GET` | `/operator/deliveries/stats` | delivery stats |
| `GET` | `/operator/search` | operator search |
| `GET` | `/operator/documents/pending` | pending document reviews |
| `PATCH` | `/operator/documents/:id/approve` | approve document |
| `PATCH` | `/operator/documents/:id/reject` | reject document |
| `POST` | `/operator/delivery/:id/scan-qr` | QR check-in |
| `PATCH` | `/operator/delivery/:id/checkin` | manual check-in |

## Admin Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/stats` | admin KPIs |
| `GET` | `/admin/users` | users list |
| `PATCH` | `/admin/users/:id` | update role/active state |
| `GET` | `/admin/vehicles` | fleet list |
| `POST` | `/admin/vehicles` | create vehicle |
| `PATCH` | `/admin/vehicles/:id` | update vehicle |
| `DELETE` | `/admin/vehicles/:id` | soft delete/inactivate |
| `DELETE` | `/admin/vehicles/:id/permanent` | hard delete when allowed |

Admin vehicle UI must include `licensePlate`.

## Chat Endpoints

Chat is postponed until core journey is stable.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/chat` | create message |
| `GET` | `/chat/:reservationId` | reservation chat history |

## Response and Error Handling

Expected backend error shape is based on NestJS conventions:

```json
{
  "statusCode": 400,
  "message": "string or string[]",
  "error": "Bad Request"
}
```

Frontend should normalize errors into:

- field validation errors
- action errors
- unauthorized/forbidden
- not found
- backend unavailable

## Adapter Requirements

Adapters are required for:

- vehicles
- reservations
- documents
- operator deliveries
- pending document reviews
- admin users/vehicles/stats
- errors

Adapters must clearly separate backend DTO shape from UI view models.

## Endpoints That Do Not Exist

Do not use or invent:

- `/tickets`
- `/documents/status`
- `/documents/upload-url`
- `/payments/create-intent`
- frontend fake reservation refs
- frontend-generated QR source of truth

