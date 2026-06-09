# ADR-001: Next App Router as Final Frontend Foundation

## Status

Accepted

## Context

Casablanca-V1 originally used Next.js App Router. The active frontend is now an Emergent-based React SPA with strong visual direction but weak production structure. The final product needs public SEO-friendly pages, protected customer routes, operator/admin areas, auth/session proxying, and clear server/client separation.

## Decision

Use Next.js App Router as the final frontend foundation.

## Consequences

- Public catalog/detail routes can be server-rendered or statically optimized where appropriate.
- Auth can use secure HttpOnly cookie proxy patterns.
- Operator/admin route families can be protected cleanly.
- Current SPA routing is not production architecture.
- Emergent visual components must be ported or adapted into Next-compatible components.

## Alternatives Considered

### Keep the current React Router SPA

- Pros: preserves active Emergent implementation shape.
- Cons: requires rebuilding auth/session, SSE proxying, route protection, and SEO structure from scratch.
- Rejected because it is slower and riskier for production alignment.

### Restore previous frontend wholesale

- Pros: faster route/functionality restoration.
- Cons: reintroduces outdated assumptions and misses Emergent visual improvements.
- Rejected because the final product should be better than both versions.

## Related Docs

- `../00-FRONTEND-OVERVIEW.md`
- `../04-FRONTEND-TECHNICAL-ARCHITECTURE.md`
- `../10-IMPLEMENTATION-ROADMAP.md`

