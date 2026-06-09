# ADR-005: Reservation UUID Routing Instead of Fake Refs

## Status

Accepted

## Context

The current SPA uses fake frontend references such as `NX-...` for confirmation, check-in, waiting room, ticket, and operator routes. The backend uses UUIDs as reservation identity and exposes reservation detail through `/reservations/:id`.

## Decision

Use backend reservation UUIDs for all reservation-backed routes.

Examples:

- `/reservations/[reservationId]/confirmed`
- `/reservations/[reservationId]/check-in`
- `/reservations/[reservationId]/waiting`
- `/reservations/[reservationId]/ticket`
- `/operator/delivery/[reservationId]`

## Consequences

- Routes align with backend identity.
- Smart ticket uses reservation detail, not a separate ticket id.
- Fake ref routes must be removed.
- Any customer-facing short code must be backend-provided in the future if desired.

## Alternatives Considered

### Keep fake refs for prettier URLs

- Pros: friendlier display.
- Cons: not backend truth and causes lookup ambiguity.
- Rejected.

### Add separate ticket routes or ids

- Pros: could be product-friendly later.
- Cons: backend has no ticket module now.
- Rejected for current MVP.

## Related Docs

- `../03-ROUTE-MAP.md`
- `../05-API-CONTRACT-INTEGRATION.md`

