# Frontend Phase 1 Baseline

Date: 2026-06-09

Phase 1 is the restored Next.js App Router foundation:

- Next runtime is active from `src/app`.
- API/session shell is mounted through frontend route handlers.
- Auth UI and protected route shells exist for customer, operator, and admin roles.
- The Emergent CRA/SPA material is reference-only and must not be imported by production routes.
- Booking, payment, documents, waiting room, smart ticket, catalog/detail, and operator/admin business data are intentionally deferred.

Phase 2 should start with public home, catalog, and vehicle detail against the backend vehicle contract.
