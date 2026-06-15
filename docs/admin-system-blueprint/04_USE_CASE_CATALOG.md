# 04 — Use Case Catalog

**Scope:** All meaningful P0/P1 admin use cases, in a fixed format, with stable IDs.
**Read after:** `03_INFORMATION_ARCHITECTURE.md`. Cross-references modules (`06`), screens (`08`), interactions (`09`).

---

## 1. Format

Every use case uses exactly these fields:

- **ID** · **Name** · **Actor** · **Business goal** · **Trigger** · **Preconditions** · **Main flow** · **Alternative flows** · **Required screens** · **Required data visible** · **Actions available** · **UX acceptance criteria** · **Risk if poorly implemented**

"Actor" uses default role templates from `02 §5` (`RP-1`..`RP-6`) and custom roles from `22`; "any admin" means any role with the relevant capability.

## 2. Use case index

| ID | Name | Module | Level |
|---|---|---|---|
| UC-001 | Understand the operational day in 30 seconds | M-01 | P0 |
| UC-002 | Resolve a blocked reservation from the Command Center | M-01 | P0 |
| UC-003 | Triage critical alerts | M-01 | P0 |
| UC-010 | Find a reservation by state | M-02 | P0 |
| UC-011 | Inspect a reservation case | M-02 | P0 |
| UC-012 | Cancel a reservation | M-02 | P0 |
| UC-013 | Reassign the vehicle on a reservation | M-02 | P0 |
| UC-014 | Force-unblock / override a reservation blocker | M-02 | P0 |
| UC-015 | Modify reservation details | M-02 | P0 |
| UC-016 | Create a reservation on behalf of a customer | M-02 | P0 (optional) |
| UC-020 | Review fleet availability and status | M-03 | P0 |
| UC-021 | Inspect a single vehicle | M-03 | P0 |
| UC-022 | Add or edit a vehicle | M-03 | P0 |
| UC-023 | Block / unblock a vehicle | M-03 | P0 |
| UC-024 | Track vehicle document expiry | M-03 | P0 |
| UC-030 | Look up a customer / driver | M-04 | P0 |
| UC-031 | Assess customer risk before release | M-04 | P0 |
| UC-032 | Add an internal note / risk flag | M-04 | P0 |
| UC-040 | See what money is owed before release | M-05 | P0 |
| UC-041 | Reconcile a payment / deposit | M-05 | P0 |
| UC-042 | Issue a refund | M-05 | P0 |
| UC-043 | Record a manual financial adjustment / charge | M-05 | P0 |
| UC-044 | Find and view an invoice / receipt | M-05 | P0 |
| UC-050 | Verify handover readiness for a case | M-06 | P0 |
| UC-051 | Review handover evidence after return | M-06 | P0 |
| UC-052 | Configure the handover process & contract terms | M-06 | P0 |
| UC-060 | Create a staff member | M-07 | P0 |
| UC-061 | Assign / change a role | M-07 | P0 |
| UC-062 | Suspend or deactivate a staff member | M-07 | P0 |
| UC-063 | Understand what a permission grants | M-07 | P0 |
| UC-064 | Create or edit a custom role | M-07 | P0 |
| UC-070 | Configure a business rule | M-08 | P0 |
| UC-071 | Manage locations, hours, extras, contract and non-financial settings | M-08 | P0 |
| UC-072 | Configure financial policies safely | M-08 | P0 |
| UC-080 | Open and manage an incident | M-09 | P1 |
| UC-081 | Schedule and close maintenance | M-09 | P1 |
| UC-090 | Read fleet occupancy on a calendar | M-10 | P1 |
| UC-091 | Detect and resolve a scheduling conflict | M-10 | P1 |
| UC-100 | Create / edit a pricing rule | M-11 | P1 |
| UC-110 | Configure customer / staff notifications | M-12 | P1 |
| UC-120 | Review business performance | M-13 | P1 |
| UC-130 | Investigate who changed what | M-14 | P1 |

---

## 3. P0 use cases

### UC-001 — Understand the operational day in 30 seconds
- **Actor:** RP-2 (Operations Manager); also RP-1, RP-3.
- **Business goal:** Comprehend today's risk and workload immediately on open.
- **Trigger:** Admin opens the app / Command Center.
- **Preconditions:** Authenticated; has Command Center access.
- **Main flow:** 1) App lands on Command Center. 2) Today summary loads: pickups, returns, expected/at-risk revenue. 3) Blocked reservations, pending payments, pending documents, vehicles in maintenance, and critical alerts are visible without scrolling past noise. 4) Admin scans, identifies the most urgent item, and clicks into it.
- **Alternative flows:** (a) Quiet day → all-clear empty states confirm nothing is blocked. (b) Data delayed → skeletons; partial sections render as they arrive. (c) A section errors → that card shows an inline error with retry; the rest still renders.
- **Required screens:** `SCR-010`.
- **Required data visible:** Count and value of today's pickups/returns; count of blocked cases with reasons summarized; pending payment total; pending document count; vehicles in maintenance count; prioritized critical alerts; money-at-risk total.
- **Actions available:** Open any item; jump to its module; dismiss/snooze non-critical alerts (where allowed).
- **UX acceptance criteria:** The four mental-model dimensions (time, state, risk, money) are each represented above the fold; no vanity metric appears; every number links to its underlying list.
- **Risk if poorly implemented:** Manager misses a blocker and a customer is stranded at the airport; product feels like a vanity dashboard.

### UC-002 — Resolve a blocked reservation from the Command Center
- **Actor:** RP-2; RP-3.
- **Business goal:** Clear a blocker before it causes an airport failure.
- **Trigger:** A blocked reservation appears in the Command Center blockers region.
- **Preconditions:** At least one reservation is blocked; admin has relevant capability.
- **Main flow:** 1) Admin clicks the blocked reservation. 2) Reservation case (`SCR-021`) opens with the blocking reason highlighted (e.g., deposit not authorized, document rejected, vehicle unavailable). 3) Admin takes the appropriate action: chase payment/deposit, escalate/override a document, reassign vehicle, or contact customer. 4) Case readiness updates; the blocker clears from the Command Center.
- **Alternative flows:** (a) Blocker cannot be resolved now → admin adds an internal note and leaves it flagged. (b) Multiple blockers on one case → all are listed; case stays blocked until all clear.
- **Required screens:** `SCR-010`, `SCR-021`, plus the target sub-surface (`SCR-051`, `SCR-031`, `SCR-041`).
- **Required data visible:** Blocking reason(s); what must happen to clear each; who/what is responsible; financial and document status; vehicle status.
- **Actions available:** Resolve-specific actions per blocker; add note; force-unblock with reason (capability-gated, audited).
- **UX acceptance criteria:** The blocking reason is shown inline, never hidden; each blocker has a concrete next action; force-unblock requires confirmation and a reason.
- **Risk if poorly implemented:** Blockers are visible but not actionable; admin must hunt across screens; cases silently stay blocked.

### UC-003 — Triage critical alerts
- **Actor:** RP-2; RP-3; RP-5 (fleet alerts); RP-4 (money alerts).
- **Business goal:** Act on the few things that genuinely require attention; ignore noise.
- **Trigger:** Critical alert indicator shows a count; admin opens alerts region.
- **Preconditions:** Authenticated; alerts exist.
- **Main flow:** 1) Admin opens alerts. 2) Alerts are prioritized (e.g., money-at-risk and blocked-pickup-today first). 3) Admin opens the top alert, acts, and the alert clears or is acknowledged.
- **Alternative flows:** (a) No alerts → calm "all clear" state. (b) Alert is informational → acknowledge/dismiss.
- **Required screens:** `SCR-010` (alerts region), target detail screen.
- **Required data visible:** Alert type, severity, affected entity, age, recommended action.
- **Actions available:** Open, act, acknowledge, snooze (where allowed).
- **UX acceptance criteria:** Alerts are prioritized and actionable; no undismissable wall of notifications; severity is visually distinct.
- **Risk if poorly implemented:** Alert fatigue; real risks buried under noise.

### UC-010 — Find a reservation by state
- **Actor:** Any admin with Reservations view.
- **Business goal:** Locate the right reservation case fast, organized by work, not date.
- **Trigger:** Admin opens Reservations or searches.
- **Preconditions:** Authenticated; reservations exist.
- **Main flow:** 1) Reservations list (`SCR-020`) opens segmented by state (`03 §7`). 2) Admin selects a state segment or applies filters/search. 3) Admin opens a case.
- **Alternative flows:** (a) No results → empty state with cleared-filter affordance. (b) Search by reference/customer/phone/vehicle. (c) Filter by date, vehicle, location, risk, money owed.
- **Required screens:** `SCR-020`, `SCR-150` (search).
- **Required data visible per row:** Reference, customer, vehicle, pickup/return time, state, blocking reason (if blocked), money-owed indicator, risk flag.
- **Actions available:** Open case; row quick actions (view customer, view vehicle, view money); bulk export (where allowed).
- **UX acceptance criteria:** State segments use canonical vocabulary; blocked rows show the reason; the list is not the end of a task (always routes to detail).
- **Risk if poorly implemented:** Flat table with no priority; admin cannot tell which case matters.

### UC-011 — Inspect a reservation case
- **Actor:** Any admin with Reservations view.
- **Business goal:** Understand a single reservation as a complete operational case.
- **Trigger:** Admin opens a reservation from any list/search/alert.
- **Preconditions:** Reservation exists; admin permitted.
- **Main flow:** 1) Reservation case (`SCR-021`) opens. 2) Admin reviews identity, vehicle, timing/location, documents, payment/deposit/balance, readiness, timeline. 3) Admin decides whether to act.
- **Alternative flows:** (a) Case is ready → confirm readiness, no action needed. (b) Case is blocked → proceed to UC-002/UC-014. (c) Case is active/completed → review only.
- **Required screens:** `SCR-021` with links to `SCR-041`, `SCR-031`, `SCR-051`, `SCR-061`.
- **Required data visible:** Customer identity context; vehicle context; pickup timing/location; document status; payment/deposit/desk-balance; release readiness; case timeline/history.
- **Actions available:** Cancel, reassign vehicle, modify, force-unblock, add note, view linked entities, view audit (P1).
- **UX acceptance criteria:** All four dimensions are present on one screen; readiness is unambiguous; every section links to its source of truth.
- **Risk if poorly implemented:** Admin must visit five screens to understand one reservation; decisions made on incomplete information.

### UC-012 — Cancel a reservation
- **Actor:** Admin with `PERM` cancel.
- **Business goal:** Cancel cleanly with correct financial consequence and a recorded reason.
- **Trigger:** Admin chooses Cancel on a case.
- **Preconditions:** Reservation is in a cancellable state; admin permitted.
- **Main flow:** 1) Admin clicks Cancel. 2) Confirmation modal explains consequences (refund/forfeit/deposit release) and requires a reason. 3) Admin confirms. 4) Reservation moves to cancelled; financial consequence is reflected; action is auditable.
- **Alternative flows:** (a) Reservation already active/completed → cancel disabled with explanation. (b) Refund required → links to refund flow (UC-042). (c) No-show handling → cancel with no-show reason.
- **Required screens:** `SCR-021`, confirmation modal, optional `SCR-051`.
- **Required data visible:** Current state; financial impact preview; reason field.
- **Actions available:** Confirm cancel; cancel-and-refund; abort.
- **UX acceptance criteria:** Never one-click; always shows financial impact and requires reason; disabled with explanation when not cancellable.
- **Risk if poorly implemented:** Accidental cancellation of paid reservations; lost money; disputes.

### UC-013 — Reassign the vehicle on a reservation
- **Actor:** Admin with reservation modify capability.
- **Business goal:** Swap to an available vehicle without creating a conflict.
- **Trigger:** Original vehicle unavailable (maintenance, damage, conflict).
- **Preconditions:** Case not yet completed; an alternative vehicle is available for the period.
- **Main flow:** 1) Admin opens reassign. 2) System shows available compatible vehicles for the dates/location. 3) Admin selects one; confirmation summarizes change and any price implication. 4) Confirm; vehicle updates; availability recalculated; auditable.
- **Alternative flows:** (a) No compatible vehicle available → clear empty state, no forced selection. (b) Different category/price → price difference shown before confirm.
- **Required screens:** `SCR-021`, reassign drawer/modal, links to `SCR-031`.
- **Required data visible:** Current vehicle; available alternatives with category, availability, price delta.
- **Actions available:** Select alternative; confirm; abort.
- **UX acceptance criteria:** Only genuinely available vehicles are selectable; price/category implications shown; confirmation required.
- **Risk if poorly implemented:** Double-booking; customer arrives to no car; silent price changes.

### UC-014 — Force-unblock / override a reservation blocker
- **Actor:** Admin with override capability (RP-1/RP-2).
- **Business goal:** Allow an exceptional release when the manager accepts the risk.
- **Trigger:** A case is blocked but the manager decides to override.
- **Preconditions:** Override capability; case is blocked.
- **Main flow:** 1) Admin chooses override on the blocker. 2) Modal states the risk being accepted and requires a reason. 3) Confirm; blocker is overridden; case readiness updates; strongly audited.
- **Alternative flows:** (a) Document blocker override → escalate to operator review instead. (b) Financial blocker override → flagged as money-at-risk.
- **Required screens:** `SCR-021`, override modal.
- **Required data visible:** What is being overridden; the accepted risk; reason field; who is overriding.
- **Actions available:** Confirm override; abort; escalate instead.
- **UX acceptance criteria:** Override is visually heavy, never casual; reason mandatory; clearly audited; available only to permitted profiles.
- **Risk if poorly implemented:** Routine overrides erode controls; money/risk leaks invisibly.

### UC-015 — Modify reservation details
- **Actor:** Admin with modify capability.
- **Business goal:** Correct dates/terminal/driver/extras without re-creating the reservation.
- **Trigger:** Customer request or correction.
- **Preconditions:** Case in a modifiable state.
- **Main flow:** 1) Admin opens modify. 2) Editable fields shown with current values; live recalculation of price/availability where relevant. 3) Confirm; case updates; auditable.
- **Alternative flows:** (a) Change creates a conflict → blocked with explanation. (b) Change affects price → delta shown and confirmed.
- **Required screens:** `SCR-021`, modify drawer.
- **Required data visible:** Editable fields, current values, price/availability impact.
- **Actions available:** Save; abort.
- **UX acceptance criteria:** Impact (price/availability) shown before save; conflicts prevented; changes recorded.
- **Risk if poorly implemented:** Silent inconsistent state; availability conflicts.

### UC-016 — Create a reservation on behalf of a customer (P0-optional)
- **Actor:** Admin with create capability.
- **Business goal:** Capture a phone/walk-in booking inside the system instead of off-platform.
- **Trigger:** Admin uses Create → Reservation.
- **Preconditions:** Customer can be selected/created; vehicle available.
- **Main flow:** 1) Admin selects/creates customer. 2) Selects vehicle, dates, terminal, driver. 3) Live price/availability shown. 4) Creates reservation; it enters the normal lifecycle.
- **Alternative flows:** (a) New customer → minimal create inline. (b) No availability → blocked.
- **Required screens:** Create reservation flow; links to `SCR-041`, `SCR-031`.
- **Required data visible:** Customer, vehicle, dates, terminal, driver, price, availability.
- **Actions available:** Create; abort.
- **UX acceptance criteria:** Reuses the same lifecycle and states as customer-created reservations; no special hidden state.
- **Risk if poorly implemented:** Parallel "admin reservations" that behave differently; data drift.

### UC-020 — Review fleet availability and status
- **Actor:** RP-5; RP-2.
- **Business goal:** Know what is available, rented, reserved, blocked, or in maintenance.
- **Trigger:** Admin opens Fleet.
- **Preconditions:** Vehicles exist.
- **Main flow:** 1) Fleet list (`SCR-030`) opens grouped/filterable by status. 2) Admin filters by status/category/location/availability. 3) Admin opens a vehicle.
- **Alternative flows:** (a) Empty fleet → onboarding empty state with "Add vehicle". (b) Filter to "blocked"/"maintenance" to triage.
- **Required screens:** `SCR-030`, `SCR-031`.
- **Required data visible per vehicle:** Identity, status (commercial + physical), category, location, next reservation, maintenance flag, expiring documents, basic profitability indicator.
- **Actions available:** Open; block/unblock; add vehicle; view occupancy (P1); export.
- **UX acceptance criteria:** Commercial vs physical status are distinguishable; reason for unavailability is visible; vehicle links to its reservations.
- **Risk if poorly implemented:** Vehicles treated as a public catalog; false availability; idle assets unnoticed.

### UC-021 — Inspect a single vehicle
- **Actor:** RP-5; RP-2.
- **Business goal:** Understand one vehicle as a controlled asset.
- **Trigger:** Open a vehicle from Fleet/case/calendar.
- **Preconditions:** Vehicle exists.
- **Main flow:** 1) Vehicle detail (`SCR-031`) opens. 2) Admin reviews status, upcoming reservations, documents, maintenance/incidents (P1), basic profitability, history. 3) Admin acts (block, edit, schedule maintenance).
- **Alternative flows:** (a) Vehicle blocked → reason and since-when shown. (b) Documents expiring → highlighted.
- **Required screens:** `SCR-031`, links to `SCR-021`, `SCR-091`, `SCR-100`.
- **Required data visible:** Status (both kinds), upcoming reservations, vehicle documents + expiry, maintenance/incident history (P1), revenue/cost indicators.
- **Actions available:** Edit, block/unblock, manage documents, schedule maintenance (P1), open incident (P1).
- **UX acceptance criteria:** Status and unavailability reasons explicit; documents with expiry surfaced; links to reservations and calendar.
- **Risk if poorly implemented:** Vehicle problems invisible until a customer is affected.

### UC-022 — Add or edit a vehicle
- **Actor:** RP-5 with fleet edit.
- **Business goal:** Maintain accurate fleet records.
- **Trigger:** Create → Vehicle, or Edit on a vehicle.
- **Preconditions:** Fleet edit capability.
- **Main flow:** 1) Form opens with required fields. 2) Admin fills identity, category, location, status, documents. 3) Validation; save; vehicle appears in fleet.
- **Alternative flows:** (a) Editing a vehicle with an active reservation → restricted fields explained. (b) Deactivate vs delete → soft deactivate by default with explanation.
- **Required screens:** Vehicle form (`SCR-031` edit mode).
- **Required data visible:** Field validation, current vs new values.
- **Actions available:** Save, deactivate, abort.
- **UX acceptance criteria:** Destructive actions (delete/deactivate) require confirmation and explain impact on active reservations; soft-deactivate is the default.
- **Risk if poorly implemented:** Deleting a vehicle tied to active rentals; inconsistent records.

### UC-023 — Block / unblock a vehicle
- **Actor:** RP-5; RP-2.
- **Business goal:** Take a vehicle out of (or back into) commercial availability with a recorded reason.
- **Trigger:** Admin chooses Block/Unblock on a vehicle.
- **Preconditions:** Fleet capability.
- **Main flow:** 1) Admin clicks Block. 2) Modal requires reason and optional period. 3) Confirm; vehicle becomes unavailable; affected upcoming reservations are flagged.
- **Alternative flows:** (a) Vehicle has upcoming reservations → warning lists impacted cases, suggests reassignment (UC-013). (b) Unblock → returns to available.
- **Required screens:** `SCR-031`, block modal.
- **Required data visible:** Reason field; impacted reservations; period.
- **Actions available:** Confirm; abort; jump to impacted reservations.
- **UX acceptance criteria:** Reason mandatory; impact on reservations shown; auditable.
- **Risk if poorly implemented:** Blocking a car silently breaks confirmed pickups.

### UC-024 — Track vehicle document expiry
- **Actor:** RP-5.
- **Business goal:** Avoid operating vehicles with expired documents.
- **Trigger:** Admin reviews fleet or receives an expiry alert.
- **Preconditions:** Vehicle documents recorded with dates.
- **Main flow:** 1) Expiring/expired documents surface on Command Center alerts and Fleet. 2) Admin opens the vehicle, reviews documents, updates them. 3) Expiry flag clears.
- **Alternative flows:** (a) Already expired → vehicle flagged as risk; suggest block.
- **Required screens:** `SCR-031`, `SCR-010`.
- **Required data visible:** Document type, expiry date, days remaining, status.
- **Actions available:** Update document; block vehicle; dismiss (where allowed).
- **UX acceptance criteria:** Expiry is proactive (before expiry), not only after; clearly linked to the vehicle.
- **Risk if poorly implemented:** Legal/insurance exposure from expired docs.

### UC-030 — Look up a customer / driver
- **Actor:** Any admin with customer view.
- **Business goal:** Find the right person and their full context.
- **Trigger:** Admin opens Customers or searches.
- **Preconditions:** Customers exist.
- **Main flow:** 1) Customers list (`SCR-040`) opens. 2) Admin searches by name/email/phone or filters by risk/history. 3) Opens the profile.
- **Alternative flows:** (a) Driver ≠ payer → both relationships visible. (b) No results → empty state.
- **Required screens:** `SCR-040`, `SCR-041`.
- **Required data visible per row:** Name, contact, reservation count, risk flag, outstanding money indicator.
- **Actions available:** Open; view reservations; add note.
- **UX acceptance criteria:** Risk and outstanding money visible at list level; payer vs driver distinguished.
- **Risk if poorly implemented:** Treating customers as a flat contact list; risk invisible.

### UC-031 — Assess customer risk before release
- **Actor:** RP-2; RP-3; RP-6.
- **Business goal:** Know who you are dealing with before handing over an expensive vehicle.
- **Trigger:** Admin reviews a customer in the context of a pending case.
- **Preconditions:** Customer profile exists.
- **Main flow:** 1) Profile (`SCR-041`) opens. 2) Admin reviews history, documents, prior incidents, outstanding payments, cancellations/no-shows, internal notes, risk flags. 3) Admin decides comfort level / adds a flag.
- **Alternative flows:** (a) New customer → thin history shown honestly, not faked. (b) Risky customer → risk flags prominent.
- **Required screens:** `SCR-041`, links to `SCR-021`, `SCR-051`.
- **Required data visible:** Basic data, reservation history, documents, incidents, payments/deposits, cancellations/no-shows, notes, risk flags, driver relationship.
- **Actions available:** Add note, set/clear risk flag, view linked reservations/payments.
- **UX acceptance criteria:** Risky history is visually distinct from normal history; sensitive data shown per permission.
- **Risk if poorly implemented:** Releasing a premium car to a high-risk customer unknowingly.

### UC-032 — Add an internal note / risk flag
- **Actor:** Admin with customer edit.
- **Business goal:** Capture institutional knowledge about a customer.
- **Trigger:** Admin adds a note/flag on a profile.
- **Preconditions:** Customer edit capability.
- **Main flow:** 1) Admin writes a note or toggles a risk flag with reason. 2) Save; note timestamped and attributed; flag visible across the customer's cases.
- **Alternative flows:** (a) Remove flag → requires reason; audited.
- **Required screens:** `SCR-041`.
- **Required data visible:** Existing notes (author, time), current flags.
- **Actions available:** Add/edit/remove note; set/clear flag.
- **UX acceptance criteria:** Notes are attributed and timestamped; flags propagate to case views; removal is audited.
- **Risk if poorly implemented:** Knowledge lost; flags that do not surface where needed.

### UC-040 — See what money is owed before release
- **Actor:** RP-4; RP-2; RP-3.
- **Business goal:** Never release a vehicle with unsecured money.
- **Trigger:** Admin reviews a case or the Payments module.
- **Preconditions:** Reservation has financial state.
- **Main flow:** 1) Payments (`SCR-050`) or the case money section shows payment status, deposit/authorization, desk balance, extras, charges. 2) Admin identifies what is unsecured. 3) Admin acts (chase, reconcile, refuse release).
- **Alternative flows:** (a) Fully secured → green readiness. (b) Balance due → flagged; release should be gated.
- **Required screens:** `SCR-050`, `SCR-021`, `SCR-051`.
- **Required data visible:** Payment status, deposit/authorization status, desk balance, extras, damage charges, refunds, invoice presence.
- **Actions available:** Open transaction; reconcile; refund; record adjustment; export.
- **UX acceptance criteria:** Money is never reduced to "paid/unpaid"; each component (paid/deposit/balance/charges/refund) is explicit; unsecured money is visually distinct.
- **Risk if poorly implemented:** Vehicles released with money outstanding; recurring losses.

### UC-041 — Reconcile a payment / deposit
- **Actor:** RP-4.
- **Business goal:** Confirm the recorded financial state matches reality.
- **Trigger:** Daily close or a discrepancy.
- **Preconditions:** Payment records exist.
- **Main flow:** 1) Finance opens Payments, filters by date/status. 2) Reviews transactions, deposits, desk collections recorded by operators. 3) Marks reconciled / flags discrepancy.
- **Alternative flows:** (a) Discrepancy → flag + note; link to the case. (b) Missing receipt → request/attach.
- **Required screens:** `SCR-050`, `SCR-051`.
- **Required data visible:** Transaction list with source, amount, method, status, linked reservation.
- **Actions available:** Mark reconciled; flag discrepancy; add note; export.
- **UX acceptance criteria:** Every transaction links to its reservation; desk collections (operator-recorded) are visible to finance; export available.
- **Risk if poorly implemented:** Finance cannot trust the numbers; manual Excel reconciliation persists.

### UC-042 — Issue a refund
- **Actor:** Admin with refund capability (RP-4; RP-1).
- **Business goal:** Return money correctly, with reason and trail.
- **Trigger:** Cancellation, dispute, overcharge.
- **Preconditions:** Refundable transaction; refund capability.
- **Main flow:** 1) Admin opens the transaction, chooses Refund. 2) Modal: amount (full/partial), reason required, impact preview. 3) Confirm; refund recorded; case/customer financials update; strongly audited.
- **Alternative flows:** (a) Partial refund → amount entry validated against original. (b) Not refundable → disabled with explanation.
- **Required screens:** `SCR-051`, refund modal.
- **Required data visible:** Original amount, refundable amount, reason field, resulting balance.
- **Actions available:** Confirm refund; abort.
- **UX acceptance criteria:** Amount validated; reason mandatory; never one-click; audited; capability-gated.
- **Risk if poorly implemented:** Over-refunds, fraud, untracked money movement.

### UC-043 — Record a manual financial adjustment / charge
- **Actor:** RP-4.
- **Business goal:** Capture damage charges, extras, fines against a reservation/customer.
- **Trigger:** Damage/extra/fine arises (often post-return).
- **Preconditions:** Capability; linked reservation/customer.
- **Main flow:** 1) Admin adds a charge with type, amount, reason, optional evidence link (handover photos). 2) Save; charge attached; balance updates; auditable.
- **Alternative flows:** (a) Linked to handover damage evidence → reference the handover record.
- **Required screens:** `SCR-051`, charge modal, link to `SCR-061`.
- **Required data visible:** Charge type, amount, reason, evidence link, resulting balance.
- **Actions available:** Save; abort; attach evidence reference.
- **UX acceptance criteria:** Charges are typed and justified; linkable to handover evidence; audited.
- **Risk if poorly implemented:** Unjustifiable charges; disputes; lost revenue.

### UC-044 — Find and view an invoice / receipt
- **Actor:** RP-4; RP-2.
- **Business goal:** Retrieve financial documents per reservation/customer.
- **Trigger:** Admin opens Invoices or a case money section.
- **Preconditions:** Invoice/receipt exists.
- **Main flow:** 1) Invoices (`SCR-052`) lists documents, filterable by date/customer/reservation. 2) Admin opens/exports a document.
- **Alternative flows:** (a) No invoice yet → state explains why (not yet generated).
- **Required screens:** `SCR-052`, links to `SCR-051`, `SCR-021`.
- **Required data visible:** Document type, number, amount, date, linked reservation/customer, status.
- **Actions available:** View; export/download; link to reservation.
- **UX acceptance criteria:** Every document links to its reservation; export available; missing document explained.
- **Risk if poorly implemented:** Documents scattered; disputes hard to resolve.

### UC-050 — Verify handover readiness for a case
- **Actor:** RP-3; RP-2.
- **Business goal:** Confirm a case is genuinely ready for vehicle release.
- **Trigger:** Admin checks a case approaching pickup.
- **Preconditions:** Reservation near pickup.
- **Main flow:** 1) Admin opens the case handover section (or `SCR-060`/`SCR-061`). 2) Reviews the readiness checklist: contract present, identity verified, payment/deposit cleared, vehicle available. 3) Confirms readiness or identifies the gap.
- **Alternative flows:** (a) Not ready → the specific missing step is shown. (b) Ready → readiness confirmed.
- **Required screens:** `SCR-021`, `SCR-060`, `SCR-061`.
- **Required data visible:** Checklist steps with status; contract state; evidence presence.
- **Actions available:** Open the failing step; mark/observe readiness (execution stays with operator at the desk).
- **UX acceptance criteria:** Readiness is a clear checklist; reflects (not replaces) the operator's physical process; gaps are explicit.
- **Risk if poorly implemented:** Admin contradicts operator state; double source of truth.

### UC-051 — Review handover evidence after return
- **Actor:** RP-2; RP-5; RP-4 (for charges).
- **Business goal:** Use documented evidence to resolve damage/charges and disputes.
- **Trigger:** A rental returns; evidence is captured.
- **Preconditions:** Handover record exists with out/in evidence.
- **Main flow:** 1) Admin opens the handover record (`SCR-061`). 2) Reviews out vs in photos, mileage/fuel, signed contract, pre-existing vs new damage. 3) If new damage → create a charge (UC-043) or open an incident (UC-080).
- **Alternative flows:** (a) Clean return → close. (b) Dispute → evidence supports the decision.
- **Required screens:** `SCR-061`, links to `SCR-051`, `SCR-091`.
- **Required data visible:** Contract + signature, out/in photos, mileage/fuel out/in, damage notes, who confirmed.
- **Actions available:** Create charge; open incident (P1); export evidence.
- **UX acceptance criteria:** Out vs in are clearly compared; damage is attributable; evidence is linkable to charges.
- **Risk if poorly implemented:** Disputes unwinnable; damage costs absorbed by the business.

### UC-052 — Configure the handover process & contract terms
- **Actor:** RP-1; RP-2 with settings capability.
- **Business goal:** Define a consistent, documented handover and contract.
- **Trigger:** Admin edits handover/contract settings.
- **Preconditions:** Settings capability.
- **Main flow:** 1) Admin opens handover/contract settings (`SCR-081`). 2) Configures checklist steps, required evidence, contract terms, signature requirement. 3) Preview; save; applies going forward.
- **Alternative flows:** (a) Change with active rentals → explain it applies to new handovers.
- **Required screens:** `SCR-081`.
- **Required data visible:** Current checklist/terms; preview.
- **Actions available:** Edit, preview, save.
- **UX acceptance criteria:** Changes are previewable; business-language; do not retroactively rewrite completed handovers.
- **Risk if poorly implemented:** Inconsistent handovers; weak legal protection.

### UC-060 — Create a staff member
- **Actor:** RP-1; RP-6 with staff capability.
- **Business goal:** Onboard an employee with the right access.
- **Trigger:** Create → Staff.
- **Preconditions:** Staff capability.
- **Main flow:** 1) Admin enters staff identity and assigns a default role template or custom role. 2) Save; staff can access per assigned role.
- **Alternative flows:** (a) Reset credentials path. (b) Invite vs direct create.
- **Required screens:** `SCR-070`, staff form.
- **Required data visible:** Identity fields, role selection with capability summary.
- **Actions available:** Save; abort.
- **UX acceptance criteria:** Role selection shows what it grants (links to UC-063); no silent over-permissioning.
- **Risk if poorly implemented:** Over-permissioned staff; internal risk.

### UC-061 — Assign / change a role
- **Actor:** RP-1; RP-6.
- **Business goal:** Control what a staff member can do.
- **Trigger:** Admin edits a staff member's role.
- **Preconditions:** Staff capability.
- **Main flow:** 1) Admin opens staff detail (`SCR-071`). 2) Changes assigned default template/custom role; capability diff shown. 3) Confirm with reason where sensitive; access updates; audited.
- **Alternative flows:** (a) Removing one's own critical capability → guarded/blocked. (b) Downgrade → explains lost access.
- **Required screens:** `SCR-071`, `SCR-072`.
- **Required data visible:** Current role, target role, capability differences, assigned-staff/access impact.
- **Actions available:** Confirm; abort.
- **UX acceptance criteria:** Capability changes are explicit; self-lockout prevented; audited.
- **Risk if poorly implemented:** Accidental privilege escalation or lockout.

### UC-062 — Suspend or deactivate a staff member
- **Actor:** RP-1; RP-6.
- **Business goal:** Quickly revoke access when needed.
- **Trigger:** Departure/incident.
- **Preconditions:** Staff capability.
- **Main flow:** 1) Admin chooses Suspend/Deactivate. 2) Confirmation with reason. 3) Access revoked; audited.
- **Alternative flows:** (a) Reactivate path. (b) Cannot deactivate last admin → blocked with explanation.
- **Required screens:** `SCR-071`.
- **Required data visible:** Status; reason field; impact.
- **Actions available:** Suspend, deactivate, reactivate, abort.
- **UX acceptance criteria:** Confirmation + reason; last-admin protection; audited.
- **Risk if poorly implemented:** Orphaned access or accidental total lockout.

### UC-063 — Understand what a permission grants
- **Actor:** Any admin managing roles.
- **Business goal:** Configure access confidently without technical knowledge.
- **Trigger:** Admin reviews roles/permissions.
- **Preconditions:** Roles view capability.
- **Main flow:** 1) Admin opens Roles & Permissions (`SCR-072`). 2) Each capability is described in business language with the screens/actions it unlocks. 3) Admin reviews or adjusts a role template/custom role where allowed.
- **Alternative flows:** (a) Custom role creation via UC-064.
- **Required screens:** `SCR-072`.
- **Required data visible:** Capability name, plain-language description, what it unlocks, which templates/custom roles have it.
- **Actions available:** Toggle capability per role (where allowed); save.
- **UX acceptance criteria:** No technical permission strings; each capability explains its effect; critical capabilities are visually marked.
- **Risk if poorly implemented:** Misconfigured access; permissions invisible until they fail.

### UC-064 — Create or edit a custom role
- **Actor:** RP-1; permitted access-control admin.
- **Business goal:** Create a business-specific role without unsafe privilege combinations.
- **Trigger:** Create custom role or clone template on `SCR-072`.
- **Preconditions:** `PERM-052`; `PERM-066` for sensitive grants.
- **Main flow:** 1) Admin clones a default template. 2) Edits domain-grouped capabilities. 3) Reviews capability diff, assigned-staff impact, dependency warnings, and separation-of-duties warnings. 4) Saves draft or submits for approval. 5) Approved role becomes assignable.
- **Alternative flows:** (a) Self-escalation blocked. (b) Last-owner/last-admin protection blocks unsafe save. (c) Sensitive grant requires approval.
- **Required screens:** `SCR-072`.
- **Required data visible:** Template source, capability descriptions, critical markers, role diff, affected staff, version history.
- **Actions available:** Clone; edit; preview; save draft; submit; approve/reject where permitted.
- **UX acceptance criteria:** No technical permission strings; custom roles are diff-previewed, reasoned, audited, versioned, and governed by `22`/`23`.
- **Risk if poorly implemented:** Hidden privilege escalation; staff lockout; unreviewable access changes.

### UC-070 — Configure a business rule
- **Actor:** RP-1; RP-2 with settings capability.
- **Business goal:** Make the system match how the business actually works.
- **Trigger:** Admin edits Settings.
- **Preconditions:** Settings capability.
- **Main flow:** 1) Admin opens Settings hub (`SCR-080`), picks a section (`SCR-081`). 2) Edits values with preview. 3) Save; rules apply going forward.
- **Alternative flows:** (a) Invalid config → validation blocks save with explanation.
- **Required screens:** `SCR-080`, `SCR-081`.
- **Required data visible:** Current values; preview of effect.
- **Actions available:** Edit, preview, save.
- **UX acceptance criteria:** Sectioned, business-language; critical changes previewable; no giant unsectioned form.
- **Risk if poorly implemented:** Misconfiguration breaks pricing/availability silently.

### UC-071 — Manage locations, hours, extras, contract and non-financial settings
- **Actor:** RP-1; RP-2.
- **Business goal:** Configure the core operating parameters.
- **Trigger:** Admin opens a specific settings section.
- **Preconditions:** Settings capability.
- **Main flow:** 1) Admin opens the section. 2) Adds/edits items such as locations, business hours, extras catalog, notification template links, and contract terms. 3) Save. Financial policies such as tax, deposit, cancellation, refund, no-show, damage, currency, and release gate are configured in UC-072 / `SCR-082`.
- **Alternative flows:** Per-section validations; multi-location designed but optional in P0.
- **Required screens:** `SCR-081` (per section).
- **Required data visible:** Section items and their current configuration.
- **Actions available:** Add/edit/remove/reorder; save.
- **UX acceptance criteria:** Each section is self-contained; locations exist as a concept (forward-compatible) even if single-branch.
- **Risk if poorly implemented:** Unconfigurable to the real business; off-platform workarounds persist.

### UC-072 — Configure financial policies safely
- **Actor:** RP-1; RP-4 or permitted policy admin.
- **Business goal:** Configure payment, deposit, cancellation, no-show, refund, damage, protection, currency/tax, and release-gate policies without developer help.
- **Trigger:** Admin opens Financial Policies (`SCR-082`) from Settings or a money/release-gate explanation.
- **Preconditions:** `PERM-062` to edit; `PERM-063` to approve; `PERM-065` to simulate.
- **Main flow:** 1) Admin chooses a policy area. 2) Edits a preset or structured rule table. 3) Reviews validation, conflicts, customer/admin/operator impact, and simulator output. 4) Saves draft and submits for approval. 5) Approved change is scheduled with an effective date and version history.
- **Alternative flows:** (a) Conflict blocks save. (b) Existing reservations keep prior policy version. (c) Rollback creates a new governed version.
- **Required screens:** `SCR-082`; audit/history links to `SCR-140` where permitted.
- **Required data visible:** Active version, draft values, old/new diff, effective date, simulator results, affected future reservations, reason, approver.
- **Actions available:** Edit rule; preview; simulate; save draft; submit; approve/reject; schedule; rollback.
- **UX acceptance criteria:** No arbitrary formulas/code/free logic; every sensitive change is previewed, reasoned, audited, versioned, effective-dated, and governed by `21`/`23`.
- **Risk if poorly implemented:** Financial misconfiguration, customer disputes, unsafe release gates, and silent policy changes.

---

## 4. P1 use cases

### UC-080 — Open and manage an incident
- **Actor:** RP-5; RP-2.
- **Business goal:** Track vehicle problems through to resolution; keep unfit cars out of service.
- **Trigger:** Damage/fault reported (often from handover return).
- **Preconditions:** Maintenance module enabled; vehicle exists.
- **Main flow:** 1) Admin opens incident with type, severity, description, evidence link, affected vehicle. 2) Optionally blocks the vehicle. 3) Tracks status to resolution; records cost.
- **Alternative flows:** (a) Recurring damage → visible pattern on the vehicle. (b) Resolve → vehicle returns to fleet.
- **Required screens:** `SCR-090`, `SCR-091`, links to `SCR-031`, `SCR-061`.
- **Required data visible:** Incident status, severity, vehicle, cost, evidence, timeline.
- **Actions available:** Open, update, block vehicle, record cost, resolve.
- **UX acceptance criteria:** Incident links the vehicle, evidence, and cost; resolving updates fleet availability.
- **Risk if poorly implemented:** Problem cars keep getting rented; downtime untracked.

### UC-081 — Schedule and close maintenance
- **Actor:** RP-5.
- **Business goal:** Plan maintenance before it disrupts reservations.
- **Trigger:** Maintenance due / inspection required.
- **Preconditions:** Maintenance module enabled.
- **Main flow:** 1) Admin schedules maintenance for a vehicle and period. 2) Vehicle availability reflects the block; impacted reservations flagged. 3) On completion, close and return to fleet.
- **Alternative flows:** (a) Conflicts with reservations → warning + reassignment suggestion.
- **Required screens:** `SCR-090`, `SCR-091`, `SCR-100`.
- **Required data visible:** Schedule, period, impacted reservations, status.
- **Actions available:** Schedule, reschedule, close.
- **UX acceptance criteria:** Maintenance windows show on calendar and affect availability; conflicts surfaced.
- **Risk if poorly implemented:** Maintenance double-books a reserved car.

### UC-090 — Read fleet occupancy on a calendar
- **Actor:** RP-2; RP-3; RP-5.
- **Business goal:** See occupancy and gaps visually.
- **Trigger:** Admin opens Calendar.
- **Preconditions:** Calendar enabled; reservations/maintenance exist.
- **Main flow:** 1) Calendar (`SCR-100`) opens (day/week/month). 2) Admin scopes by vehicle/category/location/status. 3) Reads occupancy, gaps, returns feeding next pickups.
- **Alternative flows:** (a) Click a block → open the reservation. (b) Empty period → highlighted as sellable gap.
- **Required screens:** `SCR-100`, links to `SCR-021`, `SCR-031`.
- **Required data visible:** Per-vehicle timeline of reservations, maintenance blocks, gaps.
- **Actions available:** Change scope/zoom; open a block; navigate dates.
- **UX acceptance criteria:** Overlaps/conflicts are visually obvious; blocks link to their reservation; maintenance distinguished from rentals.
- **Risk if poorly implemented:** A pretty calendar that hides conflicts.

### UC-091 — Detect and resolve a scheduling conflict
- **Actor:** RP-2.
- **Business goal:** Catch overlaps before they strand a customer.
- **Trigger:** Two reservations (or maintenance) overlap on one vehicle.
- **Preconditions:** Calendar enabled.
- **Main flow:** 1) Conflict is visually flagged on the calendar/case. 2) Admin opens the conflicting cases. 3) Reassigns a vehicle (UC-013) or adjusts dates.
- **Alternative flows:** (a) No alternative vehicle → escalate.
- **Required screens:** `SCR-100`, `SCR-021`.
- **Required data visible:** Conflicting items, vehicle, periods.
- **Actions available:** Reassign, modify dates, escalate.
- **UX acceptance criteria:** Conflicts are unmistakable; resolution path is one or two clicks away.
- **Risk if poorly implemented:** Conflicts discovered at the desk, too late.

### UC-100 — Create / edit a pricing rule
- **Actor:** RP-1 with pricing capability.
- **Business goal:** Adjust prices by season/category/duration without per-vehicle edits.
- **Trigger:** Admin opens Pricing Rules.
- **Preconditions:** Pricing module enabled.
- **Main flow:** 1) Admin opens Pricing (`SCR-110`). 2) Creates/edits a rule in plain language (e.g., high season +20%, weekend +10%, 7+ days -8%, airport fee fixed). 3) Preview effect on sample prices; save.
- **Alternative flows:** (a) Conflicting/overlapping rules → precedence shown. (b) Disable a rule.
- **Required screens:** `SCR-110`.
- **Required data visible:** Rule list, conditions, effect, precedence, preview.
- **Actions available:** Create, edit, enable/disable, preview, save.
- **UX acceptance criteria:** Rules are human-readable; effect is previewable before save; precedence is explicit.
- **Risk if poorly implemented:** Unexpected prices shown to customers; revenue errors.

### UC-110 — Configure customer / staff notifications
- **Actor:** RP-2 with notification capability.
- **Business goal:** Automate reminders and alerts to cut manual messaging and no-shows.
- **Trigger:** Admin opens Notifications.
- **Preconditions:** Notifications module enabled.
- **Main flow:** 1) Admin opens Notifications (`SCR-120`). 2) Configures which events notify which audience (customer/staff/manager/finance) and the template. 3) Preview; enable.
- **Alternative flows:** (a) Disable a notification. (b) Preview a template with sample data.
- **Required screens:** `SCR-120`.
- **Required data visible:** Event → audience → channel/template mapping; enabled state; preview.
- **Actions available:** Toggle, edit template, preview.
- **UX acceptance criteria:** Grouped by audience; previewable; no spammy defaults.
- **Risk if poorly implemented:** Notification spam or silence; eroded trust.

### UC-120 — Review business performance
- **Actor:** RP-1; RP-2.
- **Business goal:** Turn operations into decisions (revenue, utilization, cancellations, profitability).
- **Trigger:** Admin opens Reports.
- **Preconditions:** Reports enabled; sufficient operational data.
- **Main flow:** 1) Admin opens Reports (`SCR-130`). 2) Selects a decision area and date range. 3) Reads the metric and drills into the underlying list.
- **Alternative flows:** (a) Insufficient data → honest empty/low-confidence state. (b) Export a report.
- **Required screens:** `SCR-130`, drill-down to relevant lists.
- **Required data visible:** Revenue, fleet utilization, conversion, cancellations/no-shows, maintenance cost, outstanding payments, repeat rate, vehicle profitability.
- **Actions available:** Change range/scope; drill down; export.
- **UX acceptance criteria:** Reports are organized by decisions, not chart types; every metric drills into its source; low-data honesty.
- **Risk if poorly implemented:** Misleading analytics; decisions on bad data.

### UC-130 — Investigate who changed what
- **Actor:** RP-6; RP-1.
- **Business goal:** Accountability and trust for critical actions.
- **Trigger:** A dispute, anomaly, or routine supervision.
- **Preconditions:** Audit enabled.
- **Main flow:** 1) Admin opens Audit (`SCR-140`) or the history on a case/vehicle/customer. 2) Filters by entity, actor, action, date. 3) Reads who did what, when, and the captured reason.
- **Alternative flows:** (a) From a case → see only that case's critical actions. (b) By staff member → their critical actions.
- **Required screens:** `SCR-140`, history panels on `SCR-021`/`SCR-031`/`SCR-041`.
- **Required data visible:** Actor, action, target, timestamp, reason/context.
- **Actions available:** Filter, open target, export.
- **UX acceptance criteria:** Readable in business language (not a raw technical log); accessible in-context (inside the case) and globally; reasons captured by critical actions appear here.
- **Risk if poorly implemented:** No accountability; disputes unresolvable; abuse hidden.

---

## 5. Coverage check

Every P0 module (M-01..M-08) and every P1 module (M-09..M-14) has at least one use case. Critical interventions and governed changes (cancel, reassign, override, refund, charge, block, role change, custom role edit, financial policy change) each have a dedicated use case and map to a confirmation or governance interaction in `09`. Mental-model coverage: time (UC-001, UC-090), state (UC-010, UC-050), risk (UC-031, UC-080), money (UC-040..UC-044, UC-072).
