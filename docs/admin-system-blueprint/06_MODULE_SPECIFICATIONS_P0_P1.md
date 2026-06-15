# 06 — Module Specifications (P0 & P1)

**Scope:** Deep functional specification for all 14 modules. This is the primary build reference, used alongside `08` (screens) and `09` (interactions).
**Read after:** `05_ADMIN_JOURNEY_MAPS.md`.

---

## How to read each module

Every module specifies the same fields:

`Level · Owning screens · Business value · Primary admin goal · User pain solved · Decisions enabled · Operator boundary · Main views · Required sections · Primary actions · Secondary actions · Search · Filters · Sorting · List/table/card behavior · Row actions · Bulk actions · Modals/drawers/menus · Empty state · Loading state · Error state · Permission-sensitive states · Responsive behavior · UX risks · Acceptance criteria`

States referenced here are detailed in `10`; permissions in `11`; interactions in `09`.

---

# M-01 — Command Center (P0)

- **Level:** P0
- **Owning screens:** `SCR-010`
- **Business value:** The screen that sells the product. Daily control, error reduction, time saved, premium perception. The manager understands the day in seconds and acts.
- **Primary admin goal:** Understand what is happening today and what requires action — and act — within the first minute.
- **User pain solved:** Today, managers piece together the day from WhatsApp, calls, Excel, and the operator screen. They miss blockers until a customer is stranded.
- **Decisions enabled:** Which blocker to resolve first; whether money is secured before pickups; whether the fleet is ready; which alert to act on.
- **Operator boundary:** Surfaces the health of operator work (queue/blockers) for **oversight**; it is not the operator's case queue and does not perform desk actions.
- **Main views:** Single dashboard composed of action regions (not a metrics wall): Today summary; Blocked reservations; Pickups today; Returns today; Pending payments; Pending documents; Vehicles in maintenance (P1-aware); Money at risk; Critical alerts; Quick actions.
- **Required sections:**
  - **Today summary** — pickups/returns counts, expected and at-risk revenue.
  - **Blockers** — list of blocked reservations with the concrete reason each.
  - **Money at risk** — total unsecured money against today's/near pickups.
  - **Documents pending** — count + link to the relevant cases.
  - **Fleet attention** — vehicles unavailable/maintenance/expiring docs.
  - **Critical alerts** — prioritized, actionable.
  - **Quick actions** — create reservation (on behalf), add vehicle, etc. (permission-gated).
- **Primary actions:** Open any item into its detail; resolve a blocker; act on the top alert.
- **Secondary actions:** Acknowledge/snooze non-critical alerts; change date context; navigate to a module.
- **Search:** Inherits the global search (`CMP-001`); no separate search.
- **Filters:** Optional scope by location (forward-compatible) and date context (today/tomorrow).
- **Sorting:** Within each region, sorted by urgency (soonest pickup / highest money at risk first); not user-sortable in P0.
- **List/table/card behavior:** Regions are compact action cards/lists, each capped with a "view all" link to the full module list. No infinite tables on the home.
- **Row actions:** Open; quick resolve where the action is unambiguous (e.g., open the payment).
- **Bulk actions:** None.
- **Modals/drawers/menus:** Alert acknowledge confirmation; quick-create menu.
- **Empty state:** Calm "all clear" per region ("No blocked reservations", "No money at risk today"). The whole-screen empty (brand new account) shows an onboarding nudge to add vehicles / configure settings.
- **Loading state:** Per-region skeletons; regions render independently as data arrives.
- **Error state:** Per-region inline error with retry; one failing region never blanks the screen.
- **Permission-sensitive states:** Finance-only regions (money at risk) hidden/again summarized for non-finance profiles; quick-create entries gated.
- **Responsive behavior:** Wide: multi-column region grid. Narrow: single-column priority stack (blockers and money at risk first).
- **UX risks:** Becoming a vanity dashboard; metric overload; alerts becoming noise.
- **Acceptance criteria:** All four mental-model dimensions present above the fold; every number links to its list; blockers show reasons; "all clear" is a real, calm state; no metric without a destination.

---

# M-02 — Reservations Management (P0)

- **Level:** P0
- **Owning screens:** `SCR-020` (list-by-state), `SCR-021` (case detail)
- **Business value:** Fewer lost/blocked reservations, fewer conflicts, central operational control, better service, traceability. The transactional heart of the admin.
- **Primary admin goal:** Control the full reservation lifecycle as **cases**, organized by work.
- **User pain solved:** Reservations scattered across channels with no clear status; blockers discovered too late; no single place to understand a reservation.
- **Decisions enabled:** What to fix to make a case ready; whether to cancel/modify/reassign; how to handle conflicts and at-risk cases.
- **Operator boundary:** This is a **control** view of cases by state, not the operator's desk queue. Admin intervenes exceptionally (cancel, reassign, override); the operator executes handoffs.
- **Main views:** List-by-state (`SCR-020`); single case detail (`SCR-021`).
- **Required sections (list):** State segments (`03 §7`); filter/search bar; result list. **Required sections (case detail):** Customer identity context; Vehicle context; Pickup timing & location; Documents status; Payment/Deposit/Desk balance; Release readiness; Timeline/history; Internal notes.
- **Primary actions:** Open case; resolve blocker; cancel; reassign vehicle; modify; force-unblock (gated).
- **Secondary actions:** Add note; view customer/vehicle/payment/handover; view audit (P1); export list.
- **Search:** By reservation reference, customer name, phone, vehicle. Instant within the list; global search routes here too.
- **Filters:** State segment; date range (pickup/return); vehicle/category; location; risk flag; money owed; document status; payment status.
- **Sorting:** By pickup time (default), return time, money owed, state, created date. Within a state segment, soonest-relevant first.
- **List/table/card behavior:** Each reservation is a rich row/case-card showing reference, customer, vehicle, pickup/return, state pill, blocking reason (if blocked), money-owed indicator, risk flag. Cards on narrow screens, dense rows on wide.
- **Row actions:** Open; view customer; view vehicle; view money; quick cancel (still confirmed).
- **Bulk actions:** Export selected; (P1) bulk notify. No bulk cancel in P0 (too risky).
- **Modals/drawers/menus:** Cancel confirmation (`INT`); reassign drawer; modify drawer; force-unblock modal; row action menu.
- **Empty state:** Per segment ("No blocked reservations"); whole-list empty ("No reservations yet"); no-results-after-filter with "clear filters".
- **Loading state:** List skeleton rows; case detail section skeletons.
- **Error state:** List load error with retry; case load error with retry; partial section errors isolated.
- **Permission-sensitive states:** Money sections summarized/hidden without finance capability; cancel/reassign/override actions hidden or disabled-with-tooltip without capability.
- **Responsive behavior:** Wide: list + persistent filters; case detail multi-panel. Narrow: stacked case cards; case detail tabbed sections.
- **UX risks:** Flat table without priority; hidden blocking reasons; ambiguous state changes; mixing active and historical without hierarchy.
- **Acceptance criteria:** A reservation is presented as a case (state+risk+money+customer+vehicle+docs+timeline) on one screen; blocked cases show the reason inline; all interventions are confirmed and reasoned; state vocabulary is canonical.

---

# M-03 — Fleet Management (P0)

- **Level:** P0
- **Owning screens:** `SCR-030` (list), `SCR-031` (vehicle detail)
- **Business value:** Protect the most expensive asset; better utilization; reliable availability; better planning; visibility into profitability.
- **Primary admin goal:** Know each vehicle's availability, physical state, commercial state, and use.
- **User pain solved:** Vehicles treated as a public catalog; false availability; idle cars unnoticed; expiring documents missed.
- **Decisions enabled:** Which vehicle to assign/reassign; which to block; which needs maintenance; which generates value; which documents to renew.
- **Operator boundary:** Pure admin/fleet domain; operators do not manage vehicles.
- **Main views:** Fleet list (`SCR-030`); vehicle detail (`SCR-031`).
- **Required sections (list):** Status segments; filters; vehicle list. **Required sections (detail):** Identity & specs; Commercial status; Physical status; Location; Upcoming reservations; Vehicle documents + expiry; Maintenance/incident history (P1); Basic profitability; History.
- **Primary actions:** Open vehicle; block/unblock; add vehicle; edit vehicle; manage documents.
- **Secondary actions:** Schedule maintenance (P1); open incident (P1); view occupancy on calendar (P1); export.
- **Search:** By plate/identifier, model, category.
- **Filters:** Status (`available/reserved/rented/maintenance/blocked/inactive`); category; location; availability for a date range; documents expiring; maintenance flag.
- **Sorting:** By status, category, next reservation, utilization/profitability indicator, document expiry.
- **List/table/card behavior:** Vehicle cards/rows show identity, dual status (commercial + physical), category, location, next reservation, flags (maintenance, expiring docs). Visual status pill.
- **Row actions:** Open; block/unblock; view reservations; view occupancy (P1).
- **Bulk actions:** Export; (P1) bulk status change with confirmation.
- **Modals/drawers/menus:** Block modal (reason + period + impacted reservations); add/edit vehicle drawer; document management drawer; deactivate confirmation.
- **Empty state:** "No vehicles yet — add your first vehicle" onboarding; no-results-after-filter.
- **Loading state:** Card grid skeletons; detail section skeletons.
- **Error state:** List/detail load errors with retry.
- **Permission-sensitive states:** Edit/block/deactivate hidden or disabled without fleet capability; profitability hidden without finance/owner capability.
- **Responsive behavior:** Wide: card grid + filters; detail multi-panel. Narrow: stacked cards; detail tabs.
- **UX risks:** Not distinguishing commercial vs physical status; hidden unavailability reasons; not linking vehicle to reservations; delete vs deactivate confusion.
- **Acceptance criteria:** Commercial and physical status are both visible and distinct; unavailability always shows a reason; blocking a vehicle surfaces impacted reservations; documents show expiry proactively; vehicle links to its reservations and calendar.

---

# M-04 — Customers & Drivers (P0)

- **Level:** P0
- **Owning screens:** `SCR-040` (list), `SCR-041` (profile)
- **Business value:** Less risk, better service for recurring/premium customers, less repeated work, better control, foundation for future CRM.
- **Primary admin goal:** Centralize identity, history, documents, and risk for customers and drivers.
- **User pain solved:** No memory of who a customer is; risk invisible; data re-entered; driver vs payer confusion.
- **Decisions enabled:** Whether to trust a customer with an expensive vehicle; whether to flag risk; how to serve recurring customers.
- **Operator boundary:** Operators verify identity documents at the desk for a case; Admin owns the durable customer record, risk flags, and notes.
- **Main views:** Customers list (`SCR-040`); customer profile (`SCR-041`).
- **Required sections (profile):** Basic data; Reservation history; Documents; Payments/deposits; Incidents; Internal notes; Risk flags; Driver relationship (driver vs payer).
- **Primary actions:** Open profile; add internal note; set/clear risk flag.
- **Secondary actions:** View linked reservations/payments; (P0-optional) create reservation on behalf.
- **Search:** By name, email, phone.
- **Filters:** Risk flag; has outstanding money; recurring vs new; cancellations/no-shows.
- **Sorting:** By name, last activity, reservation count, risk.
- **List/table/card behavior:** Rows show name, contact, reservation count, risk flag, outstanding-money indicator.
- **Row actions:** Open; view reservations; add note.
- **Bulk actions:** Export.
- **Modals/drawers/menus:** Add note drawer; risk flag modal (reason required); document viewer.
- **Empty state:** "No customers yet"; no-results-after-filter.
- **Loading state:** List/profile skeletons.
- **Error state:** Load errors with retry.
- **Permission-sensitive states:** Sensitive data (documents, financials) shown per capability; risk flag editing gated; notes visibility per assigned role.
- **Responsive behavior:** Wide: list + profile panels. Narrow: stacked profile sections, tabbed.
- **UX risks:** Flat contact list; risky history not distinguished from normal; exposing sensitive PII without control; mixing customer/payer/driver.
- **Acceptance criteria:** Risk and outstanding money visible at list level; risky history visually distinct; driver vs payer explicit; notes attributed/timestamped; sensitive data gated.

---

# M-05 — Payments, Deposits & Invoices (P0)

- **Level:** P0
- **Owning screens:** `SCR-050` (money control), `SCR-051` (transaction detail), `SCR-052` (invoices)
- **Business value:** Less financial loss, better traceability, fewer disputes, better daily close, risk control (no release without financial clearance).
- **Primary admin goal:** Control and trace all money: payments, deposits/authorizations, desk balances, refunds, charges, invoices.
- **User pain solved:** "Paid/unpaid" hides reality; deposits and balances untracked; releases happen with money outstanding; documents scattered.
- **Decisions enabled:** Whether money is secured before release; what to reconcile; whether to refund; what to charge; which invoice to retrieve.
- **Operator boundary:** Operators **record** desk collection at the case; Admin/Finance is where the full picture is controlled, reconciled, refunded, and charged.
- **Main views:** Money control list (`SCR-050`); transaction detail (`SCR-051`); invoices list (`SCR-052`).
- **Required sections:** Payment status; Deposit/authorization status; Desk balance; Extras; Damage charges; Refunds; Invoice/receipt presence. Each visibly separated, never collapsed to one flag.
- **Primary actions:** Open transaction; reconcile; refund (gated); record adjustment/charge; capture/release deposit (`INT-033`, gated); open invoice.
- **Secondary actions:** Export; link to reservation/customer; attach evidence reference.
- **Search:** By reservation reference, customer, transaction id, invoice number.
- **Filters:** Status (paid/pending/refunded/etc.); deposit state; has balance due; date range; method; type (payment/deposit/charge/refund).
- **Sorting:** By date, amount, balance due, status.
- **List/table/card behavior:** Transaction rows show source, amount, method, status, linked reservation, balance indicator. Money-at-risk rows visually distinct.
- **Row actions:** Open; reconcile; refund; view reservation; view invoice.
- **Bulk actions:** Export selected; mark reconciled (with confirmation).
- **Modals/drawers/menus:** Refund modal (amount + reason + preview); adjustment/charge modal; deposit resolution modal (capture/release, `INT-033`); reconcile confirmation; discrepancy flag.
- **Empty state:** "No transactions in range"; no-results-after-filter.
- **Loading state:** List/detail skeletons.
- **Error state:** Load errors with retry; action failure preserves entered values.
- **Permission-sensitive states:** Entire module gated to finance/owner profiles; refund and adjustment actions separately gated; non-finance profiles see read-only summaries at most.
- **Responsive behavior:** Wide: dense financial tables. Narrow: stacked transaction cards; read-mostly.
- **UX risks:** Reducing money to paid/unpaid; not distinguishing payment vs deposit; hiding balance; not showing collection source; not linking to handoff.
- **Acceptance criteria:** Each money component is explicit and separated; every transaction links to its reservation; operator desk collections are visible to finance; refunds/charges/deposit actions are confirmed, reasoned, and audited; export available. **Financial semantics (secured/at-risk, release gate, cancellation/no-show/refund/deposit/damage math) follow `20`; configurable policy controls follow `21` and governance follows `23`.**

---

# M-06 — Contracts & Digital Handover (P0)

- **Level:** P0
- **Owning screens:** `SCR-060` (handover list), `SCR-061` (handover record), settings via `SCR-081`
- **Business value:** Fewer disputes, more professionalism, legal protection, better operation, justified charges. High commercial differentiation — replaces paper/photos/chats.
- **Primary admin goal:** Make delivery/return a reliable, documented, evidence-backed process and govern its rules.
- **User pain solved:** Contracts on paper, loose photos, informal conversations; damage disputes unwinnable; weak legal position.
- **Decisions enabled:** Whether a case is ready for release; whether damage is pre-existing or new; what to charge; whether evidence supports a dispute.
- **Operator boundary:** Operators **execute** the physical checklist at the desk (out and in). Admin **defines** the process/contract, **reviews** evidence, and uses it for charges/audit. Admin does not perform the desk handoff.
- **Main views:** Handover records list (`SCR-060`); single handover record (`SCR-061`); process/contract configuration (`SCR-081`).
- **Required sections (record):** Contract + signature status; Identity verification; Payment/deposit clearance; Out: photos, mileage, fuel; In: photos, mileage, fuel; Pre-existing vs new damage; Who confirmed; Linked charges/incidents.
- **Primary actions:** Open record; review evidence; create charge from damage (links to `M-05`); open incident (P1).
- **Secondary actions:** Export evidence; configure process/terms; view audit.
- **Search:** By reservation reference, customer, vehicle.
- **Filters:** Stage (out pending / out done / in pending / closed); has new damage; date range.
- **Sorting:** By date, stage, damage presence.
- **List/table/card behavior:** Records show reservation, vehicle, stage, signature status, damage flag.
- **Row actions:** Open; create charge; export.
- **Bulk actions:** Export.
- **Modals/drawers/menus:** Evidence viewer (out vs in comparison); create-charge modal; process-config drawer.
- **Empty state:** "No handover records yet"; per-stage empties.
- **Loading state:** Record/section skeletons; evidence lazy-loads with placeholders.
- **Error state:** Evidence load error with retry; isolated per section.
- **Permission-sensitive states:** Process/term configuration gated to settings capability; charge creation gated to finance capability.
- **Responsive behavior:** Wide: out/in side-by-side comparison. Narrow: stacked out then in, with toggle.
- **UX risks:** Contract as an isolated PDF; photos without context; signature without checklist; not distinguishing out vs in; damage not linked to charge/incident.
- **Acceptance criteria:** Readiness is a clear checklist that reflects operator execution; out vs in evidence is directly comparable; damage is attributable and linkable to a charge/incident; configuration is previewable, governed by `23`, and does not rewrite completed records.

---

# M-07 — Roles & Permissions / Configurable Access Control (P0)

- **Level:** P0
- **Owning screens:** `SCR-070` (staff list), `SCR-071` (staff detail), `SCR-072` (roles & permissions)
- **Business value:** Less internal risk, separation of responsibilities, scalability from one manager to a team, owner confidence, foundation for audit, and safe delegation through custom roles.
- **Primary admin goal:** Control what each employee can do, in business language, using default templates and custom roles.
- **User pain solved:** Everyone can do everything; no separation of duties; access invisible until it fails.
- **Decisions enabled:** Who can cancel, approve, refund, change prices, manage staff, view financials, release vehicles.
- **Operator boundary:** Defines operator capability too, but configuration lives in Admin; operators never configure roles.
- **Main views:** Staff list (`SCR-070`); staff detail (`SCR-071`); roles & permissions / access control (`SCR-072`).
- **Required sections:** Staff identity; assigned role template/custom role; capability summary; status (active/suspended). On roles: default templates; custom roles; domain-grouped capabilities; sensitive capabilities; permission diff preview; staff assignment; role version history; permission simulation ("view as role"); emergency suspend/revoke; audit trail.
- **Primary actions:** Create staff; assign/change role; clone role template; create/edit custom role; suspend/deactivate/reactivate; emergency suspend; submit sensitive access change for approval where required.
- **Secondary actions:** Reset credentials; view a staff member's critical-action history (P1); compare role versions; simulate a workflow as a role.
- **Search:** By staff name/email; by capability.
- **Filters:** Role profile; status; capability.
- **Sorting:** By name, role, status, last activity.
- **List/table/card behavior:** Staff rows show name, assigned role template/custom role, status, last activity.
- **Row actions:** Open; change role; suspend/reactivate.
- **Bulk actions:** None in P0 (role changes are individual and confirmed).
- **Modals/drawers/menus:** Create staff drawer; role-change confirmation (capability diff); custom-role editor drawer; sensitive-capability confirmation; suspend/deactivate confirmation; emergency revoke confirmation; capability description popovers; view-as-role simulator.
- **Empty state:** "Only you so far — add your team."
- **Loading state:** List/detail skeletons.
- **Error state:** Load/action errors with retry.
- **Permission-sensitive states:** Entire module gated to staff-management capability; editing gated to role-management capability; sensitive grants require sensitive-capability authority; self-escalation, self-lockout, and last-admin/last-owner removal prevented.
- **Responsive behavior:** Wide: roles matrix. Narrow: read-mostly; per-role capability lists stacked.
- **UX risks:** Technical permission strings; over-granular roles in P0; critical actions without confirmation; permissions invisible until they fail; custom roles creating unsafe privilege combinations.
- **Acceptance criteria:** Capabilities are described in business language; default profiles are templates that can be cloned; custom roles are supported safely; role changes show a capability diff and are confirmed/audited/versioned; self-escalation, self-lockout, and last-admin/last-owner removal are prevented; critical capabilities are visually marked; access-control behavior follows `22` and sensitive changes follow `23`.

---

# M-08 — Settings / Business Rules (P0)

- **Level:** P0
- **Owning screens:** `SCR-080` (hub), `SCR-081` (section detail), `SCR-082` (financial policies)
- **Business value:** Adaptability to the real business, less manual support, consistency, scalability, professionalism.
- **Primary admin goal:** Let the business configure how it operates, in business language.
- **User pain solved:** The tool does not match the business; repeated manual overrides; off-platform rules.
- **Decisions enabled:** Where vehicles are delivered; what hours apply; what extras exist; which financial policies govern payment/deposit/cancellation/no-show/refund/damage/tax/release-gate behavior; contract terms; customer instructions.
- **Operator boundary:** Configuration is Admin-only; operators consume the rules.
- **Main views:** Settings hub (`SCR-080`) with sections; section detail (`SCR-081`); Financial Policies (`SCR-082`) for governed money policy configuration.
- **Required sections:** Locations; Pickup/return rules; Business hours; Extras catalog; Financial Policies (booking payment, deposit, protection/insurance, cancellation, no-show, late pickup/return, damage/charges, refunds, currency/tax, release gate); Contract terms; Notification templates (links to `M-12`); (P1 links to Pricing `M-11`).
- **Primary actions:** Edit a section; preview; simulate where relevant; save draft; submit sensitive change for approval; schedule approved change.
- **Secondary actions:** Add/remove/reorder items within a section; revert unsaved changes.
- **Search:** Across settings sections (find a setting).
- **Filters:** N/A (navigation by section).
- **Sorting:** Items within a section may be reorderable (e.g., extras).
- **List/table/card behavior:** Hub is a sectioned index; sections use small focused lists/forms.
- **Row actions:** Edit/remove item within a section.
- **Bulk actions:** None.
- **Modals/drawers/menus:** Per-item edit drawer; guarded rule-builder drawer; preview modal; policy simulator; version compare drawer; approval dialog; rollback confirmation; unsaved-changes guard.
- **Empty state:** Per section ("No extras configured — add one").
- **Loading state:** Section skeletons.
- **Error state:** Save validation errors inline; load errors with retry; unsaved-changes guard on navigate-away.
- **Permission-sensitive states:** Entire module gated to settings capability; Financial Policies require `PERM-062` to edit and `PERM-063` to approve; some non-financial sections (such as contract terms) may be owner-only or governed.
- **Responsive behavior:** Desktop-first; narrow shows read-mostly with limited editing.
- **UX risks:** One giant unsectioned form; technical rules; arbitrary formula logic; critical changes without preview; silent changes to existing reservations; mixing operational and technical settings; configuring P2 prematurely.
- **Acceptance criteria:** Settings are sectioned and in business language; critical changes are previewable, validated, reasoned, versioned, and governed; Financial Policies follow `21`; configuration governance follows `23`; locations exist as a concept (forward-compatible) even if single-branch; unsaved-changes are guarded.

---

# M-09 — Maintenance & Incidents (P1)

- **Level:** P1
- **Owning screens:** `SCR-090` (list), `SCR-091` (detail)
- **Business value:** Less downtime, less risk, better planning, cost control, better reputation.
- **Primary admin goal:** Track vehicle problems to resolution and keep unfit cars out of service.
- **User pain solved:** Problem cars keep getting rented; downtime and costs untracked; reactive maintenance.
- **Decisions enabled:** Which vehicle needs maintenance; which should not be reserved; which damage repeats; what each vehicle costs.
- **Operator boundary:** Operators may **report** damage at return; Admin owns the incident lifecycle and scheduling.
- **Main views:** Maintenance/incidents list (`SCR-090`); detail (`SCR-091`).
- **Required sections:** Type; severity; affected vehicle; description; evidence (links to handover); status; cost; timeline; resolution.
- **Primary actions:** Open incident; update; resolve; schedule maintenance; block vehicle; record cost.
- **Secondary actions:** Link to handover evidence; reassign affected reservations.
- **Search:** By vehicle, incident id.
- **Filters:** Status (open/in-progress/resolved); severity; type; vehicle; maintenance due/overdue.
- **Sorting:** By severity, status, date, cost.
- **List/table/card behavior:** Cards show vehicle, type, severity, status, cost, age.
- **Row actions:** Open; resolve; block vehicle.
- **Bulk actions:** Export.
- **Modals/drawers/menus:** Open-incident drawer; schedule-maintenance drawer (with conflict check); resolve confirmation.
- **Empty state:** "No open incidents" (calm); "No maintenance scheduled".
- **Loading state:** List/detail skeletons.
- **Error state:** Load/action errors with retry.
- **Permission-sensitive states:** Gated to maintenance capability; cost visibility gated to finance/owner.
- **Responsive behavior:** Wide: list + detail. Narrow: stacked.
- **UX risks:** Incidents disconnected from the vehicle/evidence/cost; scheduling that ignores reservation conflicts.
- **Acceptance criteria:** Incidents link vehicle + evidence + cost; resolving updates fleet availability; scheduling checks reservation conflicts and surfaces them.

---

# M-10 — Calendar View (P1)

- **Level:** P1
- **Owning screens:** `SCR-100`
- **Business value:** Better planning, fewer conflicts, easier sales of gaps, better coordination, strong demo.
- **Primary admin goal:** Visualize occupancy by vehicle and date; spot gaps and conflicts.
- **User pain solved:** Availability is abstract; overlaps discovered at the desk; gaps not sold.
- **Decisions enabled:** Which days a vehicle is free; where overlaps are; how returns feed next pickups; what maintenance blocks.
- **Operator boundary:** Planning tool for Admin; not an operator surface.
- **Main views:** Calendar (`SCR-100`) with day/week/month and per-vehicle/category/location/status scoping.
- **Required sections:** Timeline grid (vehicles × dates); legend (reservation/maintenance/blocked/gap); scope controls; date navigation.
- **Primary actions:** Change scope/zoom; navigate dates; open a block (reservation/maintenance).
- **Secondary actions:** Filter by category/location/status; jump to a vehicle.
- **Search:** By vehicle.
- **Filters:** Vehicle, category, location, status.
- **Sorting:** Vehicle order (by category/identifier).
- **List/table/card behavior:** Calendar grid; blocks are interactive; conflicts visually flagged.
- **Row actions:** Click a block → open reservation/maintenance.
- **Bulk actions:** None.
- **Modals/drawers/menus:** Block preview popover → open detail.
- **Empty state:** "No reservations in this range" with visible free capacity.
- **Loading state:** Grid skeleton.
- **Error state:** Load error with retry.
- **Permission-sensitive states:** Visible to operations/fleet/owner; financial overlays gated.
- **Responsive behavior:** Wide: full grid. Narrow: single-vehicle or day view, horizontally scrollable.
- **UX risks:** A pretty calendar that hides conflicts; overload of blocks without legend.
- **Acceptance criteria:** Overlaps/conflicts are unmistakable; blocks link to their detail; maintenance is visually distinct from rentals; gaps are identifiable.

---

# M-11 — Pricing Rules (P1)

- **Level:** P1
- **Owning screens:** `SCR-110`
- **Business value:** More revenue, less manual editing, more control, flexibility, foundation for future intelligent pricing.
- **Primary admin goal:** Adjust prices via human-readable rules (season, category, duration, fees) — not dynamic AI.
- **User pain solved:** Editing prices per vehicle; opaque pricing; inability to run seasonal offers.
- **Decisions enabled:** What price applies by season/category/duration; what fees/deposits per category; what precedence between rules.
- **Operator boundary:** Admin-only; operators do not set prices.
- **Main views:** Pricing rules (`SCR-110`) with rule list and editor.
- **Required sections:** Rule list (condition → effect → precedence → enabled); rule editor; preview on sample prices.
- **Primary actions:** Create/edit rule; enable/disable; preview; save.
- **Secondary actions:** Reorder precedence; duplicate a rule.
- **Search:** By rule name/condition.
- **Filters:** Enabled/disabled; type (season/category/duration/fee).
- **Sorting:** By precedence, type, enabled.
- **List/table/card behavior:** Rules as readable statements (e.g., "High season: +20%").
- **Row actions:** Edit; enable/disable; duplicate.
- **Bulk actions:** Enable/disable selected (confirmed).
- **Modals/drawers/menus:** Rule editor drawer; preview modal; conflict/precedence explainer.
- **Empty state:** "No pricing rules — base price/day applies."
- **Loading state:** List/editor skeletons.
- **Error state:** Validation errors inline; load errors with retry.
- **Permission-sensitive states:** Gated to pricing capability (owner-level by default).
- **Responsive behavior:** Desktop-first; narrow read-mostly.
- **UX risks:** Unexpected prices shown to customers; opaque precedence.
- **Acceptance criteria:** Rules are human-readable; effect is previewable before save; precedence and conflicts are explicit; sensitive pricing changes are reasoned, versioned, and governed by `23`; disabling a rule is immediate and clear.

---

# M-12 — Notifications (P1)

- **Level:** P1
- **Owning screens:** `SCR-120` (and templates surfaced in Settings)
- **Business value:** Less manual messaging, fewer no-shows, better operation, better experience, less risk.
- **Primary admin goal:** Automate the right communications to the right audience.
- **User pain solved:** Repetitive manual messages; no-shows; staff unaware of action items.
- **Decisions enabled:** Which event notifies whom; what each message says; what is enabled.
- **Operator boundary:** Admin configures; staff/operators may receive operational notifications but do not configure them.
- **Main views:** Notifications (`SCR-120`) grouped by audience with templates.
- **Required sections:** Event → audience (customer/staff/manager/finance) → channel/template mapping; enabled state; template editor; preview.
- **Primary actions:** Toggle a notification; edit template; preview; save.
- **Secondary actions:** Duplicate template; test-preview with sample data.
- **Search:** By event/audience.
- **Filters:** Audience; enabled/disabled; channel.
- **Sorting:** By audience, event.
- **List/table/card behavior:** Grouped list by audience; each notification is a toggle + template summary.
- **Row actions:** Toggle; edit template; preview.
- **Bulk actions:** Enable/disable a group (confirmed).
- **Modals/drawers/menus:** Template editor drawer; preview modal.
- **Empty state:** Defaults present but disabled; "Turn on reminders to reduce no-shows."
- **Loading state:** List/editor skeletons.
- **Error state:** Validation inline; load errors with retry.
- **Permission-sensitive states:** Gated to notification capability.
- **Responsive behavior:** Desktop-first.
- **UX risks:** Notification spam or total silence; un-previewable templates.
- **Acceptance criteria:** Grouped by audience; every template is previewable; no spammy on-by-default mass messaging; enabling/disabling customer-impacting templates is explicit and governed by `23`.

---

# M-13 — Reports & Analytics (P1)

- **Level:** P1
- **Owning screens:** `SCR-130`
- **Business value:** Better decisions, better profitability, less operational blindness, better planning, higher perceived value.
- **Primary admin goal:** Turn operations into decisions.
- **User pain solved:** No reliable view of what works; decisions on gut/Excel.
- **Decisions enabled:** Revenue trends; which vehicles/channels are profitable; utilization; cancellation patterns; outstanding money; repeat rate.
- **Operator boundary:** Admin/owner domain; not operator-facing.
- **Main views:** Reports (`SCR-130`) organized by decision area, each drilling into source lists.
- **Required sections:** Revenue; Fleet utilization; Reservation conversion; Cancellations/no-shows; Maintenance cost; Outstanding payments; Customer repeat rate; Vehicle profitability. Date range + scope controls.
- **Primary actions:** Change range/scope; drill into source; export.
- **Secondary actions:** Compare periods; save a view (P1-optional).
- **Search:** N/A (navigation by decision area).
- **Filters:** Date range; location; category; vehicle.
- **Sorting:** Within each report (e.g., vehicles by profitability).
- **List/table/card behavior:** Each report = a focused metric + a drillable list; not a wall of charts.
- **Row actions:** Drill into the underlying entities.
- **Bulk actions:** Export.
- **Modals/drawers/menus:** Export options; range picker.
- **Empty state:** "Not enough data yet" honesty for low-data periods.
- **Loading state:** Report skeletons.
- **Error state:** Load errors with retry.
- **Permission-sensitive states:** Gated to reports capability (owner/manager/finance); financial reports separately gated.
- **Responsive behavior:** Desktop-first; narrow shows headline metrics, drill on tap.
- **UX risks:** Vanity charts; misleading analytics on thin data; metrics with no drill-down.
- **Acceptance criteria:** Reports are organized by decisions, not chart types; every metric drills to its source; low-data states are honest; export available.

---

# M-14 — Audit Logs (P1)

- **Level:** P1
- **Owning screens:** `SCR-140` (and history panels embedded in `SCR-021`/`SCR-031`/`SCR-041`)
- **Business value:** Trust, fewer internal conflicts, better supervision, compliance base, commercial security.
- **Primary admin goal:** Answer who changed what, when, and why for critical actions.
- **User pain solved:** No accountability; disputes unresolvable; hidden abuse/errors.
- **Decisions enabled:** Whether a critical action was legitimate; who to follow up with; whether access needs adjusting.
- **Operator boundary:** Captures operator critical actions too (e.g., manual fallback release, document decisions) and surfaces them to Admin oversight.
- **Main views:** Global audit (`SCR-140`); in-context history panels on entities.
- **Required sections:** Actor; action; target entity; timestamp; reason/context. Filters and entity context.
- **Primary actions:** Filter; open target; export.
- **Secondary actions:** Switch between global and entity-scoped views.
- **Search:** By actor, target reference, action.
- **Filters:** Entity type; actor; action type (cancel/refund/override/role-change/price-change/fallback); date range; criticality.
- **Sorting:** By time (default), actor, action.
- **List/table/card behavior:** Readable entries in business language ("Maria cancelled reservation R-1042 — reason: customer no-show"), not raw technical logs.
- **Row actions:** Open target; view full context.
- **Bulk actions:** Export.
- **Modals/drawers/menus:** Entry detail; export options.
- **Empty state:** "No critical actions in range."
- **Loading state:** List skeleton.
- **Error state:** Load error with retry.
- **Permission-sensitive states:** Gated to audit capability (supervisor/owner).
- **Responsive behavior:** Desktop-first; narrow shows compact entries.
- **UX risks:** Raw technical log nobody reads; audit only global (not in-context); reasons not captured by the originating action.
- **Acceptance criteria:** Entries are business-readable; accessible both globally and in-context; reasons captured during critical actions (cancel/refund/override/etc.) appear here; exportable.

---

## Module → mental-model coverage matrix

| Module | Time | State | Risk | Money |
|---|:--:|:--:|:--:|:--:|
| M-01 Command Center | ✔ | ✔ | ✔ | ✔ |
| M-02 Reservations | ✔ | ✔ | ✔ | ✔ |
| M-03 Fleet | ✔ | ✔ | ✔ | ◑ |
| M-04 Customers | ◑ | ◑ | ✔ | ◑ |
| M-05 Payments | ◑ | ✔ | ✔ | ✔ |
| M-06 Handover | ✔ | ✔ | ✔ | ◑ |
| M-07 Roles | — | ✔ | ✔ | — |
| M-08 Settings | — | — | ◑ | ◑ |
| M-09 Maintenance | ✔ | ✔ | ✔ | ✔ |
| M-10 Calendar | ✔ | ✔ | ✔ | — |
| M-11 Pricing | ✔ | — | ◑ | ✔ |
| M-12 Notifications | ✔ | ✔ | ◑ | — |
| M-13 Reports | ✔ | ◑ | ✔ | ✔ |
| M-14 Audit | ✔ | ✔ | ✔ | ✔ |

✔ primary · ◑ partial · — not a focus
