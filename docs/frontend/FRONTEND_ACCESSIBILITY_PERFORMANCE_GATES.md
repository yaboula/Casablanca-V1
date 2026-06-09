# Frontend Accessibility And Performance Gates

Date: 2026-06-09

## Purpose

This document converts audit recommendations into release gates. These gates are intended to prevent accessibility, legal, and performance quality from becoming late-stage cleanup.

## Accessibility Target

Casablanca-V1 frontend should target WCAG 2.2 AA. WCAG 2.1 AA remains the minimum compatibility baseline if tooling references 2.1 criteria, but new implementation should use 2.2 AA expectations where practical.

## Accessibility Release Gates

| Gate | Requirement |
|---|---|
| Automated axe | No critical or serious axe violations on P1 routes |
| Lighthouse accessibility | Target 95+ on P1 public/customer routes |
| Keyboard navigation | Every route, form, dialog, menu, upload flow, and operator action is keyboard operable |
| Skip link | Present and functional in the root layout |
| Landmarks | Header, main, nav, footer or equivalent landmarks are clear |
| Page titles | Route metadata identifies page purpose |
| Heading hierarchy | One meaningful `h1` per page template, followed by ordered headings |
| Focus visible | Focus ring is visible, consistent, and not obscured |
| Labels | Inputs have visible labels or accessible names |
| Autocomplete | Auth, customer identity, payment-adjacent, and document forms use appropriate autocomplete attributes |
| Errors | Form errors are associated with fields and announced when relevant |
| Status updates | Payment, document upload, waiting room, smart ticket readiness, and operator decisions use accessible status announcements |
| Contrast | Text, icons, focus indicators, borders for controls, and status badges pass AA contrast |
| Target size | Mobile controls are at least 44x44 px; 48x48 px is preferred in airport workflows |
| Color use | Status and errors are never communicated by color alone |
| Motion | Respects reduced motion preferences |
| Language | Root `lang` is set; future multilingual content must set language correctly |

## P1 Routes For Gate Coverage

| Route group | Example coverage |
|---|---|
| Public | Home, catalog, vehicle detail |
| Auth | Login, register |
| Booking | Booking form and payment shell |
| Customer | Confirmation, check-in, waiting room, smart ticket, dashboard |
| Operator | Pending document review, deliveries, scan/check-in |
| Admin | Users, vehicles, stats shell |

## Performance Targets

| Metric | Target |
|---|---:|
| LCP | <= 2.5s |
| INP | <= 200ms |
| CLS | <= 0.1 |
| TTFB | <= 800ms where feasible |
| Public initial JS | Budget decision required; recommended target is <= 200KB gzipped for core public route JS |

## Performance Release Gates

| Gate | Requirement |
|---|---|
| Next rendering | Use server components/static/ISR/dynamic rendering intentionally per route |
| Images | Use `next/image` with explicit sizing and priority only for above-the-fold critical images |
| Fonts | Use `next/font` or local font strategy; no production CSS `@import` font loading |
| Stripe | Load only on payment route or payment component boundary |
| Operator/admin bundles | Must not increase public route bundles |
| Skeletons | Reserve layout dimensions to avoid CLS |
| Data fetching | Avoid waterfalls between route shell and critical data where backend contract allows |
| Caching | Define route rendering/cache strategy before broad catalog/detail integration |
| Dependencies | Avoid duplicate data libraries and date libraries unless intentionally justified |
| Third-party scripts | No global third-party scripts without documented purpose and loading strategy |

## Route Rendering Strategy Baseline

| Route | Recommended strategy |
|---|---|
| `/` | Static shell; dynamic only if personalization is introduced |
| `/catalog` | ISR or dynamic depending on vehicle freshness requirement |
| `/catalog/[vehicleId]` | ISR or dynamic detail fetch; use backend UUID |
| `/login`, `/register` | Static shell plus client form |
| `/book/[vehicleId]` | Dynamic/auth-aware once payment starts |
| `/reservations/[id]/*` | Dynamic and auth-required |
| `/dashboard` | Dynamic and auth-required |
| `/operator/*` | Dynamic, role-required, real-time aware |
| `/admin/*` | Dynamic, role-required |

## Suggested Validation Commands

These commands are examples for the future implementation phase and should be adjusted to the final package scripts:

```bash
npm run lint
npm run build
npx playwright test
npx playwright test --grep @a11y
npx lighthouse http://localhost:3000 --only-categories=accessibility,performance
```

## Block Release If

| Blocker | Reason |
|---|---|
| P1 routes have critical/serious axe violations | Legal and usability risk |
| Keyboard cannot complete booking/check-in/operator decisions | Core flow inaccessible |
| Payment or document statuses are not announced | Users may miss critical state changes |
| LCP/CLS/INP regressions are ignored | Premium product feels slow or unstable |
| Stripe loads globally | Public performance regression |
| Images use raw `img` without sizing strategy | Catalog/detail pages risk LCP and CLS failure |
| CSS font imports remain in production | Render-blocking and layout-shift risk |

