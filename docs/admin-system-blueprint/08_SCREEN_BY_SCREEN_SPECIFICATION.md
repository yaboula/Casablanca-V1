# 08 — Screen-by-Screen Specification

**Scope:** Full functional spec for every primary screen and the system screens.
**Read after:** `07_SCREEN_INVENTORY.md`. Uses module specs (`06`), interactions (`09`), states (`10`), permissions (`11`).

---

## Format (every screen)

`Screen ID · Screen name · P0/P1 · Purpose · Primary actor · Business value · Entry points · Layout structure · Header actions · Main sections · Data displayed · Search · Filters · Sorting · Actions · Menus · Modals/drawers · States · Empty state · Error state · Permission behavior · Responsive behavior · Acceptance criteria`

All screens sit inside the global shell defined in `03 §4` (top bar + primary nav). Only screen-specific content is described below.

---

## SCR-010 — Command Center

- **Screen ID:** SCR-010
- **Screen name:** Command Center
- **P0/P1:** P0
- **Purpose:** Give the admin the shape of the day and what requires action, immediately.
- **Primary actor:** RP-2 (Operations Manager); RP-1, RP-3 secondary.
- **Business value:** The product's hero screen; daily control, error prevention, premium perception.
- **Entry points:** App open; home/logo; critical alert indicator.
- **Layout structure:** Header (title + date context + "today" controls). Body is a region grid: top row = highest-urgency (Blockers, Money at risk); next rows = Today pickups/returns, Pending payments, Pending documents, Fleet attention, Critical alerts; footer = Quick actions. No giant table.
- **Header actions:** Date context (today/tomorrow); refresh; quick-create menu (gated).
- **Main sections:** Today summary; Blockers; Money at risk; Pickups today; Returns today; Pending payments; Pending documents; Fleet attention (maintenance/expiring docs); Critical alerts; Quick actions.
- **Data displayed:** Counts and values for pickups/returns and expected/at-risk revenue; blocked reservations with reason; unsecured money total; pending document count; vehicles needing attention; prioritized alerts with type/severity/age.
- **Search:** Global search via shell only.
- **Filters:** Optional location scope (forward-compatible); date context.
- **Sorting:** Per region by urgency (system-defined; not user-sortable in P0).
- **Actions:** Open any item → its detail; resolve blocker; act on alert; acknowledge/snooze alert (gated).
- **Menus:** Quick-create; alert row menu.
- **Modals/drawers:** Alert acknowledge/snooze confirmation.
- **States:** Default (mixed), all-clear (calm), loading (per-region skeleton), partial-error (per-region), brand-new (onboarding).
- **Empty state:** Per region "all clear"; whole-screen onboarding for a new account.
- **Error state:** Per-region inline error + retry; never blanks the whole screen.
- **Permission behavior:** Money-at-risk region hidden/summarized without finance capability; quick-create entries gated; fleet attention requires fleet view.
- **Responsive behavior:** Wide multi-column grid; narrow single-column priority stack (blockers + money first).
- **Acceptance criteria:** Four mental-model dimensions present above the fold; every number links to a list; blockers show reasons inline; all-clear is a real calm state; no metric without a destination.

---

## SCR-020 — Reservations (list-by-state)

- **Screen ID:** SCR-020
- **Screen name:** Reservations
- **P0/P1:** P0
- **Purpose:** Locate and triage reservation cases organized by work/state.
- **Primary actor:** Any admin with Reservations view.
- **Business value:** Central operational control; fewer lost/blocked reservations.
- **Entry points:** Nav; Command Center; global search.
- **Layout structure:** Header (title + create-on-behalf). State segment bar (canonical segments). Filter/search row. Result list (rich rows/cards). Pagination/infinite scroll footer.
- **Header actions:** Create reservation on behalf (gated); export.
- **Main sections:** State segments; filters/search; result list.
- **Data displayed (per row):** Reference, customer, vehicle, pickup time, return time, state pill, blocking reason (if blocked), money-owed indicator, risk flag.
- **Search:** Reference, customer, phone, vehicle (instant within list).
- **Filters:** State segment; date range; vehicle/category; location; risk; money owed; document status; payment status.
- **Sorting:** Pickup time (default), return time, money owed, state, created.
- **Actions:** Open case; row quick actions; bulk export.
- **Menus:** Row action menu (view customer/vehicle/money; quick cancel).
- **Modals/drawers:** Cancel confirmation; export options.
- **States:** Default, loading (skeleton rows), empty-per-segment, no-results-after-filter, error.
- **Empty state:** Segment-specific ("No blocked reservations"); whole-list ("No reservations yet"); filtered ("No matches — clear filters").
- **Error state:** List load error + retry.
- **Permission behavior:** Money indicators hidden without finance view; cancel/intervene gated.
- **Responsive behavior:** Wide list + persistent filters; narrow stacked cards with filter sheet.
- **Acceptance criteria:** Segments use canonical vocabulary; blocked rows show reason; list always routes to detail; no flat priority-less table.

---

## SCR-021 — Reservation case detail

- **Screen ID:** SCR-021
- **Screen name:** Reservation case
- **P0/P1:** P0
- **Purpose:** Present and act on a reservation as a complete operational case.
- **Primary actor:** Any admin with Reservations view; interventions gated.
- **Business value:** One screen to understand and steer a reservation; reduces errors and time.
- **Entry points:** Reservations list; search; Command Center blocker; deep link.
- **Layout structure:** Header (reference + state pill + readiness + primary action). Body panels: Customer context; Vehicle context; Timing & location; Documents; Money (payment/deposit/balance); Readiness checklist; Timeline; Internal notes. Right rail or tabbed on narrow.
- **Header actions:** Cancel; reassign vehicle; modify; force-unblock (gated); add note.
- **Main sections:** Customer identity; Vehicle; Pickup timing/location; Document status; Payment/deposit/desk-balance; Release readiness; Timeline/history; Notes.
- **Data displayed:** Customer name/contact + risk flag; vehicle identity + status; pickup/return + terminal; document statuses (+ rejection reason); money breakdown; readiness with blocking reasons; chronological timeline; notes.
- **Search:** N/A (single case); global search in shell.
- **Filters:** Timeline filter (all/critical) optional.
- **Sorting:** Timeline newest/oldest toggle.
- **Actions:** Cancel (UC-012), reassign (UC-013), modify (UC-015), force-unblock (UC-014), add note, view customer/vehicle/payment/handover, view audit (P1).
- **Menus:** Overflow menu for secondary actions.
- **Modals/drawers:** Cancel modal; reassign drawer; modify drawer; force-unblock modal; note drawer.
- **States:** Ready, blocked (reasons shown), active, completed, cancelled, loading (section skeletons), partial-error, not-found, forbidden.
- **Empty state:** N/A for the case itself; sub-sections show "no documents yet", "no charges", "no notes".
- **Error state:** Section-isolated errors + retry; whole-case load error screen with back.
- **Permission behavior:** Money section gated to finance; interventions disabled-with-tooltip or hidden per capability; force-unblock only for permitted profiles.
- **Responsive behavior:** Wide multi-panel; narrow tabbed sections (Overview/Money/Docs/Timeline).
- **Acceptance criteria:** All four dimensions on one screen; blocking reasons inline; readiness unambiguous; every section links to its source; interventions confirmed and reasoned.

---

## SCR-030 — Fleet list

- **Screen ID:** SCR-030
- **Screen name:** Fleet
- **P0/P1:** P0
- **Purpose:** See and triage the fleet by status/availability.
- **Primary actor:** RP-5; RP-2.
- **Business value:** Asset protection; better utilization; reliable availability.
- **Entry points:** Nav; Command Center fleet attention.
- **Layout structure:** Header (title + add vehicle). Status segment/filter bar. Vehicle card grid (or dense rows).
- **Header actions:** Add vehicle (gated); export.
- **Main sections:** Status segments; filters; vehicle grid.
- **Data displayed (per card):** Identity/plate, model, category, commercial status, physical status, location, next reservation, flags (maintenance, expiring docs).
- **Search:** Plate/identifier, model, category.
- **Filters:** Status; category; location; availability for date range; documents expiring; maintenance flag.
- **Sorting:** Status, category, next reservation, utilization/profitability, doc expiry.
- **Actions:** Open vehicle; block/unblock; add vehicle; view occupancy (P1); export.
- **Menus:** Card action menu.
- **Modals/drawers:** Block modal; add vehicle drawer.
- **States:** Default, loading (card skeletons), empty (onboarding), filtered-empty, error.
- **Empty state:** "No vehicles yet — add your first vehicle"; filtered "No matches".
- **Error state:** Load error + retry.
- **Permission behavior:** Edit/block/add gated; profitability gated to finance/owner.
- **Responsive behavior:** Wide card grid; narrow single-column cards.
- **Acceptance criteria:** Commercial vs physical status both visible; unavailability shows reason; cards link to detail and reservations.

---

## SCR-031 — Vehicle detail

- **Screen ID:** SCR-031
- **Screen name:** Vehicle
- **P0/P1:** P0
- **Purpose:** Understand and manage one vehicle as a controlled asset.
- **Primary actor:** RP-5; RP-2.
- **Business value:** Visibility into asset state, documents, and use.
- **Entry points:** Fleet list; reservation case; calendar.
- **Layout structure:** Header (identity + dual status pills + primary action). Panels: Specs/identity; Status & availability; Upcoming reservations; Vehicle documents (+ expiry); Maintenance/incident history (P1); Profitability indicators; History.
- **Header actions:** Edit; block/unblock; manage documents; schedule maintenance (P1); open incident (P1).
- **Main sections:** Identity & specs; Commercial + physical status; Upcoming reservations; Documents + expiry; Maintenance/incidents (P1); Profitability; History.
- **Data displayed:** Specs; both statuses + unavailability reason; upcoming reservations; documents with type/expiry/days-left; maintenance/incident list (P1); revenue/cost indicators.
- **Search:** N/A.
- **Filters:** Reservations sub-list filter (upcoming/past).
- **Sorting:** Reservations by date; documents by expiry.
- **Actions:** Edit (UC-022), block/unblock (UC-023), manage docs (UC-024), schedule maintenance (UC-081), open incident (UC-080), view occupancy (UC-090).
- **Menus:** Overflow for secondary actions.
- **Modals/drawers:** Block modal; edit drawer; document drawer; maintenance/incident drawer (P1).
- **States:** Available/reserved/rented/maintenance/blocked/inactive; loading; error; not-found.
- **Empty state:** Sub-sections: "no upcoming reservations", "no incidents".
- **Error state:** Section-isolated + retry.
- **Permission behavior:** Edit/block gated; profitability gated; maintenance gated (P1).
- **Responsive behavior:** Wide multi-panel; narrow tabs (Overview/Reservations/Docs/Maintenance).
- **Acceptance criteria:** Status and unavailability reasons explicit; documents surfaced with expiry; links to reservations and calendar present.

---

## SCR-040 — Customers & drivers list

- **Screen ID:** SCR-040
- **Screen name:** Customers & drivers
- **P0/P1:** P0
- **Purpose:** Find a customer/driver with full context.
- **Primary actor:** Any admin with customer view.
- **Business value:** Risk reduction; better service; centralized data.
- **Entry points:** Nav; search; reservation case.
- **Layout structure:** Header (title). Filter/search row. Customer rows.
- **Header actions:** Export.
- **Main sections:** Filters/search; customer list.
- **Data displayed (per row):** Name, contact, reservation count, risk flag, outstanding-money indicator.
- **Search:** Name, email, phone.
- **Filters:** Risk flag; has outstanding money; recurring vs new; cancellations/no-shows.
- **Sorting:** Name, last activity, reservation count, risk.
- **Actions:** Open profile; view reservations; add note.
- **Menus:** Row menu.
- **Modals/drawers:** Add note drawer.
- **States:** Default, loading, empty, filtered-empty, error.
- **Empty state:** "No customers yet"; filtered "No matches".
- **Error state:** Load error + retry.
- **Permission behavior:** Sensitive fields gated; risk-flag edit gated.
- **Responsive behavior:** Wide rows; narrow cards.
- **Acceptance criteria:** Risk and outstanding money visible at list level; payer vs driver distinguished where relevant.

---

## SCR-041 — Customer profile

- **Screen ID:** SCR-041
- **Screen name:** Customer profile
- **P0/P1:** P0
- **Purpose:** Assess and manage a customer/driver's identity, history, and risk.
- **Primary actor:** RP-2, RP-3, RP-6; finance for money.
- **Business value:** Know who you are dealing with before releasing a premium vehicle.
- **Entry points:** Customer list; reservation case; search.
- **Layout structure:** Header (name + risk flag + add note). Panels: Basic data; Reservation history; Documents; Payments/deposits; Incidents; Notes; Risk flags; Driver relationship.
- **Header actions:** Add note; set/clear risk flag.
- **Main sections:** Basic data; Reservation history; Documents; Payments/deposits; Incidents; Internal notes; Risk flags; Driver vs payer.
- **Data displayed:** Contact; history list; documents; financial summary; incident list; attributed notes; flags; relationships.
- **Search:** N/A.
- **Filters:** History filter (active/past/cancelled).
- **Sorting:** History by date.
- **Actions:** Add/edit/remove note (UC-032), set/clear risk flag, view linked reservations/payments.
- **Menus:** Overflow.
- **Modals/drawers:** Note drawer; risk flag modal (reason); document viewer.
- **States:** Default, loading, error, not-found; new-customer thin-history.
- **Empty state:** "No reservations yet", "No notes".
- **Error state:** Section-isolated + retry.
- **Permission behavior:** Documents/financials gated; notes visibility per assigned role; flag edit gated.
- **Responsive behavior:** Wide multi-panel; narrow tabs.
- **Acceptance criteria:** Risky history visually distinct; driver vs payer explicit; notes attributed/timestamped; sensitive data gated.

---

## SCR-050 — Payments & money control

- **Screen ID:** SCR-050
- **Screen name:** Payments
- **P0/P1:** P0
- **Purpose:** Control and trace all money; see what is owed before release.
- **Primary actor:** RP-4; RP-2/RP-3 read.
- **Business value:** Less financial loss; traceability; risk control.
- **Entry points:** Nav; Command Center money-at-risk; reservation case.
- **Layout structure:** Header (title + export). Filter/search row. Transaction list with explicit money components.
- **Header actions:** Export; date range.
- **Main sections:** Filters/search; transaction list; running totals (paid/pending/refunded/owed).
- **Data displayed (per row):** Source, amount, method, status, linked reservation, balance indicator, type.
- **Search:** Reservation reference, customer, transaction id, invoice number.
- **Filters:** Status; deposit state; has balance due; date range; method; type.
- **Sorting:** Date, amount, balance due, status.
- **Actions:** Open transaction; reconcile; refund (gated); record adjustment; export.
- **Menus:** Row menu.
- **Modals/drawers:** Reconcile/flag modal; refund modal; adjustment modal; export.
- **States:** Default, loading, empty, filtered-empty, error.
- **Empty state:** "No transactions in range".
- **Error state:** Load error + retry.
- **Permission behavior:** Entire screen gated to finance/owner; non-finance see read-only summary at most; refund/adjustment separately gated.
- **Responsive behavior:** Wide dense table; narrow stacked cards, read-mostly.
- **Acceptance criteria:** Money components explicit and separated; every transaction links to reservation; operator desk collections visible; at-risk money distinct.

---

## SCR-051 — Transaction detail

- **Screen ID:** SCR-051
- **Screen name:** Transaction
- **P0/P1:** P0
- **Purpose:** Inspect and act on a single financial item.
- **Primary actor:** RP-4.
- **Business value:** Controlled, traceable money movements.
- **Entry points:** Payments list; reservation case money section.
- **Layout structure:** Header (amount + status + actions). Panels: Breakdown (payment/deposit/balance/charges/refund); Linked reservation/customer; History/audit; Evidence links.
- **Header actions:** Refund (gated); record charge/adjustment; reconcile.
- **Main sections:** Financial breakdown; links; history.
- **Data displayed:** Amounts by component, method, status, linked entities, timeline, evidence references.
- **Search:** N/A.
- **Filters:** N/A.
- **Sorting:** History order.
- **Actions:** Refund (UC-042), record charge (UC-043), reconcile (UC-041), view reservation/invoice.
- **Menus:** Overflow.
- **Modals/drawers:** Refund modal; charge modal; reconcile modal.
- **States:** Default, loading, error, not-found.
- **Empty state:** "No charges/refunds yet".
- **Error state:** Section-isolated + retry; action errors preserve input.
- **Permission behavior:** Refund/adjustment gated; view gated to finance.
- **Responsive behavior:** Wide panels; narrow stacked.
- **Acceptance criteria:** Breakdown explicit; refunds/charges confirmed + reasoned + audited; links to reservation/invoice present.

---

## SCR-052 — Invoices & receipts

- **Screen ID:** SCR-052
- **Screen name:** Invoices & receipts
- **P0/P1:** P0
- **Purpose:** Retrieve and export financial documents.
- **Primary actor:** RP-4; RP-2.
- **Business value:** Fewer disputes; easy retrieval.
- **Entry points:** Nav; payments; reservation case.
- **Layout structure:** Header (title + export). Filter/search row. Document list.
- **Header actions:** Export.
- **Main sections:** Filters/search; document list.
- **Data displayed:** Type, number, amount, date, linked reservation/customer, status.
- **Search:** Invoice number, reservation, customer.
- **Filters:** Type; date range; customer; status.
- **Sorting:** Date, amount, number.
- **Actions:** View; download/export; link to reservation.
- **Menus:** Row menu.
- **Modals/drawers:** Document viewer; export.
- **States:** Default, loading, empty, error.
- **Empty state:** "No invoices in range"; "Invoice not generated yet" explanation.
- **Error state:** Load error + retry.
- **Permission behavior:** Gated to finance.
- **Responsive behavior:** Wide table; narrow cards.
- **Acceptance criteria:** Every document links to its reservation; export available; missing-document explained.

---

## SCR-060 — Contracts & handover list

- **Screen ID:** SCR-060
- **Screen name:** Contracts & handover
- **P0/P1:** P0
- **Purpose:** Track handover records and readiness across cases.
- **Primary actor:** RP-3; RP-2.
- **Business value:** Documentation, dispute prevention, professionalism.
- **Entry points:** Nav; Command Center.
- **Layout structure:** Header (title + configure process). Stage filter bar. Record list.
- **Header actions:** Configure process/terms (gated, → `SCR-081`).
- **Main sections:** Stage filters; record list.
- **Data displayed (per row):** Reservation, vehicle, stage (out pending/out done/in pending/closed), signature status, damage flag.
- **Search:** Reservation, customer, vehicle.
- **Filters:** Stage; has new damage; date range.
- **Sorting:** Date, stage, damage.
- **Actions:** Open record; export.
- **Menus:** Row menu.
- **Modals/drawers:** Export.
- **States:** Default, loading, empty, error.
- **Empty state:** "No handover records yet".
- **Error state:** Load error + retry.
- **Permission behavior:** Configuration gated; charge creation gated to finance.
- **Responsive behavior:** Wide rows; narrow cards.
- **Acceptance criteria:** Stage is clear; damage flagged; configuration only in Admin; reflects operator execution.

---

## SCR-061 — Handover record detail

- **Screen ID:** SCR-061
- **Screen name:** Handover record
- **P0/P1:** P0
- **Purpose:** Review documented handover evidence and act on damage.
- **Primary actor:** RP-2, RP-5, RP-4 (charges).
- **Business value:** Win disputes; justify charges; protect legally.
- **Entry points:** Handover list; reservation case; vehicle.
- **Layout structure:** Header (reservation + stage + actions). Comparison body: Contract/signature; Identity; Payment/deposit clearance; Out (photos/mileage/fuel); In (photos/mileage/fuel); Damage (pre-existing vs new); Confirmed-by; Linked charges/incidents.
- **Header actions:** Create charge from damage (gated); open incident (P1); export evidence.
- **Main sections:** Contract & signature; Identity; Financial clearance; Out evidence; In evidence; Damage comparison; Linked items.
- **Data displayed:** Contract status + signature; out/in photos; mileage/fuel out/in; damage notes; who confirmed; linked charges/incidents.
- **Search:** N/A.
- **Filters:** Evidence view (out/in/compare).
- **Sorting:** N/A.
- **Actions:** Create charge (UC-043), open incident (UC-080), export.
- **Menus:** Overflow.
- **Modals/drawers:** Evidence viewer; create-charge modal.
- **States:** Out pending, out done, in pending, closed; loading; error; not-found.
- **Empty state:** Stage-specific ("Out evidence not captured yet").
- **Error state:** Evidence load error + retry, isolated.
- **Permission behavior:** Charge creation gated to finance; configuration gated.
- **Responsive behavior:** Wide out/in side-by-side; narrow stacked with toggle.
- **Acceptance criteria:** Out vs in comparable; damage attributable and linkable to a charge/incident; does not rewrite completed records.

---

## SCR-070 — Staff list

- **Screen ID:** SCR-070
- **Screen name:** Staff
- **P0/P1:** P0
- **Purpose:** See and manage staff and their access.
- **Primary actor:** RP-1; RP-6.
- **Business value:** Internal control; delegation without losing control.
- **Entry points:** Nav.
- **Layout structure:** Header (title + create staff). Filter/search. Staff rows.
- **Header actions:** Create staff (gated).
- **Main sections:** Filters/search; staff list.
- **Data displayed:** Name, assigned role template/custom role, status, last activity.
- **Search:** Name, email.
- **Filters:** Role profile; status; capability.
- **Sorting:** Name, role, status, last activity.
- **Actions:** Open; change role; suspend/reactivate.
- **Menus:** Row menu.
- **Modals/drawers:** Create staff drawer.
- **States:** Default, loading, empty, error.
- **Empty state:** "Only you so far — add your team".
- **Error state:** Load error + retry.
- **Permission behavior:** Gated to staff capability.
- **Responsive behavior:** Wide rows; narrow cards.
- **Acceptance criteria:** Role visible per row; create gated; routes to detail.

---

## SCR-071 — Staff member detail

- **Screen ID:** SCR-071
- **Screen name:** Staff member
- **P0/P1:** P0
- **Purpose:** Manage one staff member's role and status.
- **Primary actor:** RP-1; RP-6.
- **Business value:** Precise access control.
- **Entry points:** Staff list.
- **Layout structure:** Header (name + status + actions). Panels: Identity; Role profile + capability summary; Activity/critical-action history (P1).
- **Header actions:** Change role; suspend/deactivate/reactivate; reset credentials.
- **Main sections:** Identity; Role & capabilities; Activity.
- **Data displayed:** Identity; assigned profile; capability summary; status; recent critical actions (P1).
- **Search:** N/A.
- **Filters:** Activity filter.
- **Sorting:** Activity by date.
- **Actions:** Change role (UC-061), suspend/deactivate (UC-062), reset credentials.
- **Menus:** Overflow.
- **Modals/drawers:** Role-change modal (capability diff); suspend/deactivate modal.
- **States:** Active, suspended, deactivated; loading; error; not-found.
- **Empty state:** "No activity yet".
- **Error state:** Load/action error + retry.
- **Permission behavior:** Self-lockout prevented; last-admin protected; gated to staff capability.
- **Responsive behavior:** Wide panels; narrow stacked.
- **Acceptance criteria:** Role changes show capability diff, are confirmed and audited; self-lockout/last-admin prevented.

---

## SCR-072 — Roles & permissions / access control

- **Screen ID:** SCR-072
- **Screen name:** Roles & permissions / access control
- **P0/P1:** P0
- **Purpose:** Configure what each role template or custom role can do, in business language.
- **Primary actor:** RP-1; RP-6.
- **Business value:** Separation of duties; owner confidence.
- **Entry points:** Nav; staff detail.
- **Layout structure:** Header (title + create custom role + view-as-role). Left role list (default templates and custom roles). Main role detail with domain-grouped capabilities. Right panel for permission diff, assigned staff impact, dependency warnings, and version history.
- **Header actions:** Create custom role; clone template; view as role; save draft; submit sensitive change for approval where required.
- **Main sections:** Role templates; custom roles; capability groups by domain; sensitive capabilities; capability descriptions; permission diff preview; assigned staff; role version history; access simulator.
- **Data displayed:** Capability name, plain-language description, what it unlocks, per-role grant, critical marker, dependencies, assigned staff count, last changed by, pending approval state.
- **Search:** By capability.
- **Filters:** Domain (reservations/money/fleet/etc.); critical only.
- **Sorting:** By domain.
- **Actions:** Toggle capability per role (gated); clone template; create/edit custom role; compare versions; simulate as role; save draft; submit/approve/reject where permitted; emergency suspend from linked staff context.
- **Menus:** Capability description popover; role action menu.
- **Modals/drawers:** Custom-role editor; save confirmation with capability diff; sensitive-capability confirmation; view-as-role simulator; version comparison drawer; capability popover.
- **States:** Default, loading, error; unsaved-changes; permission-limited; pending approval; self-escalation blocked; last-owner blocked; separation-of-duties warning.
- **Empty state:** N/A (capabilities always exist).
- **Error state:** Load/save error + retry.
- **Permission behavior:** Viewing gated to staff/role capability; editing requires `PERM-052`; granting sensitive capabilities requires `PERM-066`; self-escalation, self-lockout, and last-owner/last-admin removal are blocked.
- **Responsive behavior:** Wide matrix; narrow per-role capability lists.
- **Acceptance criteria:** No technical strings; each capability explains its effect; default profiles are templates; custom roles are cloneable/editable; critical capabilities marked; changes show diff preview, reason, audit, version history, and approval state where required; access-control behavior follows `22`.

---

## SCR-080 — Settings hub

- **Screen ID:** SCR-080
- **Screen name:** Settings
- **P0/P1:** P0
- **Purpose:** Entry point to business-rule configuration, sectioned by task.
- **Primary actor:** RP-1; RP-2.
- **Business value:** Adapt the system to the real business.
- **Entry points:** Nav.
- **Layout structure:** Header (title + settings search). Sectioned index of settings areas with brief descriptions and status.
- **Header actions:** Search settings.
- **Main sections:** Locations; Pickup/return rules; Business hours; Extras; Financial Policies (`SCR-082`); Contract terms; Notification templates (→ M-12); Pricing (→ M-11, P1).
- **Data displayed:** Section name, description, configured/unconfigured status.
- **Search:** Across settings.
- **Filters:** N/A.
- **Sorting:** Logical grouping.
- **Actions:** Open a section (→ `SCR-081`).
- **Menus:** N/A.
- **Modals/drawers:** N/A.
- **States:** Default, loading, error.
- **Empty state:** Sections show "not configured" nudges.
- **Error state:** Load error + retry.
- **Permission behavior:** Gated to settings capability; some sections owner-only.
- **Responsive behavior:** Wide grid of sections; narrow list.
- **Acceptance criteria:** Sectioned, business-language; clearly shows what is/isn't configured; Financial Policies are discoverable as a governed policy section, not scattered deposit/cancellation fields.

---

## SCR-081 — Settings section detail

- **Screen ID:** SCR-081
- **Screen name:** Settings section
- **P0/P1:** P0
- **Purpose:** Edit one settings area with preview and validation.
- **Primary actor:** RP-1; RP-2.
- **Business value:** Safe, previewable configuration.
- **Entry points:** Settings hub.
- **Layout structure:** Header (section name + save/preview). Section-specific editor (list of items + edit drawer, or focused form).
- **Header actions:** Preview; save; revert.
- **Main sections:** Section content (varies: locations list, extras catalog, hours grid, policy editor, contract terms, handover process).
- **Data displayed:** Current configuration; preview of effect.
- **Search:** Within section (where lists are long, e.g., extras).
- **Filters:** Within section as needed.
- **Sorting:** Reorderable items where relevant (extras).
- **Actions:** Add/edit/remove/reorder item; preview; save; revert.
- **Menus:** Item menu.
- **Modals/drawers:** Item edit drawer; preview modal; unsaved-changes guard.
- **States:** Default, editing, preview, loading, error, unsaved-changes.
- **Empty state:** Section-specific ("No extras — add one").
- **Error state:** Validation inline; load error + retry.
- **Permission behavior:** Gated; contract/deposit sections owner-only.
- **Responsive behavior:** Desktop-first; narrow read-mostly.
- **Acceptance criteria:** Previewable, validated, business-language; unsaved-changes guarded; sensitive sections follow governance in `23`; changes apply going forward only.

---

## SCR-082 — Financial policies

- **Screen ID:** SCR-082
- **Screen name:** Financial policies
- **P0/P1:** P0
- **Purpose:** Configure payment, deposit, cancellation, no-show, refund, damage, protection, currency/tax, and release-gate policies through safe structured controls.
- **Primary actor:** RP-1 Owner; RP-4 Finance Admin for drafts/simulation; RP-2 Operations Manager for operational timing drafts where permitted.
- **Business value:** Lets the rental business adapt commercial policy without a developer while preventing financial misconfiguration.
- **Entry points:** Settings hub; Payments; reservation money/release blocker "View policy"; audit/version history deep link.
- **Layout structure:** Header (active policy version + effective date + policy health). Secondary tabs: Booking payment, Deposit, Protection/insurance, Cancellation, No-show, Late pickup/return, Damage/charges, Refunds, Currency/tax, Release gate, Simulator, Version history, Approval/audit. Main panel uses rule tables and guarded editor drawers; right panel shows warnings, customer/admin/operator impact, and active/scheduled versions.
- **Header actions:** Create policy change draft; simulate; compare versions; submit for approval; schedule; rollback (gated).
- **Main sections:** Active policy summary; structured rule tables; policy simulator; customer-facing preview; operator release-gate preview; admin impact summary; conflict/warning panel; version history; approval trail.
- **Data displayed:** Current values, draft values, conditions, policy result, priority, status, effective date, author/approver, customer message snippets, simulator outputs, conflict warnings.
- **Search:** Within policy areas by rule name, vehicle category, condition, or affected outcome.
- **Filters:** Policy area; status (active/draft/scheduled/superseded); risk level; pending approval.
- **Sorting:** Rule priority, effective date, policy area.
- **Actions:** Add/edit/duplicate/disable rule; preview impact; run simulator; save draft; submit/approve/reject; schedule; rollback; compare versions.
- **Menus:** Rule action menu; version action menu.
- **Modals/drawers:** Guarded rule-builder drawer; policy simulator; customer/operator preview modal; conflict detail drawer; version compare drawer; approval/rejection modal; rollback confirmation; unsaved-changes guard.
- **States:** Default; empty first-run presets; invalid draft; conflict detected; pending approval; scheduled; active; superseded; rollback available; simulation stale; loading; error; permission-limited.
- **Empty state:** New tenant sees safe starter presets (airport standard, strict premium fleet, flexible conversion) with "Review preset" as the primary action. Presets are not silently activated.
- **Error state:** Validation inline; conflict banner; stale draft warning if another admin changed the policy; failed save preserves inputs.
- **Permission behavior:** View requires settings/financial-policy capability; edit requires `PERM-062`; approval requires `PERM-063`; rollback requires `PERM-064`; simulator uses `PERM-065`; non-finance viewers see read-only summaries where allowed.
- **Responsive behavior:** Desktop-first. Narrow screens are read-mostly with simulator summaries and version history; heavy rule editing requires wider layout.
- **Acceptance criteria:** All 24 financial/commercial decisions in `21` are configurable through safe structured controls; no arbitrary formulas/code/free logic; sensitive changes require preview, reason, audit, version, effective date, and governance; simulator covers booking, pickup, cancellation, no-show, return, damage, refund, and deposit release; existing reservations are protected from silent retroactive changes.

---

## SCR-090 — Maintenance & incidents list (P1)

- **Screen ID:** SCR-090 · **Name:** Maintenance & incidents · **P0/P1:** P1
- **Purpose:** Track and triage vehicle problems and scheduled maintenance.
- **Primary actor:** RP-5; RP-2. **Business value:** Less downtime/risk; cost control.
- **Entry points:** Nav; Command Center fleet attention; vehicle detail.
- **Layout structure:** Header (title + open incident / schedule). Status filter bar. Incident/maintenance cards.
- **Header actions:** Open incident; schedule maintenance (gated).
- **Main sections:** Filters; incident/maintenance list.
- **Data displayed:** Vehicle, type, severity, status, cost, age.
- **Search:** Vehicle, incident id. **Filters:** Status; severity; type; vehicle; due/overdue. **Sorting:** Severity, status, date, cost.
- **Actions:** Open; resolve; block vehicle; schedule. **Menus:** Row menu. **Modals/drawers:** Open-incident drawer; schedule drawer (conflict check); resolve modal.
- **States:** Default, loading, empty (calm "no open incidents"), error.
- **Empty state:** "No open incidents". **Error state:** Load error + retry.
- **Permission behavior:** Gated to maintenance; cost gated to finance/owner.
- **Responsive behavior:** Wide list+detail; narrow cards.
- **Acceptance criteria:** Links vehicle+evidence+cost; scheduling checks conflicts.

---

## SCR-091 — Incident / maintenance detail (P1)

- **Screen ID:** SCR-091 · **Name:** Incident / maintenance · **P0/P1:** P1
- **Purpose:** Manage one incident or maintenance task to resolution.
- **Primary actor:** RP-5. **Business value:** Resolution tracking; keep unfit cars out of service.
- **Entry points:** Maintenance list; vehicle; handover record.
- **Layout structure:** Header (vehicle + status + actions). Panels: details; evidence; cost; timeline; resolution.
- **Header actions:** Update; resolve; block vehicle; record cost.
- **Main sections:** Details; evidence; cost; timeline.
- **Data displayed:** Type, severity, description, vehicle, evidence link, status, cost, timeline.
- **Search:** N/A. **Filters:** Timeline. **Sorting:** Timeline.
- **Actions:** Update, resolve (UC-081), block vehicle, record cost. **Menus:** Overflow. **Modals/drawers:** Update drawer; resolve modal; cost modal.
- **States:** Open, in-progress, resolved; loading; error; not-found.
- **Empty state:** "No cost recorded". **Error state:** Load error + retry.
- **Permission behavior:** Gated; cost gated.
- **Responsive behavior:** Wide panels; narrow tabs.
- **Acceptance criteria:** Resolving updates fleet availability; evidence and cost linked.

---

## SCR-100 — Calendar / occupancy (P1)

- **Screen ID:** SCR-100 · **Name:** Calendar · **P0/P1:** P1
- **Purpose:** Visualize fleet occupancy and conflicts over time.
- **Primary actor:** RP-2, RP-3, RP-5. **Business value:** Planning; conflict avoidance; sell gaps.
- **Entry points:** Nav; fleet; reservation case.
- **Layout structure:** Header (view toggle day/week/month + scope). Timeline grid (vehicles × dates) with legend.
- **Header actions:** View toggle; date navigation; scope filters.
- **Main sections:** Timeline grid; legend; scope controls.
- **Data displayed:** Per-vehicle blocks (reservation/maintenance/blocked), gaps, conflicts.
- **Search:** Vehicle. **Filters:** Vehicle, category, location, status. **Sorting:** Vehicle order.
- **Actions:** Change view/scope; open a block. **Menus:** Block popover. **Modals/drawers:** Block preview popover → detail.
- **States:** Default, loading (grid skeleton), empty (free capacity visible), error.
- **Empty state:** "No reservations in range" with capacity shown. **Error state:** Load error + retry.
- **Permission behavior:** Visible to ops/fleet/owner; financial overlays gated.
- **Responsive behavior:** Wide full grid; narrow single-vehicle/day, horizontal scroll.
- **Acceptance criteria:** Conflicts unmistakable; blocks link to detail; maintenance distinct from rentals.

---

## SCR-110 — Pricing rules (P1)

- **Screen ID:** SCR-110 · **Name:** Pricing rules · **P0/P1:** P1
- **Purpose:** Manage human-readable pricing rules.
- **Primary actor:** RP-1. **Business value:** Revenue control; less manual editing.
- **Entry points:** Nav; settings.
- **Layout structure:** Header (title + create rule). Rule list (readable statements) + editor drawer + preview.
- **Header actions:** Create rule; save.
- **Main sections:** Rule list; editor; preview.
- **Data displayed:** Condition → effect → precedence → enabled; preview prices.
- **Search:** Rule name/condition. **Filters:** Enabled/disabled; type. **Sorting:** Precedence, type, enabled.
- **Actions:** Create/edit (UC-100), enable/disable, duplicate, preview. **Menus:** Row menu. **Modals/drawers:** Rule editor drawer; preview modal; precedence explainer.
- **States:** Default, loading, empty, error, unsaved.
- **Empty state:** "No pricing rules — base price/day applies". **Error state:** Validation inline; load error + retry.
- **Permission behavior:** Gated to pricing (owner-level).
- **Responsive behavior:** Desktop-first.
- **Acceptance criteria:** Rules human-readable; previewable; precedence explicit; sensitive pricing changes follow governance in `23`.

---

## SCR-120 — Notifications & templates (P1)

- **Screen ID:** SCR-120 · **Name:** Notifications · **P0/P1:** P1
- **Purpose:** Configure automated communications by audience.
- **Primary actor:** RP-2. **Business value:** Less manual messaging; fewer no-shows.
- **Entry points:** Nav; settings.
- **Layout structure:** Header (title). Audience-grouped notification list + template editor + preview.
- **Header actions:** None global; per-item edit.
- **Main sections:** Audience groups (customer/staff/manager/finance); per-notification toggle + template.
- **Data displayed:** Event → audience → channel/template; enabled state; preview.
- **Search:** Event/audience. **Filters:** Audience; enabled; channel. **Sorting:** Audience, event.
- **Actions:** Toggle, edit template (UC-110), preview. **Menus:** Row menu. **Modals/drawers:** Template editor drawer; preview modal.
- **States:** Default, loading, error, unsaved.
- **Empty state:** Defaults present but off; "Turn on reminders". **Error state:** Validation inline; load error + retry.
- **Permission behavior:** Gated to notification capability.
- **Responsive behavior:** Desktop-first.
- **Acceptance criteria:** Grouped by audience; previewable; no spammy defaults; customer-impacting notification changes follow governance in `23`.

---

## SCR-130 — Reports & analytics (P1)

- **Screen ID:** SCR-130 · **Name:** Reports & analytics · **P0/P1:** P1
- **Purpose:** Turn operations into decisions.
- **Primary actor:** RP-1; RP-2; RP-4. **Business value:** Better decisions; profitability.
- **Entry points:** Nav; Command Center.
- **Layout structure:** Header (range + scope + export). Decision-area sections, each a focused metric + drillable list.
- **Header actions:** Range picker; scope; export.
- **Main sections:** Revenue; Utilization; Conversion; Cancellations/no-shows; Maintenance cost; Outstanding payments; Repeat rate; Vehicle profitability.
- **Data displayed:** Metric + supporting list per area.
- **Search:** N/A. **Filters:** Date range; location; category; vehicle. **Sorting:** Within each report.
- **Actions:** Change range/scope; drill into source; export. **Menus:** Export. **Modals/drawers:** Range picker; export options.
- **States:** Default, loading, low-data, error.
- **Empty state:** "Not enough data yet". **Error state:** Load error + retry.
- **Permission behavior:** Gated to reports; financial reports separately gated.
- **Responsive behavior:** Desktop-first; narrow headline metrics, drill on tap.
- **Acceptance criteria:** Organized by decisions; every metric drills to source; low-data honesty.

---

## SCR-140 — Audit logs (P1)

- **Screen ID:** SCR-140 · **Name:** Audit logs · **P0/P1:** P1
- **Purpose:** Answer who changed what, when, and why.
- **Primary actor:** RP-6; RP-1. **Business value:** Accountability; trust; compliance base.
- **Entry points:** Nav; entity history panels (`SCR-021`/`SCR-031`/`SCR-041`/`SCR-071`).
- **Layout structure:** Header (title + filters + export). Readable entry list.
- **Header actions:** Filters; export.
- **Main sections:** Entry list; filters.
- **Data displayed:** Actor, action, target, timestamp, reason/context (business language).
- **Search:** Actor, target reference, action. **Filters:** Entity type; actor; action type; date; criticality. **Sorting:** Time (default), actor, action.
- **Actions:** Filter; open target; export. **Menus:** Entry menu. **Modals/drawers:** Entry detail; export.
- **States:** Default, loading, empty, error.
- **Empty state:** "No critical actions in range". **Error state:** Load error + retry.
- **Permission behavior:** Gated to audit (supervisor/owner).
- **Responsive behavior:** Desktop-first; narrow compact entries.
- **Acceptance criteria:** Business-readable; available globally and in-context; reasons from critical actions appear here; exportable.

---

## SCR-150 — Global search results

- **Screen ID:** SCR-150 · **Name:** Search results · **P0/P1:** P0
- **Purpose:** Cross-entity lookup.
- **Primary actor:** Any admin. **Business value:** Fast navigation.
- **Entry points:** Global search overlay.
- **Layout structure:** Header (query + scope tabs). Grouped results (reservations, vehicles, customers, invoices, staff).
- **Header actions:** Scope tabs.
- **Main sections:** Result groups.
- **Data displayed:** Per result: entity type, label, key context (state/status).
- **Search:** The query itself. **Filters:** Entity type tabs. **Sorting:** Relevance then recency.
- **Actions:** Open result. **Menus:** None. **Modals/drawers:** None.
- **States:** Default, loading, empty, error.
- **Empty state:** "No results for '…'". **Error state:** Search error + retry.
- **Permission behavior:** Results respect capability (no leaking gated entities).
- **Responsive behavior:** Overlay on all sizes.
- **Acceptance criteria:** Results grouped by entity; respect permissions; route directly to detail.

---

## SCR-160 — Admin profile & preferences

- **Screen ID:** SCR-160 · **Name:** My profile · **P0/P1:** P0
- **Purpose:** Manage the signed-in admin's own profile and preferences.
- **Primary actor:** Any admin. **Business value:** Self-service basics.
- **Entry points:** Account menu.
- **Layout structure:** Header (name + assigned role). Panels: profile basics; preferences; session/sign-out.
- **Header actions:** Sign out.
- **Main sections:** Profile; preferences; session.
- **Data displayed:** Name, email, assigned role, basic preferences.
- **Search:** N/A. **Filters:** N/A. **Sorting:** N/A.
- **Actions:** Edit own basics; sign out. **Menus:** None. **Modals/drawers:** Edit drawer.
- **States:** Default, loading, error.
- **Empty state:** N/A. **Error state:** Load/save error + retry.
- **Permission behavior:** Self only; cannot change own role here (done in `SCR-071` by a permitted admin).
- **Responsive behavior:** Single column all sizes.
- **Acceptance criteria:** Cannot self-escalate role; sign-out reliable.

---

## System screens (SCR-900..904)

| Screen | Purpose | Key behavior |
|---|---|---|
| `SCR-900` Forbidden | Permitted route opened without capability | Local forbidden shell (not redirect), explains lack of access, offers back/home |
| `SCR-901` Not-found | Missing entity/route | Clear message + back/home + search |
| `SCR-902` Global error | Unrecoverable boundary | Friendly message + retry + back; never a blank page |
| `SCR-903` Sign-in gate | Unauthenticated | Redirect to login with return path (shared with existing app) |
| `SCR-904` Offline | Connection lost on live regions | Non-destructive banner; preserves unsaved input; auto-recover |

Full state behavior for these in `10`.

---

## Coverage note

All 27 primary screens (`SCR-010`..`SCR-160`) and all 5 system screens are specified with every required field. P1 screens (`SCR-090`..`SCR-140`) are specified at the same field coverage, more concisely.
