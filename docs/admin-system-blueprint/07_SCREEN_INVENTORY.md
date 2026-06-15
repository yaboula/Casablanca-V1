# 07 — Screen Inventory

**Scope:** Master registry of every screen/view. The single source of truth for screen IDs.
**Read after:** `06_MODULE_SPECIFICATIONS_P0_P1.md`. Full per-screen specs in `08`.

---

## 1. Conventions

- A "screen" is a routable destination or a primary view a user navigates to. Modals, drawers, and popovers are **surfaces** within a screen (catalogued in §4 and specified in `09`), not screens.
- Screen IDs are stable (`SCR-###`) and never reused.
- Level is P0 or P1; P1 screens are present in IA but gated until built.

## 2. Primary screen registry

| Screen ID | Screen name | Module | Level | Route (UX) | Type | Primary entry points |
|---|---|---|---|---|---|---|
| `SCR-010` | Command Center | M-01 | P0 | `/admin` | Dashboard (action regions) | App open, logo/home |
| `SCR-020` | Reservations (list-by-state) | M-02 | P0 | `/admin/reservations` | List | Nav, Command Center, search |
| `SCR-021` | Reservation case detail | M-02 | P0 | `/admin/reservations/[id]` | Detail | List, search, alert, deep link |
| `SCR-030` | Fleet list | M-03 | P0 | `/admin/fleet` | List (cards) | Nav, Command Center |
| `SCR-031` | Vehicle detail | M-03 | P0 | `/admin/fleet/[id]` | Detail | Fleet list, case, calendar |
| `SCR-040` | Customers & drivers list | M-04 | P0 | `/admin/customers` | List | Nav, search |
| `SCR-041` | Customer profile | M-04 | P0 | `/admin/customers/[id]` | Detail | List, case, search |
| `SCR-050` | Payments & money control | M-05 | P0 | `/admin/payments` | List | Nav, Command Center, case |
| `SCR-051` | Transaction detail | M-05 | P0 | `/admin/payments/[id]` | Detail | Payments list, case |
| `SCR-052` | Invoices & receipts | M-05 | P0 | `/admin/invoices` | List | Nav, payments, case |
| `SCR-060` | Contracts & handover list | M-06 | P0 | `/admin/handover` | List | Nav, Command Center |
| `SCR-061` | Handover record detail | M-06 | P0 | `/admin/handover/[id]` | Detail | List, case, vehicle |
| `SCR-070` | Staff list | M-07 | P0 | `/admin/staff` | List | Nav |
| `SCR-071` | Staff member detail | M-07 | P0 | `/admin/staff/[id]` | Detail | Staff list |
| `SCR-072` | Roles & permissions | M-07 | P0 | `/admin/roles` | Config matrix | Nav, staff detail |
| `SCR-080` | Settings hub | M-08 | P0 | `/admin/settings` | Hub | Nav |
| `SCR-081` | Settings section detail | M-08 | P0 | `/admin/settings/[section]` | Config | Settings hub |
| `SCR-082` | Financial policies | M-08 | P0 | `/admin/settings/financial-policies` | Governed config | Settings hub, Payments, reservation money blocker |
| `SCR-090` | Maintenance & incidents list | M-09 | P1 | `/admin/maintenance` | List | Nav, Command Center, vehicle |
| `SCR-091` | Incident / maintenance detail | M-09 | P1 | `/admin/maintenance/[id]` | Detail | List, vehicle, handover |
| `SCR-100` | Calendar / occupancy | M-10 | P1 | `/admin/calendar` | Calendar | Nav, fleet, case |
| `SCR-110` | Pricing rules | M-11 | P1 | `/admin/pricing` | Config list | Nav, settings |
| `SCR-120` | Notifications & templates | M-12 | P1 | `/admin/notifications` | Config list | Nav, settings |
| `SCR-130` | Reports & analytics | M-13 | P1 | `/admin/reports` | Reports | Nav, Command Center |
| `SCR-140` | Audit logs | M-14 | P1 | `/admin/audit` | List | Nav, entity history panels |
| `SCR-150` | Global search results | Shell | P0 | `/admin/search` | Results | Global search |
| `SCR-160` | Admin profile & preferences | Shell | P0 | `/admin/me` | Settings (self) | Account menu |

## 3. Cross-cutting / system screens

| Screen ID | Screen name | Level | Purpose |
|---|---|---|---|
| `SCR-900` | Forbidden / no-access shell | P0 | Shown when a permitted-route is opened without capability (forbidden shell pattern, not a redirect). |
| `SCR-901` | Not-found | P0 | Entity/route not found. |
| `SCR-902` | Global error / recovery | P0 | Unrecoverable error boundary with retry/back. |
| `SCR-903` | Sign-in gate | P0 | Unauthenticated redirect to login (shared with existing app auth). |
| `SCR-904` | Offline / connection lost | P0 | Connectivity-lost banner/state for live regions. |

These patterns are specified once in `10` and reused everywhere.

## 4. Surfaces within screens (not screens)

Catalogued here for reference; behavior specified in `09` (interactions) and `12` (components).

| Surface | Type | Appears on | Notes |
|---|---|---|---|
| Cancel reservation | Modal | `SCR-021`, `SCR-020` row | Confirmed + reason + financial impact |
| Reassign vehicle | Drawer | `SCR-021` | Availability-aware |
| Modify reservation | Drawer | `SCR-021` | Price/availability preview |
| Force-unblock / override | Modal | `SCR-021` | Heavy, reason-required, audited |
| Refund | Modal | `SCR-051` | Amount + reason + preview |
| Record charge/adjustment | Modal | `SCR-051`, `SCR-061` | Typed + reason + evidence link |
| Reconcile / flag discrepancy | Modal | `SCR-050`/`SCR-051` | Finance |
| Block / unblock vehicle | Modal | `SCR-031`, `SCR-030` row | Reason + impacted reservations |
| Add/edit vehicle | Drawer | `SCR-030`/`SCR-031` | Soft-deactivate default |
| Manage vehicle documents | Drawer | `SCR-031` | Expiry-aware |
| Add note / risk flag | Drawer/Modal | `SCR-041` | Attributed, reason for flag |
| Create staff | Drawer | `SCR-070` | Role assignment |
| Change role | Modal | `SCR-071` | Capability diff |
| Suspend/deactivate staff | Modal | `SCR-071` | Last-admin protection |
| Capability description | Popover | `SCR-072` | Plain-language |
| Custom role editor | Drawer | `SCR-072` | Clone template, edit capabilities, preview diff |
| View as role simulator | Drawer | `SCR-072` | Preview screens/actions/data visible to a role |
| Settings item edit | Drawer | `SCR-081` | Preview + validation |
| Financial policy rule editor | Drawer | `SCR-082` | Guarded rule builder, no arbitrary formulas |
| Policy simulator | Drawer/modal | `SCR-082` | Preview sample booking/pickup/return/cancel/damage outcomes |
| Policy version comparison | Drawer | `SCR-082` | Before/after values, reason, approval, effective date |
| Policy approval / rollback | Modal | `SCR-082` | Reason, diff, effective date, audit |
| Open/schedule incident-maintenance | Drawer | `SCR-090`/`SCR-091`/`SCR-031` | Conflict check (P1) |
| Pricing rule editor | Drawer | `SCR-110` | Preview (P1) |
| Notification template editor | Drawer | `SCR-120` | Preview (P1) |
| Calendar block preview | Popover | `SCR-100` | Opens detail (P1) |
| Global search | Overlay | All (shell) | Keyboard-openable |
| Quick-create | Menu | All (shell) | Permission-gated |
| Export options | Modal | List screens | CSV/print intent |
| Unsaved-changes guard | Modal | Config screens | Navigate-away protection |
| Alert acknowledge/snooze | Modal | `SCR-010` | Where allowed |

## 5. Screen counts

| Level | Primary screens | System screens | Total |
|---|---:|---:|---:|
| P0 | 20 (`SCR-010`..`SCR-082`, `SCR-150`, `SCR-160`) | 5 | 25 |
| P1 | 7 (`SCR-090`..`SCR-140`) | — | 7 |
| **Total** | **27** | **5** | **32** |

## 6. Screen → use case → module map

| Screen | Module | Key use cases |
|---|---|---|
| `SCR-010` | M-01 | UC-001, UC-002, UC-003 |
| `SCR-020` | M-02 | UC-010 |
| `SCR-021` | M-02 | UC-011..UC-016, UC-050 |
| `SCR-030` | M-03 | UC-020 |
| `SCR-031` | M-03 | UC-021..UC-024 |
| `SCR-040` | M-04 | UC-030 |
| `SCR-041` | M-04 | UC-031, UC-032 |
| `SCR-050` | M-05 | UC-040, UC-041 |
| `SCR-051` | M-05 | UC-042, UC-043 |
| `SCR-052` | M-05 | UC-044 |
| `SCR-060` | M-06 | UC-050 |
| `SCR-061` | M-06 | UC-051 |
| `SCR-070` | M-07 | UC-060 |
| `SCR-071` | M-07 | UC-061, UC-062 |
| `SCR-072` | M-07 | UC-063, UC-064 |
| `SCR-080` | M-08 | UC-070 |
| `SCR-081` | M-08 | UC-052, UC-071 |
| `SCR-082` | M-08 | UC-072, financial policy configuration (`21`) |
| `SCR-090` | M-09 | UC-080, UC-081 |
| `SCR-091` | M-09 | UC-080, UC-081 |
| `SCR-100` | M-10 | UC-090, UC-091 |
| `SCR-110` | M-11 | UC-100 |
| `SCR-120` | M-12 | UC-110 |
| `SCR-130` | M-13 | UC-120 |
| `SCR-140` | M-14 | UC-130 |
| `SCR-150` | Shell | UC-010, UC-030 |
| `SCR-160` | Shell | Profile/preferences |

Every primary screen maps to at least one module and one use case; no orphan screens.
