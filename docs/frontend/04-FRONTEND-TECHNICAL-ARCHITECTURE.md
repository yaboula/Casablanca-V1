# Frontend Technical Architecture

## Framework Baseline

The final frontend must use **Next.js App Router**. The current React Router SPA is not the production architecture.

Primary reasons:

- better fit for public catalog/landing SEO
- cleaner server/client separation
- secure cookie-backed auth proxy
- protected operator/admin route families
- easier backend integration with server helpers
- closer to the previous functional frontend

## Route Groups

Recommended route grouping:

```text
src/app/
  (public)/
  (auth)/
  (customer)/
  operator/
  api/
```

Route groups should separate concerns without changing public URLs.

## Server Components vs Client Components

| Use Server Components for | Use Client Components for |
|---|---|
| public data fetching where possible | forms |
| protected server-rendered operator/admin lists | Stripe Elements |
| initial reservation/dashboard data | upload widgets |
| route-level auth checks | SSE listeners |
| metadata and SEO | interactive filters |

Rule: fetch canonical backend data as close to the route as possible, then pass adapted view models into client components.

## Feature Folder Strategy

Use feature folders for domain behavior:

```text
src/features/
  auth/
  catalog/
  booking/
  reservations/
  documents/
  waiting-room/
  smart-ticket/
  dashboard/
  operator/
  admin/
```

Each feature may contain:

- service functions
- adapters
- schemas
- hooks
- feature components
- tests

## Recommended Folder Structure

```text
src/
  app/
  components/
    ui/
    layout/
    marketing/
    presentational/
  features/
  lib/
    api/
    auth/
    adapters/
    config/
    sse/
    stripe/
    validation/
    utils/
  stores/
  types/
  messages/
```

## API Proxy Route Handlers

Required route handlers:

| Handler | Purpose |
|---|---|
| `/api/v1/[...path]` | Proxy browser calls to backend `/api/v1` and inject Authorization from HttpOnly cookie |
| `/api/auth/session` | Create/clear frontend session cookies after login/register/logout |
| `/api/auth/refresh` | Refresh backend tokens using HttpOnly refresh cookie |
| `/api/sse/*` | Proxy SSE streams so tokens are not exposed in URLs |

## Fetch Model

Use two explicit helpers:

- `serverFetch`: server-only, reads cookies, injects bearer token, supports redirects on unauthorized access.
- `clientFetch` or `apiFetch`: browser-safe, calls Next proxy routes, handles errors and optional refresh retry.

All features should call typed service functions rather than raw fetch in page components.

## Environment Variables

Recommended variables:

| Variable | Use |
|---|---|
| `SERVER_API_BASE` or equivalent | Server-side backend URL, includes `/api/v1` or composes it safely |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | optional locale default |

Browser-exposed variables must not contain backend secrets or JWT secrets.

## Error Boundaries

Use segment-level boundaries for:

- public catalog/detail
- booking
- reservation journey pages
- operator
- admin

Error UI should translate backend errors into user action:

- unauthorized -> login
- forbidden -> not allowed
- not found -> route-specific not-found
- validation -> field-level feedback
- backend unavailable -> retry/support message

## Loading States

Every high-value route needs loading treatment:

- catalog skeleton grid
- vehicle detail skeleton
- booking step disabled/processing state
- document upload progress
- waiting room connection state
- operator queue loading rows
- admin table loading rows

## Build and Runtime Assumptions

- Frontend runs as Next app.
- Backend prefix is `/api/v1`.
- Backend is available through environment-configured base URL.
- Auth is cookie-backed through Next route handlers.
- Docker/local ports must be normalized during implementation.

## Migration Strategy from Current SPA

1. Inventory current Emergent visual components.
2. Port visual components into Next-compatible folders.
3. Restore Next App Router route groups.
4. Remove SPA router as production path.
5. Replace `AppStore` business logic with feature services, TanStack Query, and small draft stores.
6. Rebuild flows phase by phase.
7. Delete mock-only production routes once real equivalents exist.

