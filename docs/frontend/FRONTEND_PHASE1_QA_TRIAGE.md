# Frontend Phase 1 QA And Working Tree Triage

Date: 2026-06-09

## Classification

| Group | Files | Decision |
|---|---|---|
| A. Needed for Phase 1 foundation | `.env.example`, `docs/frontend/FRONTEND_PHASE1_BASELINE.md`, `src/_spa_reference/README.md` | Commit now. These document the active runtime, API env names, and SPA quarantine rule. |
| B. Useful Emergent reference | `src/_spa_reference/**`, untracked Emergent JSX components under `src/components/**`, untracked public Emergent assets | Preserve as reference only. Do not import into `src/app`. The committed marker in `src/_spa_reference/README.md` defines the rule. |
| C. Accidental/unrelated deletion restored | `README.md`, `components.json`, tracked public assets under `public/**` | Restored before Commit D because the CRA/Emergent overwrite was not part of Phase 1 QA. |
| D. Unrelated changes left uncommitted | tracked deletions under old `src/components/**`, old `src/lib/**`, `src/hooks/**`, `src/messages/**`, `src/middleware.ts`, `src/stores/**`, plus local env/log/plugin/temp files | Leave unstaged for separate handling. They are not required for Phase 1 foundation QA and should not be bundled into this cleanup commit. |

## QA Checks

| Check | Result |
|---|---|
| Next App Router is production runtime | Pass. Production routes live under `src/app`. |
| `src/app` imports no SPA reference | Pass. No imports from `src/_spa_reference`, `src/pages`, or `src/data`. |
| No AppStore in production route tree | Pass. No production imports. |
| No React Router in production route tree | Pass. No production imports. |
| No fake sessions | Pass. Auth routes call `/api/auth/session`, which uses backend auth endpoints. |
| Refresh token not exposed to browser JS | Pass. Refresh token is stored only in HttpOnly cookie. |
| Role guards clean | Pass. Customer/operator/admin shells use backend-derived session helpers. |
| No global Stripe import | Pass. No Stripe imports in `src/app`, `src/features`, or `src/lib`. |
| No booking/payment/documents/SSE implementation in Phase 1 | Pass. Only honest placeholder text references future phases. |

## Phase 2 Start Point

Phase 2 should start with public home, catalog, and vehicle detail. It should consume the backend vehicle contract through the API/session shell and must not reuse SPA mock data.
