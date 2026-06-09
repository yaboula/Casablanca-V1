# Frontend Non-Negotiables 2026

Date: 2026-06-09

## Purpose

These are the rules that future frontend work must preserve. They are stricter than style preferences because violating them risks backend inconsistency, legal/accessibility failure, or broken airport pickup operations.

## Architecture

| Rule | Requirement |
|---|---|
| Production framework | Use Next.js App Router for production frontend work |
| SPA status | The current CRA/SPA structure is not the production architecture |
| Route ownership | Route groups should separate public, auth, customer, operator, and admin contexts |
| Component role | Emergent components may be reused visually, but business logic must be rebuilt against backend contracts |
| Data boundary | API adapters own backend shape mapping; UI components receive view models |
| Server/client boundary | Server components and route handlers must pass plain JSON to client components |

## Backend Truth

| Rule | Requirement |
|---|---|
| API prefix | Backend API truth is `/api/v1` |
| Vehicles | Use `GET /vehicles` and `GET /vehicles/:id` |
| Reservations | Use `POST /reservations`, `GET /reservations/my`, `GET /reservations/:id`, cancel, and complete according to backend contract |
| Documents | Use `POST /documents/presign`, `POST /documents/confirm`, and `GET /documents/:reservationId` |
| Waiting room | Use reservation detail, document list, and `GET /sse/reservation/:id` |
| Operator | Use pending documents, approve/reject, deliveries, and scan/check-in endpoints from the backend |
| Smart ticket | There is no `/tickets` endpoint. Smart ticket data comes from `GET /reservations/:id` |
| Pricing | Backend pricing is EUR cents only |
| Currency | Currency conversion is frontend display only unless backend changes later |
| Identity | Backend UUIDs are the only valid IDs |
| Statuses | Backend state machine statuses are the only valid statuses |

## Forbidden Production Patterns

| Pattern | Why forbidden |
|---|---|
| Fake booking references | Breaks reservation lookup, QR, operator handoff, and support |
| Mock vehicles/reservations/documents as production data | Contradicts backend truth and creates stale state |
| Frontend-created reservation status transitions | Violates backend state machine |
| Frontend-owned pricing totals | Risks payment and legal inconsistency |
| Invented endpoints | Causes integration drift |
| LocalStorage for backend-owned entities | Can show stale or corrupt reservations/documents |
| Fake payment success | Breaks financial integrity |
| Fake QR/smart ticket data | Breaks pickup operations |
| Color-only status | Fails accessibility and operational clarity |

## Auth And Session

| Rule | Requirement |
|---|---|
| Token exposure | Do not expose refresh tokens to browser JavaScript |
| Cookie strategy | Use secure HTTP-only cookie handling through the frontend server/proxy layer |
| Session endpoint | Provide a frontend session/me mechanism that reflects backend auth truth |
| Refresh behavior | On backend 401, attempt refresh once, retry original request once, then fail cleanly |
| Role gates | Customer, operator, and admin routes must be protected by backend-derived role state |
| Logout | Clear frontend session state and call backend logout where supported |

## UX And Accessibility

| Rule | Requirement |
|---|---|
| Accessibility target | WCAG 2.2 AA is the frontend release target |
| Keyboard | Every route and dialog must be keyboard operable |
| Focus | Visible focus rings are required and must not be obscured |
| Labels | Inputs need visible labels or accessible names, plus autocomplete where relevant |
| Status updates | Payment, document upload, waiting room, and operator actions need screen-reader announcements |
| Touch targets | Mobile primary controls should target at least 44x44 px, with 48x48 px preferred for airport workflows |
| Journey framing | Present the long workflow as Reserve, Verify, Pickup |
| Trust | Visual quality must increase clarity and confidence, not decoration |

## Performance

| Rule | Requirement |
|---|---|
| LCP | Target <= 2.5s |
| INP | Target <= 200ms |
| CLS | Target <= 0.1 |
| TTFB | Target <= 800ms where feasible |
| Fonts | Do not use CSS `@import` for production fonts |
| Images | Use `next/image` for vehicle, hero, and public visual assets |
| Stripe | Load Stripe only where payment is needed |
| Operator/admin | Keep heavy operational/admin code out of public browsing bundles |
| Fake delays | Do not add artificial delays to simulate premium loading |

## Resilience

| Rule | Requirement |
|---|---|
| SSE | Waiting room must reconnect with exponential backoff and cleanup on route leave |
| Polling fallback | If SSE repeatedly fails, use HTTP polling as fallback |
| Idempotency | Reservation/payment creation must use a durable `Idempotency-Key` lifecycle |
| Offline/poor network | Do not imply completion when the backend has not confirmed it |
| Serialization | Dates must cross server/client boundary as ISO strings; no classes, functions, or non-JSON values |

## Design System

| Rule | Requirement |
|---|---|
| Base | Shadcn/ui plus Tailwind is the preferred base |
| Icons | `lucide` is the current configured icon library |
| Current tokens | Current CSS tokens are candidates, not automatically final |
| Hardcoded color | Avoid hardcoded hex values outside token definitions |
| Radius | Current `--radius: 1rem` is a candidate but flagged as likely too large for operational UI |
| Dark mode | Do not ship partial dark mode as a production feature |
| Motion | Motion must be subtle, purposeful, and respect reduced motion |

