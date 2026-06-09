# Frontend Overview

## Project Context

Casablanca-V1 is a premium, airport-first car rental and booking platform for Casablanca Mohammed V Airport. The product promise is simple: customers reserve before they land, complete verification before pickup, and use a smart ticket for a fast airport handoff.

The backend is now hardened and is the product source of truth. Baseline backend commit:

`b02dc11 - Harden backend auth, reservations, payments, and operations`

## Current Situation

The active frontend has been replaced by an Emergent-based React SPA. It has a strong premium visual direction, but many production flows are mock-driven:

- local mock reservations
- fake references
- fake document upload/review states
- simulated payment
- local operator actions
- no production auth/session layer

The previous frontend was built on Next.js App Router. It contained the stronger functional structure: route families, auth/session proxy ideas, backend integration patterns, SSE patterns, operator/admin areas, and Playwright e2e structure. It also had outdated assumptions and should not be restored blindly.

## Final Frontend Decision

The final frontend architecture must be rebuilt on **Next.js App Router**.

The final frontend should be better than both previous inputs:

- backend-aligned
- structurally clean
- visually premium
- strong in UX, marketing, psychology, trust, and conversion
- useful for airport operators and admins

## Source-of-Truth Hierarchy

| Rank | Source | Role |
|---|---|---|
| 1 | Hardened backend | Business rules, API contracts, auth, roles, statuses, pricing, reservation identity |
| 2 | Previous Next frontend | Functional route structure, integration ideas, auth/session proxy, e2e references |
| 3 | Emergent frontend | Visual direction, theme, component polish, UX inspiration |

## Final Decisions

- Final framework: Next.js App Router.
- Backend is product and business source of truth.
- Reservation UUIDs are the real route/entity identity.
- Backend EUR cents are canonical.
- MAD/currency conversion is display-only and can be postponed.
- Smart ticket uses reservation detail; there is no `/tickets` backend endpoint.
- Forgot-password is postponed until backend supports reset.
- Support chat is secondary after the core customer journey.
- Emergent SPA is visual/theme reference only.
- Previous frontend is functional reference only.

## Non-Negotiable Rules

- Do not adapt backend contracts to frontend mocks.
- Do not keep fake refs in production routes.
- Do not keep mock reservations, documents, operator actions, or payments as production logic.
- Do not invent backend endpoints.
- Do not derive backend-owned status from frontend-only heuristics.
- Do not persist backend-owned entities in localStorage as source of truth.
- Do not treat frontend pricing calculations as transactional truth.

## In Scope

- Final frontend route architecture.
- Product and UX specification.
- API integration documentation.
- Auth/session/security frontend strategy.
- State/data-flow strategy.
- Design system and component architecture.
- Implementation roadmap and testing strategy.
- Agent handoff documentation.
- ADRs for major frontend decisions.

## Out of Scope

- Backend API changes.
- Implementing frontend features in this documentation pass.
- Restoring the old frontend wholesale.
- Shipping forgotten/reset-password flows before backend support.
- Treating support chat as a blocker for core booking flow.
- Wallet export or advanced pass formats before smart ticket is stable.

## Glossary

| Term | Meaning |
|---|---|
| Backend truth | Any data or rule owned by the NestJS backend and database |
| Reservation UUID | Backend-generated reservation id; the only real reservation route identity |
| Fake ref | Frontend-generated display reference such as `NX-...`; not allowed as production identity |
| Journey state | Combined customer state from reservation detail, documents, and SSE updates |
| Smart ticket | Reservation-backed pickup pass using backend reservation detail and QR hash |
| Operator | Airport staff user with `OPERATOR` or `ADMIN` role |
| Admin | Platform manager with `ADMIN` role |
| Emergent frontend | Current SPA visual frontend; visual reference only |
| Previous frontend | Stable Next.js frontend; functional reference only |

