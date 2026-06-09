# Agent Handoff Guide

## Short Context

Casablanca-V1 is a premium airport-first car rental platform for Casablanca Mohammed V Airport. The backend is hardened and is the source of truth. The active frontend is currently an Emergent-based SPA with strong visuals but mock-driven logic. The final frontend must be rebuilt on Next.js App Router.

Backend baseline:

`b02dc11 - Harden backend auth, reservations, payments, and operations`

## Final Goal

Build a Next.js App Router frontend that is:

- backend-aligned
- secure in auth/session handling
- visually premium
- practical for customer, operator, and admin workflows
- free of production mock reservation/document/payment/operator logic

## Hard Rules

- Do not adapt backend to frontend mocks.
- Do not use fake refs.
- Use reservation UUIDs in reservation routes.
- Do not invent endpoints.
- Do not use `/tickets`.
- Do not use `/documents/status`.
- Do not use `/payments/create-intent`.
- Do not keep SPA `AppStore` business logic in production routes.
- Backend EUR cents are canonical.
- MAD conversion is display-only and can be postponed.
- Smart ticket uses reservation detail.
- Forgot-password is postponed until backend supports reset.

## Where to Read First

Recommended order:

1. `00-FRONTEND-OVERVIEW.md`
2. `03-ROUTE-MAP.md`
3. `04-FRONTEND-TECHNICAL-ARCHITECTURE.md`
4. `05-API-CONTRACT-INTEGRATION.md`
5. `10-IMPLEMENTATION-ROADMAP.md`
6. relevant ADRs in `adr/`

## How to Pick a Phase

Start with the earliest incomplete roadmap phase in `10-IMPLEMENTATION-ROADMAP.md`.

Do not skip foundation/auth before building protected customer/operator/admin flows.

## How to Make Commits

Use one commit per roadmap phase or coherent sub-slice.

Recommended commit names:

- `frontend-next-foundation-and-session`
- `frontend-public-catalog-and-detail`
- `frontend-booking-payment-confirmation`
- `frontend-customer-postbooking-journey`
- `frontend-operator-console`
- `frontend-admin-console`
- `frontend-e2e-and-hardening`

Before committing:

- run relevant validation commands
- check `git status`
- avoid staging unrelated frontend churn
- do not stage local `.env`, logs, reports, or generated artifacts unless explicitly requested

## Commands to Run

Common checks:

```powershell
npm run build
npm run test:e2e
npm --prefix backend run docker:dev
npm --prefix backend run db:test:setup
```

Use focused commands when working on a smaller slice.

## What Not to Touch

- backend route contracts unless explicitly assigned
- backend schema
- frontend docs decisions without updating ADRs
- unrelated frontend files outside the active phase
- local env files
- mock routes as shortcuts

## How to Report Results

Report:

- files changed
- route(s) affected
- backend endpoints used
- validation commands and outcomes
- any blocked assumptions
- any user-visible behavior changes

Do not claim a flow is complete without running the relevant checks.

## Known Risks

- accidentally preserving SPA mock logic
- mixing Next and React Router production paths
- leaking tokens to browser JS
- using fake refs in URLs
- assuming old frontend endpoints still exist
- making operator/admin too decorative
- building payment UI before session foundation is correct

## Questions an Agent Must Ask Before Coding if Unclear

Ask before coding if:

- the active phase is ambiguous
- a backend endpoint seems missing
- a proposed route contradicts the route map
- auth/session storage would expose tokens
- a UI feature requires backend data that does not exist
- implementation would require backend changes
- a mock seems necessary for production route behavior

