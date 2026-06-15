# 10 — State & Edge-Case Matrix

**Scope:** The canonical state patterns and a per-screen state matrix. Ensures no dead ends.
**Read after:** `09_INTERACTION_MODEL.md`.

---

## 1. Canonical state patterns

Every screen/region must handle these states. Each has an ID so screens can reference it.

| ID | State | Definition | Required UX |
|---|---|---|---|
| `ST-001` | Loading | Data not yet available | Skeletons matching final layout; never a blank screen; per-region where regions load independently |
| `ST-002` | Empty (no data) | Query valid, nothing exists yet | Explanation + a next action (create/configure) where applicable; calm tone |
| `ST-003` | Empty (filtered) | Filters/search produce no matches | "No matches" + "clear filters"; preserve the filter chips |
| `ST-004` | Loaded / default | Data present | The normal content |
| `ST-005` | Partial error | Some regions failed | Failed region shows inline error + retry; other regions render |
| `ST-006` | Full error | The whole screen failed | Friendly error + retry + back; never blank |
| `ST-007` | Blocked | An entity cannot proceed | Blocking reason shown inline + the action(s) to clear it |
| `ST-008` | Permission-limited | Viewer lacks some capability | Gated sections hidden/summarized; gated actions hidden or disabled-locked |
| `ST-009` | Forbidden | Viewer lacks access to the whole screen | Forbidden shell (`SCR-900`), not a crash/redirect-loop |
| `ST-010` | Not-found | Entity/route does not exist | Not-found (`SCR-901`) + back/search |
| `ST-011` | Stale / changed-elsewhere | Data changed since load | Re-validate on action; non-destructive refresh prompt for live regions |
| `ST-012` | Offline / connection lost | Live updates interrupted | Banner (`SCR-904`); preserve input; auto-recover |
| `ST-013` | Action in progress | A mutation is running | Button busy state; prevent double-submit |
| `ST-014` | Action success | A mutation completed | Toast + in-context update (see `09 §3`) |
| `ST-015` | Action failure | A mutation failed | Inline/blocking error; preserve input; retry |
| `ST-016` | Low-data / low-confidence | Not enough data for a metric (reports) | Honest "not enough data yet"; no fabricated trend |

## 2. Empty-state copy intent (per module)

Empty states must give a next step, not a shrug. Copy is illustrative intent, not final wording.

| Module | Empty (no data) intent | Filtered-empty intent |
|---|---|---|
| M-01 Command Center | Per region "all clear" (calm); whole-screen onboarding for new accounts | N/A |
| M-02 Reservations | "No reservations yet" + create-on-behalf | "No matches — clear filters" |
| M-03 Fleet | "No vehicles yet — add your first vehicle" | "No vehicles match" |
| M-04 Customers | "No customers yet" | "No customers match" |
| M-05 Payments | "No transactions in range" | "No matches" |
| M-06 Handover | "No handover records yet" | "No records in this stage" |
| M-07 Roles/Staff | "Only you so far — add your team" | "No staff match" |
| M-08 Settings | Per section "not configured — add one" | N/A |
| M-08 Financial Policies | Starter presets available for review; no policy silently active | "No policy rules match" |
| M-09 Maintenance | "No open incidents" (calm) | "No matches" |
| M-10 Calendar | "No reservations in range" + show free capacity | N/A |
| M-11 Pricing | "No pricing rules — base price/day applies" | "No matches" |
| M-12 Notifications | Defaults present but off — "turn on reminders" | "No matches" |
| M-13 Reports | "Not enough data yet" | N/A |
| M-14 Audit | "No critical actions in range" | "No matches" |

## 3. Per-screen state matrix

Legend: ✔ = must implement; — = not applicable. All screens implement `ST-001`, `ST-004`, `ST-006`, `ST-009` (where route is gated) by default; the table highlights the additional notable states.

| Screen | ST-002 Empty | ST-003 Filtered | ST-005 Partial err | ST-007 Blocked | ST-008 Perm-limited | ST-011 Stale | ST-012 Offline | ST-016 Low-data |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| SCR-010 Command Center | ✔ | — | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| SCR-020 Reservations | ✔ | ✔ | — | ✔ | ✔ | ✔ | ✔ | — |
| SCR-021 Reservation case | — | — | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| SCR-030 Fleet | ✔ | ✔ | — | — | ✔ | ✔ | — | — |
| SCR-031 Vehicle | — | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| SCR-040 Customers | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-041 Customer profile | ✔ | ✔ | ✔ | — | ✔ | — | — | — |
| SCR-050 Payments | ✔ | ✔ | — | ✔ | ✔ | ✔ | — | — |
| SCR-051 Transaction | ✔ | — | ✔ | — | ✔ | ✔ | — | — |
| SCR-052 Invoices | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-060 Handover list | ✔ | ✔ | — | ✔ | ✔ | ✔ | — | — |
| SCR-061 Handover record | ✔ | — | ✔ | ✔ | ✔ | — | — | — |
| SCR-070 Staff | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-071 Staff detail | ✔ | — | ✔ | — | ✔ | — | — | — |
| SCR-072 Roles | — | ✔ | — | — | ✔ | ✔ | — | — |
| SCR-080 Settings hub | ✔ | — | — | — | ✔ | — | — | — |
| SCR-081 Settings section | ✔ | ✔ | — | — | ✔ | ✔ | — | — |
| SCR-082 Financial policies | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| SCR-090 Maintenance (P1) | ✔ | ✔ | — | ✔ | ✔ | ✔ | — | — |
| SCR-091 Incident (P1) | ✔ | — | ✔ | ✔ | ✔ | — | — | — |
| SCR-100 Calendar (P1) | ✔ | ✔ | — | ✔ | ✔ | ✔ | ✔ | — |
| SCR-110 Pricing (P1) | ✔ | ✔ | — | — | ✔ | ✔ | — | — |
| SCR-120 Notifications (P1) | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-130 Reports (P1) | ✔ | — | ✔ | — | ✔ | — | — | ✔ |
| SCR-140 Audit (P1) | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-150 Search | ✔ | ✔ | — | — | ✔ | — | — | — |
| SCR-160 Profile | — | — | — | — | — | — | — | — |

## 4. Reservation case state semantics

The reservation case (`SCR-021`) is the most state-rich surface. Canonical case states and their meaning (UX-level; aligned to the existing flow):

| Case state | Meaning | Primary visible signal | Typical next action |
|---|---|---|---|
| `Upcoming` | Confirmed, future, not yet ready | Neutral pill + readiness checklist | Monitor |
| `Payment pending` | Rental payment not secured | Money region flags pending | Chase / gate release |
| `Deposit pending` | Deposit/authorization not held | Money region flags deposit | Chase / gate release |
| `Document pending` | Documents awaiting review | Documents region flags pending | Supervise/escalate |
| `Document rejected` | A document was rejected | Reason shown inline | Customer re-upload / contact |
| `Blocked` | One or more blockers active | Blocking reasons listed | Resolve / override |
| `Ready for pickup` | All clearances met | Green readiness | None / confirm |
| `Active` | Vehicle with customer | Active pill + return timing | Monitor return |
| `Return due` | Return time reached/overdue | Time emphasis | Coordinate return |
| `Completed` | Returned and closed | Muted/closed | Review evidence/charges |
| `Cancelled / no-show` | Cancelled or no-show | Muted + reason | Handle refund/charge |

Blocking reasons (`ST-007`) are always shown with the state; a blocked case may have multiple reasons and stays blocked until all clear (or an audited override is applied — INT-023).

## 5. Cross-cutting edge cases

| Edge case | Where | Required behavior |
|---|---|---|
| Concurrent change (two admins) | All mutations | Re-validate on submit; show "changed since you loaded" and current value; never silently overwrite |
| Action on stale list row | Lists | Row action re-checks state; if changed, explain and refresh the row |
| Permission revoked mid-session | All | Next gated action shows forbidden/locked; no crash |
| Partial financial data | M-05, M-01 | Show known components; mark unknown explicitly; never imply "paid" when unknown |
| Vehicle becomes unavailable during reassign | INT-021 | Re-validate; remove from options; warn |
| Document re-upload after rejection | M-02, M-06 | Reflect new pending state; history preserved |
| Override then natural resolution | INT-023 | Offer to revert override; both events audited |
| Large dataset | Lists, calendar | Pagination/virtualization; performant skeletons; no full-page jank |
| Slow network | All | Skeletons; busy states; offline banner if lost |
| Brand-new tenant (no data anywhere) | All | Onboarding empties guiding to add vehicles + configure settings first |
| Time zone / "today" boundary | M-01, M-10 | "Today" is explicit and consistent across screens (see `00 §7`) |
| Money displayed without currency context | M-05 everywhere | Currency always shown; never a bare number for money |
| Financial policy draft conflicts | SCR-082 | Block save; show the contradictory rules and a safe correction path |
| Policy changes affecting existing reservations | SCR-082, SCR-021 | Existing reservations keep their policy version unless explicitly selected with preview, reason, and audit |
| Role edit removes critical recovery access | SCR-072 | Block if no owner/admin recovery path remains; explain last-owner/locked-capability rule |

## 6. State acceptance criteria

- Every screen implements loading, loaded, empty (where applicable), and full-error states.
- No screen can reach a blank/dead-end state; errors and empties always offer a next step.
- Blocked entities always show the reason inline (`ST-007`).
- Permission-limited and forbidden states are distinct and graceful (`ST-008`, `ST-009`).
- Concurrent/stale changes are detected and never silently overwritten (`ST-011`).
- Money is never shown ambiguously; unknown components are marked, not assumed.
- Reports honestly show low-data states (`ST-016`) instead of fabricating trends.
