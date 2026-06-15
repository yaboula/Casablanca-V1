# 09 — Interaction Model

**Scope:** Every critical interaction, in a fixed format. Defines confirmation, disabling, and feedback rules.
**Read after:** `08_SCREEN_BY_SCREEN_SPECIFICATION.md`. Uses states (`10`) and permissions (`11`).

---

## 1. Format

Each interaction specifies:

`ID · Name · Level · Trigger · UI surface · Available options · Disabled rules · Confirmation rules · Success feedback · Failure feedback · Edge cases`

## 2. Global interaction principles

These apply to all interactions and are not repeated per entry unless they differ.

1. **One primary action per surface.** Visually dominant; secondary actions are subordinate.
2. **Destructive/critical actions are never one-click.** They open a confirmation that states consequences and (where money/state changes) requires a reason.
3. **Disabled, not hidden, for state reasons; hidden for permission reasons.** If an action is unavailable because of the entity's state, show it disabled with a tooltip explaining why. If it is unavailable because of permission, hide it (or show a locked affordance) per `11`.
4. **Feedback is always given.** Every action produces a success or failure signal; nothing happens silently.
5. **Failure preserves input.** A failed action keeps the user's entered values and explains what went wrong with a retry path.
6. **Optimistic only when safe.** Non-critical UI (filters, toggles) may update optimistically; money/state changes wait for confirmation of success.
7. **Critical actions capture context for audit.** Reasons/amounts entered flow to `M-14`.
8. **Validation timing follows the standard in `18 §3`** (reward-early/punish-late); money actions follow `18 §5`; errors follow the `18 §4` taxonomy; all interaction copy comes from `19 §3`.
9. **Every interaction is keyboard-operable and announced per `16`** (focus management `A11Y-013`, status announcements `A11Y-040`, financial error-prevention `A11Y-034`). Perceived response targets the Doherty budget (`18 §7`).

## 3. Feedback vocabulary

| Signal | When | Form |
|---|---|---|
| Inline success toast | Action completes | Brief confirmation, auto-dismiss; includes undo where reversible |
| In-context update | Action changes visible data | The affected row/section updates and reflects the new state |
| Inline error | Action fails | Message near the action/field; retry; preserve input |
| Blocking error modal | Critical failure mid-flow | Explains, offers retry/cancel, never loses data |
| Confirmation modal | Before critical action | States consequences + reason field where required |
| Progress indicator | Action takes time | Button busy state; surface stays interactive where possible |

---

## 4. Critical interactions

### INT-001 — Open an item from the Command Center
- **Level:** P0
- **Trigger:** Click a blocker/alert/list item on `SCR-010`.
- **UI surface:** Card/list row.
- **Available options:** Open detail; (for alerts) acknowledge/snooze.
- **Disabled rules:** None for open; acknowledge disabled if not permitted.
- **Confirmation rules:** None for open; snooze of a critical alert confirms.
- **Success feedback:** Navigates to the relevant detail screen.
- **Failure feedback:** If the target failed to load, the detail screen shows its load error (not the Command Center).
- **Edge cases:** Item resolved by someone else meanwhile → detail shows current (resolved) state; Command Center refreshes.

### INT-010 — Apply filter / select state segment
- **Level:** P0
- **Trigger:** Select a segment or filter on a list screen.
- **UI surface:** Segment bar / filter controls.
- **Available options:** Single or combined filters; clear all.
- **Disabled rules:** Incompatible filter combinations are prevented or reconciled.
- **Confirmation rules:** None.
- **Success feedback:** List updates; active filters shown as removable chips; result count visible.
- **Failure feedback:** If the filtered query fails, inline error + retry; previous results retained where possible.
- **Edge cases:** No results → empty-with-clear state; filters persist within the session.

### INT-011 — Search (list-scoped and global)
- **Level:** P0
- **Trigger:** Type in list search or global search.
- **UI surface:** Search field / global overlay.
- **Available options:** Query by reference/customer/phone/vehicle/invoice/staff (scope-dependent).
- **Disabled rules:** None.
- **Confirmation rules:** None.
- **Success feedback:** Debounced results; empty query restores full list.
- **Failure feedback:** Search error inline + retry.
- **Edge cases:** Very short query → guidance; permission-gated entities never appear in results.

### INT-020 — Cancel a reservation
- **Level:** P0
- **Trigger:** Cancel on `SCR-021` or row quick-cancel on `SCR-020`.
- **UI surface:** Confirmation modal.
- **Available options:** Confirm cancel; cancel-and-refund (if paid); abort.
- **Disabled rules:** Disabled with tooltip if reservation is active/completed or already cancelled; hidden without cancel capability.
- **Confirmation rules:** Always. Modal shows current state, financial impact preview, and requires a reason. No one-click.
- **Success feedback:** Toast + reservation moves to `cancelled`; financial consequence reflected; Command Center/list updates; audit entry created.
- **Failure feedback:** Inline error in modal; reason and choice preserved; retry.
- **Edge cases:** Refund required → chains to INT-031; reservation changed state mid-flow → modal warns and re-validates; no-show cancel uses a no-show reason.

### INT-021 — Reassign vehicle
- **Level:** P0
- **Trigger:** Reassign on `SCR-021`.
- **UI surface:** Reassign drawer.
- **Available options:** Select an available compatible vehicle for the dates/location; confirm; abort.
- **Disabled rules:** Only genuinely available vehicles are selectable; confirm disabled until one chosen; hidden without modify capability.
- **Confirmation rules:** Confirmation summarizes the change and any price/category delta before commit.
- **Success feedback:** Toast + case shows the new vehicle; availability recalculated; audit entry.
- **Failure feedback:** Inline error; selection preserved; retry.
- **Edge cases:** No compatible vehicle → empty state, no forced choice; chosen vehicle becomes unavailable mid-flow → re-validate and warn; price change → shown and acknowledged.

### INT-022 — Modify reservation details
- **Level:** P0
- **Trigger:** Modify on `SCR-021`.
- **UI surface:** Modify drawer.
- **Available options:** Edit dates/terminal/driver/extras; save; abort.
- **Disabled rules:** Non-modifiable in certain states (disabled + tooltip); hidden without capability.
- **Confirmation rules:** If price/availability changes, the delta is shown and confirmed before save.
- **Success feedback:** Toast + case reflects changes; audit entry.
- **Failure feedback:** Inline validation/errors; input preserved.
- **Edge cases:** Change creates a conflict → blocked with explanation; partial validity → field-level errors.

### INT-023 — Force-unblock / override
- **Level:** P0
- **Trigger:** Override on a blocker in `SCR-021`.
- **UI surface:** Heavy confirmation modal (visually distinct from routine confirmations).
- **Available options:** Confirm override; escalate to operator review instead; abort.
- **Disabled rules:** Hidden unless the profile has override capability; document overrides may be restricted to escalation.
- **Confirmation rules:** Mandatory reason; explicit statement of the risk being accepted; strong visual treatment; never casual.
- **Success feedback:** Toast + blocker overridden + case readiness updates + prominent audit entry; case may be flagged money-at-risk.
- **Failure feedback:** Inline error; reason preserved.
- **Edge cases:** Underlying blocker resolves normally before override → offer to cancel the override; repeated overrides surface in audit/reports.

### INT-030 — Reconcile / flag discrepancy
- **Level:** P0
- **Trigger:** Reconcile on `SCR-050`/`SCR-051`.
- **UI surface:** Reconcile modal.
- **Available options:** Mark reconciled; flag discrepancy (+ note); abort.
- **Disabled rules:** Hidden without finance capability.
- **Confirmation rules:** Marking reconciled confirms; flagging requires a note.
- **Success feedback:** Toast + transaction status updates; linked case reflects.
- **Failure feedback:** Inline error; note preserved.
- **Edge cases:** Transaction changed (e.g., refunded) since load → re-validate.

### INT-031 — Issue a refund
- **Level:** P0
- **Trigger:** Refund on `SCR-051` (or chained from cancel).
- **UI surface:** Refund modal.
- **Available options:** Full or partial amount; reason (required); confirm; abort.
- **Disabled rules:** Disabled with explanation if not refundable; partial amount validated against the original/refundable amount; hidden without refund capability.
- **Confirmation rules:** Always; shows original, refundable, entered amount, and resulting balance; reason mandatory; no one-click.
- **Success feedback:** Toast + transaction shows refund; case/customer financials update; prominent audit entry.
- **Failure feedback:** Blocking error in modal; amount/reason preserved; retry.
- **Edge cases:** Amount exceeds refundable → blocked with message; double-submit prevented (busy state); partial refunds accumulate correctly.

### INT-032 — Record a charge / adjustment
- **Level:** P0
- **Trigger:** Record charge on `SCR-051` or from damage on `SCR-061`.
- **UI surface:** Charge modal.
- **Available options:** Type (damage/extra/fine), amount, reason, evidence link; save; abort.
- **Disabled rules:** Hidden without finance capability; amount must be positive.
- **Confirmation rules:** Save confirms; reason required; evidence link encouraged when from handover damage.
- **Success feedback:** Toast + balance updates; charge attached to case/customer; audit entry.
- **Failure feedback:** Inline validation; input preserved.
- **Edge cases:** Linked handover evidence missing → allow but flag; duplicate charge guard.

### INT-033 — Capture / release a security deposit
- **Level:** P0
- **Trigger:** Capture/release on the deposit row of `SCR-051` (or chained from handover return on `SCR-061`).
- **UI surface:** Deposit resolution modal.
- **Available options:** Capture (toward assessed charges, evidence-linked) and/or release remainder; reason (required); confirm; abort.
- **Disabled rules:** Capture gated by `PERM-033` (it is a charge from the deposit); release gated by `PERM-032` (it returns held funds); capture amount cannot exceed the held deposit (`20 FIN-061`).
- **Confirmation rules:** Restates held amount, amount to capture, amount to release, linked evidence (for capture), and reason before commit (`18 FV-022`); never one-click.
- **Success feedback:** Toast + `CMP-009` updates (deposit resolved); excess over the deposit routes to a separate charge (`INT-032`); audit entry created.
- **Failure feedback:** Inline error; entered amounts/reason preserved.
- **Edge cases:** Authorization expired before return → prompt re-authorization; partial capture leaves a release remainder; double-submit prevented. Full rules in `20 §8`.

### INT-040 — Block / unblock a vehicle
- **Level:** P0
- **Trigger:** Block/unblock on `SCR-031` or `SCR-030` row.
- **UI surface:** Block modal.
- **Available options:** Reason (required), optional period; confirm; abort. Unblock confirms simply.
- **Disabled rules:** Hidden without fleet capability.
- **Confirmation rules:** Block requires a reason; if upcoming reservations are impacted, the modal lists them and suggests reassignment.
- **Success feedback:** Toast + vehicle status updates; impacted reservations flagged; audit entry.
- **Failure feedback:** Inline error; reason preserved.
- **Edge cases:** Blocking a currently-rented vehicle → restricted/explained; unblock returns to available only if no other constraint.

### INT-041 — Add/edit/deactivate vehicle
- **Level:** P0
- **Trigger:** Add/edit/deactivate on Fleet.
- **UI surface:** Vehicle drawer; deactivate confirmation.
- **Available options:** Fill/edit fields; save; deactivate (soft) vs delete.
- **Disabled rules:** Certain fields locked when an active reservation exists (explained); delete disabled if active rentals reference it.
- **Confirmation rules:** Deactivate/delete confirm and explain impact; soft-deactivate is the default.
- **Success feedback:** Toast + fleet updates.
- **Failure feedback:** Inline validation; input preserved.
- **Edge cases:** Editing during active rental → restricted set; attempting hard delete with history → blocked, offer deactivate.

### INT-050 — Add note / set risk flag
- **Level:** P0
- **Trigger:** On `SCR-041` (or `SCR-021`).
- **UI surface:** Note drawer / risk-flag modal.
- **Available options:** Write note; set/clear flag with reason; save.
- **Disabled rules:** Hidden without customer edit capability.
- **Confirmation rules:** Setting/clearing a risk flag requires a reason.
- **Success feedback:** Toast + note appears attributed/timestamped; flag propagates to case views.
- **Failure feedback:** Inline error; text preserved.
- **Edge cases:** Removing a flag is audited; long notes handled gracefully.

### INT-060 — Create staff / assign role
- **Level:** P0
- **Trigger:** Create on `SCR-070`; change role on `SCR-071`.
- **UI surface:** Create drawer / role-change modal.
- **Available options:** Enter identity; select role template/custom role; confirm.
- **Disabled rules:** Hidden without staff capability; cannot select a role beyond own authority; cannot self-escalate; cannot remove last-owner/last-admin protection.
- **Confirmation rules:** Role change shows a capability diff, assigned-staff impact, sensitive-capability warnings, and confirms with reason when access changes are sensitive.
- **Success feedback:** Toast + staff/role updates; audit entry.
- **Failure feedback:** Inline error; input preserved.
- **Edge cases:** Self-lockout prevented; removing last admin blocked; sensitive grants may require approval per `23`; role behavior follows `22`.

### INT-062 — Create / edit custom role
- **Level:** P0
- **Trigger:** Create custom role, clone template, or edit role on `SCR-072`.
- **UI surface:** Custom-role editor drawer + permission diff panel.
- **Available options:** Clone a default template; edit role name/description; toggle domain-grouped capabilities; preview; save draft; submit for approval; abort.
- **Disabled rules:** Hidden without `PERM-052`; sensitive grants disabled without `PERM-066`; locked system capabilities cannot be removed if business recovery would be unsafe.
- **Confirmation rules:** Always shows capability diff, screens/actions/data gained/lost, assigned staff affected, dependency changes, and separation-of-duties warnings. Sensitive changes require a reason and may require approval.
- **Success feedback:** Toast + role version updates; affected staff access summary refreshes; audit entry created.
- **Failure feedback:** Inline validation/conflict; draft preserved.
- **Edge cases:** Self-escalation blocked; last-owner/last-admin protected; stale role version triggers conflict review; behavior follows `22` and governance in `23`.

### INT-061 — Suspend / deactivate staff
- **Level:** P0
- **Trigger:** On `SCR-071`.
- **UI surface:** Confirmation modal.
- **Available options:** Suspend / deactivate / reactivate; reason; confirm.
- **Disabled rules:** Cannot deactivate the last admin; cannot deactivate self into lockout.
- **Confirmation rules:** Confirms + reason.
- **Success feedback:** Toast + access revoked/restored; audit entry.
- **Failure feedback:** Inline error.
- **Edge cases:** Active sessions of the affected user handled gracefully.

### INT-070 — Edit a setting / business rule
- **Level:** P0
- **Trigger:** Edit on `SCR-081`.
- **UI surface:** Item drawer + preview + save.
- **Available options:** Edit values; preview; save; revert.
- **Disabled rules:** Save disabled until valid; hidden without settings capability; owner-only sections restricted.
- **Confirmation rules:** Critical changes show a preview before save; governed changes require reason, versioning, effective date, and approval where specified in `23`; navigating away with unsaved changes triggers a guard.
- **Success feedback:** Toast + applies going forward; audit entry.
- **Failure feedback:** Inline validation; input preserved.
- **Edge cases:** Change affecting active rentals → explained as forward-only; existing reservations are protected from silent retroactive changes; invalid combination → blocked with message.

### INT-071 — Configure financial policy
- **Level:** P0
- **Trigger:** Add/edit policy rule, submit policy draft, approve, schedule, or rollback on `SCR-082`.
- **UI surface:** Guarded rule-builder drawer + policy simulator + approval/rollback modal.
- **Available options:** Choose preset; edit structured rule table; preview; simulate; save draft; submit for approval; approve/reject; schedule; rollback; abort.
- **Disabled rules:** Hidden without financial-policy capability; save disabled until validation passes; arbitrary formulas/code/free logic unavailable by design; approval disabled for the draft author where separation of duties requires another approver.
- **Confirmation rules:** Sensitive changes restate policy area, old/new value, customer/admin/operator impact, affected future reservations, effective date, and reason. High-risk changes require approval per `23`.
- **Success feedback:** Toast + policy version status updates (`draft`, `pending approval`, `scheduled`, `active`); simulator snapshot and audit entry created.
- **Failure feedback:** Inline validation/conflict; draft values preserved; stale draft prompts compare/reload.
- **Edge cases:** Existing reservations keep prior policy version unless explicitly selected with preview/reason; rollback creates a new version; conflicting rules blocked before save; full rules in `21`.

### INT-080 — Open/schedule incident or maintenance (P1)
- **Level:** P1
- **Trigger:** On `SCR-090`/`SCR-091`/`SCR-031`.
- **UI surface:** Incident/maintenance drawer.
- **Available options:** Fill details; optionally block vehicle; schedule period; confirm.
- **Disabled rules:** Hidden without maintenance capability.
- **Confirmation rules:** Scheduling checks reservation conflicts; conflicts must be acknowledged or resolved.
- **Success feedback:** Toast + vehicle availability reflects; impacted reservations flagged; audit entry.
- **Failure feedback:** Inline error; input preserved.
- **Edge cases:** Conflict with confirmed reservation → suggest reassignment; recurring damage surfaced.

### INT-090 — Create / edit pricing rule (P1)
- **Level:** P1
- **Trigger:** On `SCR-110`.
- **UI surface:** Rule editor drawer + preview.
- **Available options:** Define condition/effect; set precedence; enable/disable; preview; save.
- **Disabled rules:** Save disabled until valid; hidden without pricing capability.
- **Confirmation rules:** Preview of effect on sample prices before save; overlapping rules show precedence.
- **Success feedback:** Toast + rule list updates; audit entry.
- **Failure feedback:** Inline validation.
- **Edge cases:** Conflicting rules → precedence explainer; disabling a rule is immediate.

### INT-100 — Configure notification (P1)
- **Level:** P1
- **Trigger:** On `SCR-120`.
- **UI surface:** Toggle + template drawer + preview.
- **Available options:** Toggle on/off; edit template; preview; save.
- **Disabled rules:** Hidden without notification capability.
- **Confirmation rules:** Template previewable before enabling; enabling a mass-customer notification confirms.
- **Success feedback:** Toast + state updates.
- **Failure feedback:** Inline validation.
- **Edge cases:** Template variables missing → preview shows placeholders and warns.

### INT-110 — Acknowledge / snooze an alert
- **Level:** P0
- **Trigger:** On `SCR-010` alerts region.
- **UI surface:** Inline control / small confirmation.
- **Available options:** Acknowledge; snooze (duration); open.
- **Disabled rules:** Hidden if not permitted; critical alerts may not be dismissible, only actionable.
- **Confirmation rules:** Snoozing a critical alert confirms.
- **Success feedback:** Alert clears/acknowledged; count updates.
- **Failure feedback:** Inline error; alert remains.
- **Edge cases:** Alert auto-resolves (root cause fixed) → disappears regardless.

### INT-120 — Export a list / report
- **Level:** P0 (lists) / P1 (reports)
- **Trigger:** Export on a list/report.
- **UI surface:** Export options modal.
- **Available options:** Scope (current filter / all), format (CSV/print intent), confirm.
- **Disabled rules:** Hidden without view capability for the data.
- **Confirmation rules:** None beyond options.
- **Success feedback:** Download/print initiated; toast.
- **Failure feedback:** Inline error + retry.
- **Edge cases:** Large export → progress/async indication; empty data → disabled with explanation.

### INT-130 — Navigate away with unsaved changes
- **Level:** P0
- **Trigger:** Leaving a config/edit surface with unsaved edits.
- **UI surface:** Guard modal.
- **Available options:** Stay; discard and leave; (where possible) save and leave.
- **Disabled rules:** N/A.
- **Confirmation rules:** Always when unsaved changes exist.
- **Success feedback:** Honors the chosen path.
- **Failure feedback:** If save-and-leave fails, stays with error and preserved input.
- **Edge cases:** Browser back / route change both trigger the guard.

---

## 5. Interaction → use case → screen map

| Interaction | Use case | Primary screen |
|---|---|---|
| INT-020 Cancel | UC-012 | SCR-021/020 |
| INT-021 Reassign | UC-013 | SCR-021 |
| INT-022 Modify | UC-015 | SCR-021 |
| INT-023 Override | UC-014 | SCR-021 |
| INT-030 Reconcile | UC-041 | SCR-050/051 |
| INT-031 Refund | UC-042 | SCR-051 |
| INT-032 Charge | UC-043 | SCR-051/061 |
| INT-033 Deposit capture/release | UC-042 / UC-043 | SCR-051/061 |
| INT-040 Block vehicle | UC-023 | SCR-031/030 |
| INT-041 Add/edit vehicle | UC-022 | SCR-031 |
| INT-050 Note/flag | UC-032 | SCR-041 |
| INT-060 Create/assign role | UC-060/061 | SCR-070/071 |
| INT-061 Suspend staff | UC-062 | SCR-071 |
| INT-062 Custom role | UC-064 / access control (`22`) | SCR-072 |
| INT-070 Edit setting | UC-070/071/052 | SCR-081 |
| INT-071 Financial policy | UC-072 / financial policy configuration (`21`) | SCR-082 |
| INT-080 Incident/maintenance | UC-080/081 | SCR-090/091/031 |
| INT-090 Pricing rule | UC-100 | SCR-110 |
| INT-100 Notification | UC-110 | SCR-120 |
| INT-120 Export | UC-120 etc. | List/report screens |

## 6. Acceptance criteria (interaction-wide)

- No critical action is one-click; all show consequences and capture a reason where money/state changes.
- State-unavailable actions are disabled with an explanation; permission-unavailable actions are hidden/locked.
- Every action yields explicit success or failure feedback; failures preserve input.
- Mid-flow state changes are detected and re-validated, never silently overwritten.
- Reasons/amounts from critical actions are captured for audit (`M-14`).
