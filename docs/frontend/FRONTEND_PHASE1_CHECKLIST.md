# Frontend Phase 1 Checklist

Date: 2026-06-09

## Phase 1 Goal

Create the production frontend foundation before integrating incomplete screens. Phase 1 should establish Next.js App Router, auth/session, API client/proxy, design token baseline, accessibility/performance gates, and safe route shells.

This phase should not attempt to finish booking, documents, waiting room, operator, or admin workflows. Those become safer after the foundation proves it can call the backend contract without mock data.

## Inputs To Preserve

| Source | Preserve |
|---|---|
| Hardened backend | API contract, UUIDs, statuses, EUR cents, auth/roles, reservation/document/operator flows |
| Previous frontend | Next route structure ideas, API proxy/session patterns, flow sequencing, adapter separation |
| Emergent frontend | Premium visual direction, selected Shadcn/ui components, typography direction, refined hero/catalog styling ideas |

## Inputs To Quarantine

| Source | Quarantine |
|---|---|
| Current SPA | `AppStore` mock business state, fake reservations, fake QR, fake payment success, React Router production routing |
| Current services | Any endpoint path that does not match the hardened backend |
| Current UI | Components that combine visual rendering with mock mutation logic |
| Current CSS | CSS `@import` fonts and incomplete dark-mode token set |

## Phase 1 Work Items

### 1. Next App Router Foundation

| Item | Expected result |
|---|---|
| App router | `src/app` becomes the production route root |
| Route groups | Public, auth, customer, operator, and admin route boundaries are explicit |
| Root layout | Includes metadata, language, body font classes, skip link, and app providers |
| Error handling | Root and segment error/loading boundaries exist |
| Not found | Production `not-found` route exists |
| Legacy SPA | Legacy SPA stays only as reference until intentionally removed or migrated |

### 2. API And Session Layer

| Item | Expected result |
|---|---|
| Backend base | One source of truth for backend base URL and `/api/v1` prefix |
| Server fetch | Server-side helper reads secure cookies and normalizes backend errors |
| Client fetch | Client helper calls frontend route handlers and never handles refresh tokens |
| Proxy/route handlers | Frontend server forwards allowed backend calls safely |
| Refresh | 401 triggers refresh once and retries once |
| Error model | Backend errors map to predictable UI categories |
| Typed adapters | Backend DTOs are mapped into serializable frontend view models |

### 3. Auth Shell

| Item | Expected result |
|---|---|
| Login route | Uses real auth endpoint through session layer |
| Register route | Uses real register endpoint if backend exposes it |
| Me/session | Authenticated user state is backend-derived |
| Logout | Clears cookies/session and client cache |
| Guards | Customer, operator, and admin shells enforce role requirements |
| Redirects | Unauthorized users get deterministic redirects without loops |

### 4. Design System Baseline

| Item | Expected result |
|---|---|
| Shadcn base | Use Shadcn/ui as editable component foundation |
| Tokens | Import current candidate tokens only after validating missing values |
| Fonts | Replace CSS `@import` with `next/font` or local font strategy |
| Focus | Visible focus ring tokens are globally defined |
| Radius | Operational surfaces use restrained radius even if marketing remains softer |
| Motion | Reduced-motion behavior is globally respected |
| Dark mode | Either removed from Phase 1 UI or completed as a token set |

### 5. Accessibility And Performance Gates

| Item | Expected result |
|---|---|
| WCAG | WCAG 2.2 AA declared as release target |
| Axe | P1 routes can be tested for critical/serious violations |
| Keyboard | Navigation, forms, menus, and dialogs are keyboard testable |
| Web vitals | LCP, INP, CLS targets are documented and measurable |
| Images | `next/image` strategy is available before catalog/detail work |
| Bundles | Stripe/operator/admin code cannot enter public route bundles |

## Suggested Phase 1 Folder Shape

```text
src/
  app/
    layout.tsx
    loading.tsx
    error.tsx
    not-found.tsx
    (public)/
    (auth)/
    (customer)/
    (operator)/
    (admin)/
    api/
      auth/
      proxy-or-v1/
  components/
    ui/
    layout/
    marketing/
    catalog/
    reservations/
    operator/
    admin/
  lib/
    api/
      backend-config.ts
      server-fetch.ts
      client-fetch.ts
      errors.ts
      adapters/
    auth/
      session.ts
      guards.ts
    resilience/
      idempotency.ts
      sse.ts
  styles/
    globals.css
```

This is a planning shape, not a command to move files immediately. Existing repo conventions should be inspected again during implementation before edits.

## Phase 1 Definition Of Done

| Gate | Done when |
|---|---|
| Framework | Next App Router bootstraps without relying on React Router for production routes |
| API | A single API layer can call backend `/api/v1` with normalized errors |
| Auth | Login/session/logout route flow works against backend truth |
| Roles | Customer/operator/admin guards are represented in the route shell |
| Mock safety | Mock business state is not imported by production routes |
| Design | Token baseline is documented, and missing token decisions are explicit |
| A11y | Skip link, landmarks, focus rings, labels, metadata pattern, and keyboard navigation are included |
| Perf | Font and image strategies are Next-native; no global Stripe load |
| Verification | Lint/build/type checks pass for the foundation slice |

## Recommended First Coding Slice

Build the Next App Router foundation plus auth/session/API shell. Do not begin with booking UI. A stable auth and API layer reduces rework across every later flow.

Suggested commit group name:

```text
Create frontend Next foundation and backend session shell
```

## Do Not Touch Yet

| Area | Reason |
|---|---|
| Booking payment flow | Needs idempotency and Stripe strategy first |
| Document upload | Needs presign/confirm adapter and error model first |
| Waiting room | Needs SSE fallback helper first |
| Operator dashboard | Needs role shell and heavy bundle isolation first |
| Admin dashboard | Needs admin role shell and backend admin contract adapter first |
| Currency conversion | Must not obscure backend EUR cents truth |
| Dark mode toggle | Current dark mode is incomplete |

