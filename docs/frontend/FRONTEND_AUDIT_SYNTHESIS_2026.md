# Frontend Audit Synthesis 2026

Date: 2026-06-09

## Purpose

This document consolidates the four frontend audit inputs under the agreed hierarchy:

1. `gpt-audit.md` is the product vision, UX philosophy, and 2026 frontend standard.
2. `claude-complete.audit.md` is the implementation execution baseline because it audits both documentation and the current `src`.
3. `claude_frontend_audit_2026.md` is the documentation and specification gap checklist.
4. `geminiv1-audit.md` is the critical resilience and edge-case addendum.

Backend remains the source of truth. The Emergent frontend is visual inspiration only. The previous functional frontend is a source for integration patterns only. No mock logic, fake references, invented endpoints, or frontend-owned business state should survive into production.

## Executive Synthesis

The audits agree on the strategic direction: rebuild the frontend architecture around Next.js App Router, preserve the strongest Emergent visual language as presentational design, reuse previous frontend ideas only where they match the hardened backend contract, and remove mock-driven SPA state from the production path.

The current frontend has useful visual assets, Shadcn/ui components, Tailwind tokens, typography direction, and premium interaction ideas. It is not a production integration base because it is still structurally SPA/CRA-oriented, uses mock/localStorage business state, and does not enforce the hardened backend contract.

The fastest correct path is not restoring the old frontend wholesale and not patching the Emergent SPA screen by screen. The recommended path is a clean Next App Router foundation that imports or rewrites selected Emergent components as presentational components, then integrates each flow through typed API adapters.

## Audit Contribution Matrix

| Audit | Primary value | Use it for | Do not use it for |
|---|---|---|---|
| `gpt-audit.md` | Product vision and UX standard | Premium airport-concierge positioning, Laws of UX, non-negotiable product quality | Exact implementation details where current code disagrees |
| `claude-complete.audit.md` | Current implementation truth | Identifying SPA/mock blockers, dependency risk, current CSS/component inventory | Final visual values without design-system patching |
| `claude_frontend_audit_2026.md` | Specification gaps | Tokens, accessibility, performance, route rendering, testing requirements | Backend/API truth |
| `geminiv1-audit.md` | Resilience | SSE fallback, idempotency lifecycle, silent refresh, SSR/CSR serialization | Broad route/component inventory |

## Consolidated Layer Scores

| Layer | Consolidated score | Reason |
|---|---:|---|
| Product and UX strategy | 8.5/10 | Strong airport-concierge positioning, personas, trust model, and journey thinking |
| Backend contract alignment in docs | 8.5/10 | Hardened backend truth is clear, including UUIDs, statuses, reservations, documents, SSE, operator/admin |
| Current frontend implementation alignment | 2.5/10 | SPA/CRA, mock store, fake refs, and incomplete real API integration block production use |
| Visual direction | 7/10 | Premium direction is promising, but design tokens and component rules need concrete values |
| Design system specification | 4/10 | Candidate tokens exist, but many final token decisions are missing |
| Accessibility/legal readiness | 4/10 | WCAG awareness exists, but automated gates and many AA criteria are missing |
| Performance readiness | 3.8/10 | Current CRA model blocks Next optimization; targets and budgets need to be enforced |
| Resilience | 6.5/10 | Good recommended patterns from Gemini, not yet codified in implementation |

## Consensus Decisions

1. Use Next.js App Router as the production frontend architecture.
2. Treat the hardened backend contract as the only business truth.
3. Use `/api/v1` backend semantics through a frontend API/proxy layer, not ad hoc direct calls.
4. Use backend UUIDs and reservation statuses everywhere. Do not use fake refs.
5. Do not keep `localStorage` or mock stores for backend-owned entities.
6. Use the smart ticket from `GET /reservations/:id`; there is no ticket endpoint.
7. Use EUR cents from the backend as pricing truth. Currency conversion is frontend display only.
8. Use Shadcn/ui and Tailwind as the component/token base, with concrete token patching before broad UI work.
9. Make WCAG 2.2 AA and Core Web Vitals release gates, not late polish.
10. Add SSE reconnect, polling fallback, idempotency-key lifecycle, and silent refresh as architecture requirements.

## Resolved Conflicts

| Conflict | Resolution |
|---|---|
| GPT audit praises the documentation standard while Claude 2026 says the design docs lack implementable tokens | Both are true. Product strategy is strong; token/spec execution is incomplete. The design-system patch must precede large UI implementation. |
| Claude Complete lists possible SPA quick wins, but the architecture target is Next App Router | Do not invest feature work in SPA. Use SPA only as inventory for visual extraction and mock removal references. |
| Current CSS defines dark-mode partial tokens | Dark mode is not production-ready. Decide later whether Phase 1 ships light-only or completes dark tokens before release. |
| Journey has 11 backend/user states but rental users expect fewer visible steps | Keep backend flow, but present it as three user-facing phases: Reserve, Verify, Pickup. |
| Emergent visuals are premium but include glass/blur/oversized patterns | Preserve restraint, typography, and high-end feel. Remove visual effects that reduce clarity or performance. |

## P0 Blockers Before Coding Production Flows

1. Production frontend must be based on Next App Router, not the current CRA/SPA runtime.
2. API client/proxy/session architecture must be defined before connecting screens.
3. Mock store and localStorage business state must be quarantined from production routes.
4. Auth cookie/session handling must be implemented with silent refresh and one retry on 401.
5. Design-system patch must define or explicitly defer missing token decisions.
6. WCAG 2.2 AA gate must be accepted with tooling expectations.
7. Core Web Vitals and bundle budget gates must be accepted.
8. Reservation creation must include a durable `Idempotency-Key` lifecycle.
9. Waiting room must include SSE reconnect plus HTTP polling fallback.
10. Server-to-client adapters must serialize plain JSON only.

## P1 Requirements

| Area | Requirement |
|---|---|
| Routes | Implement public browsing, auth, catalog/detail, booking, confirmation, check-in, waiting room, smart ticket, dashboard, operator, admin in controlled phases |
| Components | Convert Emergent flow screens into presentational components before wiring API |
| Forms | Use schema validation matching backend DTOs and user-friendly normalized errors |
| Loading states | Stable skeletons, no layout shift, no fake delays |
| Errors | Domain-specific recoverable error states for payment, documents, auth, SSE, and operator actions |
| Images | Use `next/image`; define priority/lazy behavior per route |
| Fonts | Replace CSS `@import` with `next/font` or local font strategy |
| Testing | Add Playwright happy path, a11y checks, and contract-focused adapter tests |

## P2 Enhancements

| Area | Requirement |
|---|---|
| Smart ticket | Make it the peak-end/trophy moment with QR, vehicle, pickup clarity, and share/export later if feasible |
| Currency | Add frontend-only display conversion after EUR cents flow is stable |
| i18n | Define language strategy, `lang`, localized metadata, and possible RTL before multilingual release |
| Motion | Define subtle motion tokens and reduced-motion behavior |
| Analytics | Add privacy-aware funnel measurement after core flows are real |
| Dark mode | Either complete the token set or remove the public toggle until ready |

## Phase 1 Readiness

Phase 1 is ready to start after the companion docs in this batch are accepted as guardrails. The first coding slice should be the Next App Router foundation plus auth/session/API shell, not a visual screen integration.

Phase 1 should not connect booking, documents, waiting room, operator, or admin screens until the foundation can safely authenticate, refresh, call `/api/v1`, serialize data, and reject mock business state.

