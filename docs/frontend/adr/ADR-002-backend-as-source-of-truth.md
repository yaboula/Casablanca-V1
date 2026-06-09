# ADR-002: Backend as Source of Truth

## Status

Accepted

## Context

The backend has been hardened and now owns auth, roles, vehicle data, reservation lifecycle, payment state, document review, operator actions, admin data, pricing, and status transitions. The current frontend contains mock versions of many of these concepts.

## Decision

The backend is the product and business source of truth for all production frontend flows.

## Consequences

- Frontend must not invent reservation/payment/document/operator state.
- Frontend must use backend UUIDs and statuses.
- Frontend pricing display is based on backend EUR cents.
- Frontend adapters must map backend DTOs into UI view models.
- Mock data is limited to tests, fixtures, or isolated design prototypes.

## Alternatives Considered

### Let frontend own some business state temporarily

- Pros: faster visual progress.
- Cons: creates contract drift and fake production behavior.
- Rejected because it caused the current integration problem.

### Add frontend-specific backend shortcuts

- Pros: might simplify some screens.
- Cons: risks adapting backend to mock UI assumptions.
- Rejected unless future backend changes are intentionally designed.

## Related Docs

- `../05-API-CONTRACT-INTEGRATION.md`
- `../07-STATE-MANAGEMENT-DATA-FLOW.md`

