# Implementation Roadmap

## Phase 0: Inventory and Preservation

| Item | Detail |
|---|---|
| Goal | Preserve useful references before reconstruction |
| Expected outcome | Clear inventory of Emergent visual components and previous functional patterns |
| Likely files/folders | current `src/components`, previous stable `src/app`, `src/lib`, `src/stores`, `e2e` |
| Reuse | Emergent visual assets/components, old functional route ideas |
| Rebuild | none |
| Validation commands | `git status`, `rg`, `git show`, route/component inventories |
| Definition of Done | no useful reference is lost; migration plan is clear |
| Commit name | no commit required unless documentation is updated |
| Risks | accidentally deleting useful visual assets |
| Stop conditions | unclear ownership of active frontend baseline |

## Phase 1: Next Foundation + Auth/Session + Shell

| Item | Detail |
|---|---|
| Goal | Establish final Next App Router foundation |
| Expected outcome | Next route groups, auth/session proxy, protected routes, visual shell |
| Likely files/folders | `src/app`, `src/lib/api`, `src/lib/auth`, `src/components/layout`, `src/components/ui` |
| Reuse | old proxy/session ideas, Emergent shell/header visual direction |
| Rebuild | auth pages, route groups, session helpers |
| Validation commands | `npm run build`, auth smoke, protected route smoke |
| Definition of Done | login/register/session/logout work; protected routes redirect correctly |
| Commit name | `frontend-next-foundation-and-session` |
| Risks | mixed SPA/Next routing, token exposure |
| Stop conditions | auth contract mismatch or backend unavailable |

## Phase 2: Public Home/Catalog/Detail

| Item | Detail |
|---|---|
| Goal | Build public acquisition and browsing flow |
| Expected outcome | `/`, `/catalog`, `/catalog/[vehicleId]` live on backend vehicles |
| Likely files/folders | `src/app/(public)`, `src/features/catalog`, `src/components/marketing` |
| Reuse | Emergent hero/catalog visuals, old fetch and mapping ideas |
| Rebuild | vehicle adapters, real filters, public route data loading |
| Validation commands | `npm run build`, catalog/detail smoke, responsive visual QA |
| Definition of Done | no mock vehicles in production catalog/detail |
| Commit name | `frontend-public-catalog-and-detail` |
| Risks | unsupported filters, fake ratings/specs |
| Stop conditions | backend vehicle contract changed unexpectedly |

## Phase 3: Booking/Payment/Confirmation

| Item | Detail |
|---|---|
| Goal | Create real reservation and payment flow |
| Expected outcome | booking creates backend reservation with Stripe PaymentIntent and confirmation route |
| Likely files/folders | `src/app/book`, `src/app/reservations`, `src/features/booking`, `src/lib/stripe` |
| Reuse | old Stripe provider concept, Emergent booking visuals |
| Rebuild | idempotent create flow, forms, payment, confirmation |
| Validation commands | `npm run build`, booking e2e, payment retry smoke |
| Definition of Done | no fake refs/payment; duplicate submit protected |
| Commit name | `frontend-booking-payment-confirmation` |
| Risks | duplicate reservation attempts, wrong price display |
| Stop conditions | Stripe publishable key/config missing beyond test bypass needs |

## Phase 4: Check-in/Waiting/Ticket/Dashboard

| Item | Detail |
|---|---|
| Goal | Complete customer post-booking journey |
| Expected outcome | document upload, waiting room, smart ticket, dashboard all use backend truth |
| Likely files/folders | `src/app/reservations/[reservationId]`, `src/app/dashboard`, `src/features/documents`, `src/features/waiting-room` |
| Reuse | old check-in/SSE/ticket/dashboard patterns, Emergent ticket styling |
| Rebuild | upload lifecycle, SSE proxy, UUID routes, dashboard adapters |
| Validation commands | `npm run build`, customer journey e2e, SSE manual check |
| Definition of Done | check-in -> waiting -> ticket works from backend state |
| Commit name | `frontend-customer-postbooking-journey` |
| Risks | stale SSE state, rejection flow confusion |
| Stop conditions | S3/upload config cannot be exercised or bypassed safely |

## Phase 5: Operator Console

| Item | Detail |
|---|---|
| Goal | Build real airport operator workflow |
| Expected outcome | deliveries, pending docs, approve/reject, scan/manual check-in, complete |
| Likely files/folders | `src/app/operator`, `src/features/operator` |
| Reuse | old operator route family, Emergent operator visual polish |
| Rebuild | all mutations and queue handling |
| Validation commands | `npm run build`, operator e2e, role guard checks |
| Definition of Done | operator can approve docs and complete pickup flow |
| Commit name | `frontend-operator-console` |
| Risks | operator UI too decorative, conflict handling weak |
| Stop conditions | backend operator seed/test account unavailable |

## Phase 6: Admin Console

| Item | Detail |
|---|---|
| Goal | Build admin users/fleet/stats surfaces |
| Expected outcome | admin views match hardened backend, including `licensePlate` |
| Likely files/folders | `src/app/operator/admin`, `src/features/admin` |
| Reuse | old admin IA/forms |
| Rebuild | adapters/forms and destructive action UX |
| Validation commands | `npm run build`, admin smoke, role guard checks |
| Definition of Done | stats/users/vehicles work with backend endpoints |
| Commit name | `frontend-admin-console` |
| Risks | destructive actions unclear, license plate omitted |
| Stop conditions | admin user unavailable |

## Phase 7: E2E and Hardening

| Item | Detail |
|---|---|
| Goal | Prove final frontend works end to end |
| Expected outcome | Playwright coverage for core flows and role access |
| Likely files/folders | `e2e`, `playwright.config.ts`, fixtures, page objects |
| Reuse | old Playwright structure |
| Rebuild | tests for new paths and hardened backend |
| Validation commands | `npm run test:e2e`, `npm run build`, focused smoke |
| Definition of Done | customer and operator happy paths pass |
| Commit name | `frontend-e2e-and-hardening` |
| Risks | flaky auth/session, local env drift |
| Stop conditions | backend/docker/test data unavailable |

