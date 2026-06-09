# Route Map

## Final Routes

| Path | Purpose | User type | Auth | Role | Backend endpoints | Identity model | Visual inspiration | Functional inspiration | Decision | Priority | Notes/Risks |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| `/` | Landing and search entry | public | no | none | optional `GET /vehicles` later | none | Emergent | new/old public | adapt | P1 | keep premium but concrete |
| `/catalog` | Vehicle catalog | public | no | none | `GET /vehicles` | vehicle UUID | Emergent | old+new | rewrite | P1 | filters must match backend |
| `/catalog/[vehicleId]` | Vehicle detail | public | no | none | `GET /vehicles/:id` | vehicle UUID | Emergent | old | rewrite | P1 | no fake specs as truth |
| `/login` | Login | public | no | none | `POST /auth/login`, session proxy | user session | old upgraded | old | rewrite | P1 | must support session expiry UX |
| `/register` | Register | public | no | none | `POST /auth/register`, session proxy | user session | old upgraded | old | rewrite | P1 | no fake onboarding |
| `/book/[vehicleId]` | Booking + payment | customer | yes | `USER` | `GET /vehicles/:id`, `POST /reservations` | vehicle UUID then reservation UUID | Emergent | old | rewrite | P1 | use idempotency key |
| `/reservations/[reservationId]/confirmed` | Confirmation | customer | yes | `USER` | `GET /reservations/:id` | reservation UUID | new/mixed | old | build | P1 | must show next action |
| `/reservations/[reservationId]/check-in` | Document upload | customer | yes | `USER` | `GET /reservations/:id`, `POST /documents/presign`, `POST /documents/confirm`, `GET /documents/:reservationId` | reservation UUID | mixed | old | rewrite | P1 | only passport/license |
| `/reservations/[reservationId]/waiting` | Review waiting room | customer | yes | `USER` | `GET /reservations/:id`, `GET /documents/:reservationId`, `GET /sse/reservation/:id` | reservation UUID | mixed | old | rewrite | P1 | refetch on SSE reconnect |
| `/reservations/[reservationId]/ticket` | Smart ticket | customer | yes | `USER` | `GET /reservations/:id` | reservation UUID | Emergent+old | old | rewrite | P1 | no `/tickets` endpoint |
| `/dashboard` | Customer hub | customer | yes | `USER` | `GET /reservations/my` | reservation UUID | mixed | old | rewrite | P1 | one next action |
| `/profile` | Self profile | logged-in | yes | any | `GET /users/me`, `PATCH /users/me` | user UUID | old simple | old | build | P3 | keep small |
| `/operator/dashboard` | Deliveries | operator/admin | yes | `OPERATOR`/`ADMIN` | `GET /operator/deliveries`, `GET /operator/deliveries/stats`, SSE | reservation UUID | Emergent operator | old | rewrite | P2 | dense, not marketing |
| `/operator/documents` | Pending document review | operator/admin | yes | `OPERATOR`/`ADMIN` | `GET /operator/documents/pending`, approve/reject | document UUID | mixed | old | rewrite | P2 | conflict states matter |
| `/operator/delivery/[reservationId]` | QR/manual check-in and completion | operator/admin | yes | `OPERATOR`/`ADMIN` | `POST /operator/delivery/:id/scan-qr`, `PATCH /operator/delivery/:id/checkin`, `PATCH /reservations/:id/complete` | reservation UUID | mixed | old | rewrite | P2 | separate scan/check-in/complete |
| `/operator/search` | Reservation search | operator/admin | yes | `OPERATOR`/`ADMIN` | `GET /operator/search` | reservation UUID | old | old | build | P3 | useful operational fallback |
| `/operator/profile` | Operator profile | operator/admin | yes | `OPERATOR`/`ADMIN` | `GET /users/me`, `PATCH /users/me` | user UUID | old | old | build | P3 | small |
| `/operator/admin/stats` | Admin stats | admin | yes | `ADMIN` | `GET /admin/stats` | none | old upgraded | old | rewrite | P3 | quiet dashboard |
| `/operator/admin/users` | User admin | admin | yes | `ADMIN` | `GET /admin/users`, `PATCH /admin/users/:id` | user UUID | old upgraded | old | rewrite | P3 | self-role guard is backend enforced |
| `/operator/admin/vehicles` | Fleet admin | admin | yes | `ADMIN` | vehicle admin endpoints | vehicle UUID | old upgraded | old | rewrite | P3 | include `licensePlate` |

## Routes to Remove or Avoid

| Route/Pattern | Reason |
|---|---|
| `/booking/:id` | SPA route; final route is `/book/[vehicleId]` |
| `/confirmation/:ref` | fake ref identity |
| `/checkin/:ref` | fake ref identity |
| `/waiting/:ref` | fake ref identity |
| `/ticket/:ref` | fake ref identity |
| any `/tickets/*` API assumption | backend has no ticket module |
| `/documents/status` | backend has no such endpoint |
| `/payments/create-intent` | reservation creation creates the PaymentIntent |
| production forgot-password | backend reset flow is not implemented |
| SPA mock operator review/handoff routes | local actions do not map cleanly to backend truth |

