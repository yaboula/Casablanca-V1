# Information Architecture

## Final App Sections

| Section | Audience | Purpose | Priority |
|---|---|---|---|
| Public marketing | visitors | explain value and start search | P1 |
| Catalog and detail | visitors/customers | browse and choose vehicle | P1 |
| Auth | customers/operators/admins | login/register/session | P1 |
| Customer journey | customers | booking, check-in, waiting, ticket, dashboard | P1 |
| Operator console | airport operators | review docs and execute handoff | P2 |
| Admin console | admins | manage users, fleet, stats | P3 |
| Support/chat | customers/operators | assistance and messaging | P4 |

## Public Area

- `/`
- `/catalog`
- `/catalog/[vehicleId]`
- `/login`
- `/register`

The public area should be SEO-friendly and visually premium. It should not depend on login except when booking starts.

## Customer Area

- `/book/[vehicleId]`
- `/reservations/[reservationId]/confirmed`
- `/reservations/[reservationId]/check-in`
- `/reservations/[reservationId]/waiting`
- `/reservations/[reservationId]/ticket`
- `/dashboard`
- `/profile`

The customer area is authenticated and uses reservation UUIDs for all reservation-backed pages.

## Operator Area

- `/operator/dashboard`
- `/operator/documents`
- `/operator/delivery/[reservationId]`
- `/operator/search`
- `/operator/profile`

The operator area is authenticated and restricted to `OPERATOR` and `ADMIN`.

## Admin Area

- `/operator/admin`
- `/operator/admin/stats`
- `/operator/admin/users`
- `/operator/admin/vehicles`

The admin area is authenticated and restricted to `ADMIN`.

## Navigation Model

| Context | Primary navigation | Secondary navigation |
|---|---|---|
| Public | Home, Fleet, Login/Register | FAQ/support links |
| Customer | Dashboard, Book/Fleet, Profile | support, logout |
| Operator | Deliveries, Documents, Search | admin link if `ADMIN`, profile, logout |
| Admin | Stats, Users, Vehicles | back to operator dashboard |

## Role-Based Access Model

| Area | Auth required | Roles |
|---|---:|---|
| Public | no | none |
| Booking and customer reservations | yes | `USER`, optionally admin/operator only when explicitly allowed by backend |
| Operator | yes | `OPERATOR`, `ADMIN` |
| Admin | yes | `ADMIN` |

## Primary Journey

`/` -> `/catalog` -> `/catalog/[vehicleId]` -> `/book/[vehicleId]` -> `/reservations/[reservationId]/confirmed` -> `/reservations/[reservationId]/check-in` -> `/reservations/[reservationId]/waiting` -> `/reservations/[reservationId]/ticket` -> pickup -> `/dashboard`

## Secondary Journeys

- Dashboard continuation into check-in, waiting, or ticket.
- Operator document review and delivery handoff.
- Admin fleet/user management.
- Support/chat after core journey is stable.

## Priority Tiers

| Priority | Pages |
|---|---|
| P1 | `/`, `/catalog`, detail, auth, booking, confirmation, check-in, waiting, ticket, dashboard |
| P2 | operator dashboard, operator documents, operator delivery |
| P3 | profile, operator search/profile, admin stats/users/vehicles |
| P4 | support hub, chat, wallet/export, forgot-password when backend exists |

## Postponed Pages

- Forgot-password.
- Support chat as a polished full product.
- Wallet export.
- Advanced currency conversion UI.
- Any separate `/tickets` route or endpoint assumption.

