# Role Access Matrix

## Role Mapping
- `CUSTOMER` in this document = backend/frontend role `USER`
- Other roles are unchanged: `OPERATOR`, `ADMIN`

## Expected Redirect / Forbidden Patterns
- Unauthenticated server-rendered routes:
  - `requireAuthenticatedUser()` redirects to `/login?redirect=...`
- Authenticated but wrong role on operator/admin pages:
  - page renders a local forbidden shell, not a redirect
- Backend wrong-role access:
  - `RolesGuard` returns HTTP `403`
- Backend missing/invalid JWT:
  - `JwtAuthGuard` returns HTTP `401`

## Frontend Routes

| Route | CUSTOMER | OPERATOR | ADMIN | Wrong-role behavior | Sensitive exposure notes |
|---|---|---|---|---|---|
| `/login`, `/register` | Allow | Allow | Allow | n/a | Public auth entry |
| `/dashboard` | Allow | **Currently allows** | **Currently allows** | Only auth gate | High risk: backend `/reservations/my` returns all reservations for OPERATOR/ADMIN |
| `/history`, `/profile` | Allow | **Currently allows** | **Currently allows** | Only auth gate | Same customer-shell boundary issue |
| `/book/[vehicleId]` | Allow | Allow | Allow | Only auth gate on final booking create | Public catalog data until reservation create |
| `/reservations/[id]/confirmed` | Allow if own reservation | **Currently allows if reservation exists** | **Currently allows if reservation exists** | `notFound()` on backend 403/404 | Reservation detail fetched from privileged backend endpoint |
| `/reservations/[id]/check-in` | Allow if own reservation | **Currently allows if reservation exists** | **Currently allows if reservation exists** | `notFound()` on backend 403/404 | Operators/admins can inspect customer check-in flow and docs |
| `/reservations/[id]/waiting` | Allow if own reservation | **Currently allows if reservation exists** | **Currently allows if reservation exists** | `notFound()` on backend 403/404 | Waiting room exposes operational status derived from privileged reservation read |
| `/reservations/[id]/ticket` | Allow if own reservation | **Currently allows if reservation exists** | **Currently allows if reservation exists** | `notFound()` on backend 403/404 | Ticket UI available to privileged roles too |
| `/operator/dashboard` | Block | Allow | Allow | Forbidden shell | Delivery list includes customer phone and `qrCodeHash` |
| `/operator/documents` | Block | Allow | Allow | Forbidden shell | Presigned doc URLs and PII available |
| `/operator/delivery/[reservationId]` | Block | Allow | Allow | Forbidden shell or false 404 | Detail page currently depends on same-day confirmed list only |
| `/admin` | Block | Block | Allow | Forbidden shell | Admin-only shell today |

## Backend Endpoints

| Endpoint | CUSTOMER | OPERATOR | ADMIN | Block behavior | Sensitive exposure notes |
|---|---|---|---|---|---|
| `POST /api/v1/auth/register` | Allow | Allow | Allow | n/a | Creates `USER` by default |
| `POST /api/v1/auth/login` | Allow | Allow | Allow | `401` invalid creds | Returns JWT pair and full role |
| `POST /api/v1/auth/refresh` | Allow | Allow | Allow | `401` invalid token | Refresh rotates token family |
| `POST /api/v1/auth/logout` | Allow | Allow | Allow | `401` no JWT | Revokes refresh family via `tokenVersion` |
| `GET /api/v1/auth/me` | Allow | Allow | Allow | `401` no JWT | Returns role |
| `GET /api/v1/users/me` | Allow | Allow | Allow | `401` no JWT | Current profile only |
| `PATCH /api/v1/users/me` | Allow | Allow | Allow | `401` no JWT | Phone only |
| `POST /api/v1/reservations` | Allow | Allow | Allow | `401` no JWT | Creates reservation under caller |
| `POST /api/v1/reservations/quote` | Allow | Allow | Allow | n/a | Public pricing/availability |
| `GET /api/v1/reservations/my` | Own only intended | Allow all | Allow all | `401` no JWT | High risk when rendered inside customer dashboard shell |
| `GET /api/v1/reservations/:id` | Own only | Allow any | Allow any | `403` for wrong CUSTOMER | Returns reservation status, Stripe client secret, QR hash |
| `PATCH /api/v1/reservations/:id/cancel` | Own pending only | Allow broader | Allow broader | `403/400` | Captured reservations may refund |
| `PATCH /api/v1/reservations/:id/complete` | Block | Allow | Allow | `403` | Completion endpoint is role-guarded correctly |
| `POST /api/v1/documents/presign` | Own reservation only | Block by ownership check | Block by ownership check | `403/400` | Upload allowed only to reservation owner |
| `POST /api/v1/documents/confirm` | Own reservation only | Block by ownership check | Block by ownership check | `403/400` | Confirms uploaded doc row |
| `GET /api/v1/documents/:reservationId` | Own only | Allow any | Allow any | `403` for wrong CUSTOMER | Returns presigned read URLs |
| `GET /api/v1/operator/deliveries` | Block | Allow | Allow | `403` | Includes customer phone and `qrCodeHash` in list payload |
| `GET /api/v1/operator/deliveries/stats` | Block | Allow | Allow | `403` | Count-only |
| `PATCH /api/v1/operator/delivery/:reservationId/checkin` | Block | Allow | Allow | `403` | No QR required |
| `POST /api/v1/operator/delivery/:reservationId/scan-qr` | Block | Allow | Allow | `403` | Expects `qrCodeHash` |
| `GET /api/v1/operator/search` | Block | Allow | Allow | `403` | Returns full `Reservation` entity objects |
| `GET /api/v1/operator/documents/pending` | Block | Allow | Allow | `403` | Returns presigned review links |
| `PATCH /api/v1/operator/documents/:id/approve` | Block | Allow | Allow | `403` | Enqueues Stripe capture when both docs approved |
| `PATCH /api/v1/operator/documents/:id/reject` | Block | Allow | Allow | `403` | Stores rejection reason |
| `GET /api/v1/sse/reservation/:id` | Own only | Allow any reservation ID | Allow any reservation ID | `403/404` for wrong CUSTOMER | Customer stream is not role-restricted for staff |
| `GET /api/v1/sse/operator/deliveries` | Block | Allow | Allow | `403` | Staff live updates |
| `GET /api/v1/sse/operator/chat` | Block | Allow | Allow | `403` | Staff chat stream |
| `GET /api/v1/admin/stats` | Block | Block | Allow | `403` | Aggregated business data |
| `GET /api/v1/admin/users` | Block | Block | Allow | `403` | User list includes roles and active state |
| `PATCH /api/v1/admin/users/:id` | Block | Block | Allow | `403` | Can promote to OPERATOR |
| `GET/POST/PATCH/DELETE /api/v1/admin/vehicles...` | Block | Block | Allow | `403` | Fleet admin only |

## Access Boundary Findings
- `Critical`: frontend customer shell routes are not restricted to customer role; operator/admin users can open them because only authentication is checked.
- `Critical`: `/dashboard` for operator/admin consumes `/api/v1/reservations/my`, which intentionally returns all reservations for those roles.
- `High`: staff can subscribe to `/api/v1/sse/reservation/:id` for any reservation because only `USER` ownership is checked.
- `High`: operator search returns broader reservation data than the operator dashboard actually needs.
