# State Management and Data Flow

## Ownership Rule

Backend-owned state must come from backend APIs. Frontend state is only for drafts, preferences, and temporary UI interactions.

## Backend-Owned State

| State | Source |
|---|---|
| current user | auth/me or session bootstrap |
| vehicles | `/vehicles`, `/vehicles/:id` |
| reservations | `/reservations/my`, `/reservations/:id` |
| pricing totals | reservation response |
| document statuses | `/documents/:reservationId` |
| waiting room state | reservation + documents + SSE |
| operator queues | operator endpoints |
| admin data | admin endpoints |

## Frontend-Owned State

| State | Storage |
|---|---|
| booking draft before reservation create | Zustand/sessionStorage allowed |
| current form field values | component state/react-hook-form |
| UI filters/sort | URL params or component state |
| locale preference | localStorage allowed |
| display currency preference | localStorage allowed |
| temporary operator panel UI | component state |

## TanStack Query Usage

Use TanStack Query for:

- client-side server state
- mutations
- refetch after mutations
- SSE-triggered invalidation
- optimistic UI only where rollback is safe and backend truth is refetched

Do not use Query cache as a substitute for backend status rules.

## Zustand Usage

Use Zustand only for:

- booking draft
- locale/currency display preference
- transient UI state

Do not store:

- reservations
- documents
- operator approvals
- payment status
- current backend status as durable truth

## No localStorage for Backend-Owned Entities

Production routes must not persist backend-owned entities in localStorage. This includes reservations, documents, operator queues, and admin data.

## Booking Draft Flow

1. user selects dates/location/vehicle
2. draft store holds incomplete form state
3. `POST /reservations` creates backend reservation using idempotency key
4. backend response becomes truth
5. draft store stores only reservation UUID needed for continuity, then can clear after confirmation

## Reservation Journey Flow

1. route loads reservation by UUID
2. adapter creates journey view model
3. UI derives next action from backend status and document statuses
4. mutations refetch canonical data

## Document Upload Flow

1. fetch reservation/documents
2. presign upload
3. direct upload to returned URL
4. confirm document
5. refetch document list
6. route to waiting room when required docs are uploaded

## Waiting Room SSE/Refetch Flow

1. fetch reservation and documents on mount
2. open SSE through Next proxy
3. on message, invalidate/refetch related queries or apply minimal local display update
4. on reconnect, refetch canonical data before trusting stream deltas
5. on error, show degraded live state but keep HTTP fallback

## Operator Flow Data Ownership

Operator actions must call backend:

- approve/reject document
- scan QR
- manual check-in
- complete reservation

After each action, refetch queue/detail data.

## Admin Flow Data Ownership

Admin screens must use backend data only:

- no mock users
- no mock vehicles
- no mock stats

Admin forms can hold local draft values, but saved state comes from backend responses.

## Mock Policy

Mocks are allowed only in:

- story/demo-only design exploration
- tests/fixtures
- isolated visual prototypes not reachable as production routes

Mocks are not allowed in production route logic.

