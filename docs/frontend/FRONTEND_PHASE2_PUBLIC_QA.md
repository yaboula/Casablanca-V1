# Frontend Phase 2 Public QA

Date: 2026-06-09

## Routes Reviewed

| Route | Status |
|---|---|
| `/` | Reviewed and polished |
| `/catalog` | Reviewed and polished |
| `/catalog/[vehicleId]` | Reviewed and polished |
| Error/loading/not-found shells for all three | Reviewed and polished |

## Key QA Decisions

### Language Consistency
- Root layout `lang` attribute was `es` (Spanish). Changed to `en` to match the primary UI language (English).
- All French-language copy in aria-labels, loading states, error pages, and button labels was changed to English.
- `/ jour` price unit in PriceDisplay changed to `/ day`.

### Branding
- Nav and footer brand name changed from "Casablanca V1" (internal project name) to "Nexus Mobility" (product brand).
- Metadata title updated to "Nexus Mobility — Airport Car Rental".
- Footer replaced dev note ("Backend-connected flows are intentionally not mounted in Commit A") with product-grade copyright + fleet link.

### Dev-Facing Copy Removal
All user-visible copy that referenced backend internals was replaced with product-grade user-facing equivalents:
- "EUR cents from API" → "Transparent daily rates"
- "Backend UUIDs only" → "Confirmed reservation only"
- "Fleet browsing uses backend truth" → "Every listing is a real vehicle"
- "Backend vehicle detail" → vehicle category label
- "Exact public vehicle profile from `GET /api/v1/vehicles/:id`" → natural product description
- "Backend status" → "Availability"
- "Backend-provided features" → "Included features"
- "Backend identity" → "Exact vehicle"
- "Next route is planned / Booking will be implemented later" → "Book this vehicle / Continue to booking form"
- Process steps updated from dev-referencing to user journey language
- Reassurance cards updated to user-facing benefits
- CatalogStates updated with user-friendly messages

### Heading Hierarchy Fixes
- `Reassurance` sub-items in PublicHome: `h2` → `h3` (under parent section `h2`)
- `PromiseItem` in VehicleDetailSummary: `h2` → `h3` (page already has `h1` for vehicle name)
- `NextStep` in VehicleDetailSummary: `h2` → `h3`
- Each route retains exactly one `<h1>` per page

### Accessibility Improvements
- Skip link fixed from Spanish "Saltar al contenido principal" to English "Skip to main content"
- Nav aria-label fixed from "Navegacion principal" to "Main navigation"
- Catalog loading aria-label: French → English
- Vehicle detail loading aria-label: French → English
- Category badge in VehicleDetailSummary: added `aria-hidden` to decorative dot, added `sr-only` "Category: " prefix
- Category filter: already uses `aria-current="page"` (text-level, not color-only) ✅
- `VehicleGrid`: replaced `<div role="list">/<div role="listitem">` with semantic `<ul>/<li>`
- `CatalogEmptyState`: added `aria-live="polite"` for screen reader announcement
- Vehicle detail CTA: updated aria-label from French to English
- Loading states: `aria-busy="true"` already present ✅
- Error states: `role="alert"` already present ✅

### Performance Check
- `next/image` used on all vehicle images ✅
- Images have `fill` + `sizes` for CLS prevention ✅
- Priority flag on hero/above-fold images ✅
- No global Stripe import ✅
- No operator/admin code imported in public routes ✅
- No CSS `@import` font loading in globals.css (uses system Inter stack) ✅
- Public routes are build-safe when backend unavailable (try/catch in page.tsx) ✅

### Max-Width Consistency
- Catalog loading skeleton was `max-w-6xl`, page is `max-w-7xl`. Fixed to match.
- Vehicle detail loading skeleton same fix applied.

### Responsive
- Catalog grid: `sm:grid-cols-2 lg:grid-cols-3` — mobile-first collapse ✅
- Hero: responsive grid with `lg:grid-cols-[1.05fr_0.95fr]` — collapses to single column on mobile ✅
- Sticky panel: `lg:sticky lg:top-24` — only sticks on large screens, flows normally on mobile ✅
- No horizontal overflow risk from grid usage ✅

### What Was NOT Changed
- No new design tokens introduced
- No redesign of layout structure
- No changes to backend, API adapters, or vehicle-service
- No booking, payment, documents, SSE, or operator/admin code touched
- No imports from `src/_spa_reference`
- No AppStore or localStorage business state
- No fake vehicles, ratings, or availability

## Known Limitations

1. **`/book/[vehicleId]` route**: Not implemented. The "Continue to booking" CTA is honest about this — a small disclaimer note is visible below the CTA. This is intentional.
2. **Dark mode**: Not complete. Token set is incomplete. Not shipped as a user-visible feature — the current implementation is light-only.
3. **Category filter active state**: Uses color contrast plus `aria-current="page"`. No sr-only text label currently inside the filter button for the active state. The `aria-current` attribute serves as the semantic signal.
4. **Automated axe/Lighthouse tests**: Not run in this phase. Manual review conducted.
5. **i18n**: UI is English-only. `lang="en"` is set correctly. Multilingual support is deferred.
6. **hero-car.png/webp assets**: Present in `public/` as untracked files. These are unrelated SPA reference assets — not imported into production routes.

## What Remains for Phase 3

Phase 3 (booking/payment) should address:
- Implement `/book/[vehicleId]` with real backend `POST /reservations` + Idempotency-Key lifecycle
- Implement payment flow with Stripe loaded only inside the payment route boundary
- Connect `/reservations/my`, `/reservations/:id`, and cancellation endpoints
- Implement document upload presign/confirm flow
- Implement waiting room with SSE + polling fallback + reconnect
- Implement smart ticket from `GET /reservations/:id`
- Implement operator document review and delivery screens
- Run Playwright + axe automated accessibility test suite
- Run Lighthouse for Core Web Vitals baseline
- Complete dark mode token set or remove toggle entirely
