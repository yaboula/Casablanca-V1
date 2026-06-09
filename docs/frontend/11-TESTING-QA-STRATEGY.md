# Testing and QA Strategy

## Goals

- Verify backend contract alignment.
- Prevent mock logic from returning to production flows.
- Prove customer booking-to-ticket journey.
- Prove operator handoff workflow.
- Protect auth/session/role gates.

## Unit Tests

Cover:

- adapters
- formatters
- status mapping
- next-action derivation
- form schema validation
- API error normalization

## Adapter Tests

Required adapter tests:

- vehicle list/detail
- reservation detail
- reservation list/dashboard item
- document list
- operator delivery
- pending document review
- admin vehicle/user/stats

Adapter tests should use backend-like fixtures, not Emergent mocks.

## Form Validation Tests

Cover:

- login/register
- booking dates/customer fields
- payment step preconditions
- document upload requirements
- operator rejection reason
- admin vehicle form including `licensePlate`

## Auth/Session Tests

Cover:

- login creates session
- register creates session
- refresh rotates session
- logout clears session and calls backend logout
- expired session redirects to login
- browser JS cannot read access/refresh tokens

## Route Guard Tests

Cover:

- customer route without session redirects
- operator route denies `USER`
- admin route denies `USER` and `OPERATOR`
- authenticated user redirected away from login where appropriate

## Playwright E2E Flows

P1 flows:

- public catalog browse
- login/register
- catalog -> detail -> booking -> payment -> confirmation
- confirmation -> check-in -> waiting -> smart ticket
- dashboard next action

P2 flows:

- operator pending document approval
- operator QR/manual check-in
- operator completion

P3 flows:

- admin stats/users/vehicles
- vehicle create/update includes `licensePlate`

## Smoke Tests

Minimum smoke:

- app loads
- `/catalog` loads vehicles
- login works
- protected route redirects
- booking page can create reservation in test mode
- dashboard loads reservations

## Manual QA Checklist

- desktop and mobile route navigation
- no fake refs visible as primary identity
- no "demo mode" production copy
- no mock reservation fallback
- all primary CTAs work
- loading and error states are understandable
- back/forward browser behavior is reasonable

## Visual QA Checklist

- hero first viewport has clear brand/product signal
- catalog cards align and do not overflow
- forms fit mobile
- ticket card fits mobile
- operator rows are tappable
- admin tables/forms are readable
- status badges have text and color

## Accessibility Checks

- keyboard navigation
- visible focus states
- labels on inputs
- alt text for vehicle images
- aria-live for waiting/SSE updates where appropriate
- no color-only status communication
- contrast on badges and buttons

## Browser/Mobile Checks

Check at least:

- Chrome desktop
- mobile viewport around 390px width
- tablet-ish viewport
- wide desktop

Use Playwright screenshots for critical routes after implementation.

## Backend Dependency Assumptions

- backend reachable at configured base URL
- Postgres/Redis available for full e2e
- Stripe can run in bypass/test mode where appropriate
- S3 bypass or test upload strategy available
- seeded users exist for customer/operator/admin e2e

## Test Data Strategy

- use backend seeds where possible
- create test users/reservations through APIs
- avoid relying on frontend mocks
- cleanup or isolate tests through test database
- use deterministic fixtures for adapter/unit tests

