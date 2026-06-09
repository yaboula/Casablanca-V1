# Component Architecture

## Component Layers

| Layer | Purpose |
|---|---|
| UI primitives | low-level buttons, inputs, dialogs, badges, tabs |
| Layout components | shells, headers, nav, page containers |
| Marketing components | hero, trust strip, process explanation, FAQ |
| Presentational components | pure display cards fed by view models |
| Feature components | domain-specific UI with feature behavior |
| Smart/container components | data loading, mutations, auth-aware orchestration |

## Component Rules

- Presentational components receive adapted view models, not raw backend DTOs.
- Smart components may call hooks/services.
- UI primitives must not know domain rules.
- Domain status mapping lives in adapters or feature utilities.
- Mock data must not power production components.

## Per-Feature Component Plan

| Feature | Components |
|---|---|
| auth | login form, register form, session expired banner, role redirect helper |
| catalog | catalog grid, vehicle card, filter bar, empty results, detail gallery |
| booking | booking stepper, trip form, customer form, order summary, payment section |
| reservations | confirmation summary, journey next-action panel, status timeline |
| documents | upload step, document row, rejected document notice, upload progress |
| waiting-room | live status card, document status list, support CTA |
| smart-ticket | ticket card, QR block, pickup info, not-ready state |
| dashboard | active reservation card, next action, history list |
| operator | delivery queue, stats cards, document review panel, handoff actions |
| admin | stats cards, users table, vehicles table, vehicle form |

## Adapter-Based Component Model

Backend DTOs should be mapped before display.

Example flow:

```text
backend response -> feature service -> adapter -> view model -> component
```

This prevents visual components from depending on backend naming, optional fields, or backend enum details.

## Components to Port from Emergent as Visual-Only

- hero composition
- booking/search widget visual style
- premium button style
- vehicle cards
- app shell/header/footer rhythm
- smart ticket visual card
- status badge styling
- reservation summary styling
- operator cards/metrics visual treatment

When porting, strip mock behavior.

## Components to Reuse Conceptually from Previous Frontend

- auth forms and session flow
- Stripe provider/payment structure
- check-in document step sequence
- waiting room SSE model
- smart ticket backend data fetching
- dashboard next-action pattern
- operator/admin route and page organization
- Playwright page object ideas

## Components to Rebuild from Scratch

- production booking flow
- production payment section
- real document upload component
- waiting room state model
- operator document review mutations
- operator delivery scan/check-in screen
- admin forms aligned to hardened backend, including `licensePlate`

## Anti-Patterns

- raw backend DTO used directly in many components
- components reading localStorage reservations
- status badges built from frontend-only status strings
- fake refs in props
- fake QR generation
- card-heavy operator/admin screens that reduce scan speed
- hidden business logic inside presentational components

