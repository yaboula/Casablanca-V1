# ADR-003: No SPA Mock Store as Production Architecture

## Status

Accepted

## Context

The Emergent SPA uses a local store to simulate vehicles, reservations, documents, payment, waiting room status, and operator actions. This helped create a strong visual concept, but it contradicts the hardened backend contract.

## Decision

The SPA mock store must not be used as production architecture or production business logic.

## Consequences

- Real flows must use backend APIs.
- `AppStore`-style reservation/document/operator state must be removed from production paths.
- Zustand may be used only for draft or UI preference state.
- TanStack Query should own backend data caching/refetching.
- Emergent components may be ported as presentational components only.

## Alternatives Considered

### Keep the store and slowly replace pieces

- Pros: visually easy.
- Cons: high risk of mock logic leaking into production.
- Rejected because it hides integration failures.

### Use the store as an adapter cache

- Pros: centralizes data shape.
- Cons: confuses ownership and persistence.
- Rejected in favor of feature services and query cache.

## Related Docs

- `../07-STATE-MANAGEMENT-DATA-FLOW.md`
- `../09-COMPONENT-ARCHITECTURE.md`

