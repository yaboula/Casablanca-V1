# 21 - Financial Policy Configuration System

**Type:** Product/UX functional specification for safe financial policy configuration.
**Scope:** Settings / Business Rules -> Financial Policies. No backend, database, API, payment-provider, accounting, or formula-engine design.
**Authority:** This document reframes the policy parameters in `20` as a governed Admin configuration system. `20` remains the source of truth for money lifecycle semantics; this document defines how business owners safely configure the policy values and rule tables that feed those semantics.
**ID scheme:** Financial policy configuration requirements use `FPC-###`.

---

## 1. Product position

The Admin must let a rental business configure its own payment, deposit, cancellation, refund, damage, tax, and release rules without calling a developer. It must do this inside guardrails.

```txt
Admin can configure policies.
Admin cannot write code.
```

The Financial Policy Configuration System is not a developer rule engine. It is a business-owner control surface made of presets, structured rule tables, dropdown conditions, safe numeric fields, previews, simulation, approvals, audit, versions, effective dates, and rollback.

## 2. Non-negotiable guardrails

- **FPC-001 - No arbitrary formulas:** No free-form expressions, scripting, SQL-like filters, custom code, or hidden formula syntax.
- **FPC-002 - Structured rules only:** Conditions come from approved dropdowns and rule tables: vehicle category, rental duration band, pickup timing, cancellation timing, protection plan, customer channel, and lifecycle state.
- **FPC-003 - Safe numeric ranges:** Amounts, percentages, windows, tolerances, and fees use bounded numeric fields with business-readable helper text and inline validation from `18`.
- **FPC-004 - Preview before commit:** Any rule that can change customer price, refund, deposit, release readiness, or charge behavior must show a before/after preview.
- **FPC-005 - Simulator for sensitive changes:** Payment, deposit, cancellation, no-show, refund, damage, release-gate, tax, and currency changes must be simulatable against sample reservations before save.
- **FPC-006 - Approval and reason:** Sensitive changes require a reason; high-risk changes require approval per `23`.
- **FPC-007 - Effective dates:** Financial policy changes apply from an explicit effective date/time and never silently rewrite existing reservations.
- **FPC-008 - Version history and rollback:** Every saved policy creates a version. Rollback creates a new version restoring earlier values; it does not erase history.
- **FPC-009 - Conflict detection:** The UI blocks contradictory policy combinations and explains the conflict in business language.
- **FPC-010 - Customer-facing impact:** Any change that affects customer-facing copy, amounts, invoices, deposit messages, cancellation terms, or checkout/payment instructions must preview that impact.

## 3. Settings section

**Location:** `Settings / Business Rules -> Financial Policies`

**Primary screen:** `SCR-082` Financial policies, reached from the Settings hub and relevant money/release-gate explanations.

**Navigation inside section:**

```txt
Financial Policies
  Booking payment rules
  Deposit rules
  Protection / insurance plans
  Cancellation rules
  No-show rules
  Late pickup / late return rules
  Damage and charge rules
  Refund rules
  Currency and tax rules
  Release gate rules
  Policy simulator
  Version history
  Change approval / audit
```

Each tab shows:

- current active policy version and effective date;
- next scheduled version, if any;
- last changed by / last approved by;
- policy status: `draft`, `pending approval`, `scheduled`, `active`, `superseded`, `rolled back`;
- "Preview impact" and "Simulate" actions where relevant;
- "Save draft", "Submit for approval", "Schedule", and "Rollback" actions based on permission and state.

## 4. Screen behavior and layout

### 4.1 Financial Policies landing

- **Header:** Financial Policies, active version, effective date, policy health indicator.
- **Primary action:** Create policy change draft.
- **Secondary actions:** Open simulator; view version history; compare versions.
- **Summary panels:** Payment, deposit, cancellation/no-show, refund, damage/charges, currency/tax, release gate.
- **Risk panel:** Conflicts, scheduled changes, policies missing required values, policies affecting upcoming reservations.

### 4.2 Rule table pattern

Rule tables use business-readable rows:

| Column | Behavior |
|---|---|
| Applies when | Dropdown conditions only, such as vehicle category, duration band, cancellation timing, protection plan. |
| Policy result | Bounded numeric amount, percentage, or selected preset. |
| Customer message | Preview of customer-facing impact where applicable. |
| Risk / warning | Inline warning for unusually strict, loose, or conflicting rules. |
| Status | Enabled, draft, scheduled, inactive. |
| Actions | Edit, duplicate, disable, move priority, preview. |

Rule priority is visible where more than one rule can match. Reordering must offer keyboard alternatives per `16 A11Y-018`.

### 4.3 Guarded rule builder

The rule builder is a drawer, not a blank formula editor.

Steps:

1. Choose policy area.
2. Choose preset or start from existing rule.
3. Choose approved conditions from dropdowns.
4. Enter bounded amounts, percentages, or windows.
5. Review validation warnings and conflicts.
6. Preview customer/admin/operator impact.
7. Simulate sample reservations.
8. Save draft or submit for approval.

### 4.4 Policy simulator

The simulator must support sample cases:

- economy / premium / luxury vehicle;
- short rental / week rental / long rental;
- before pickup / at pickup / during rental / after return;
- paid in full / partial prepayment / desk balance;
- deposit authorized / missing / expired;
- cancellation far before pickup / within fee window / no-show;
- damage under deposit / damage above deposit;
- protection plan none / basic / premium.

Simulator output:

- required prepayment;
- required deposit;
- desk balance;
- secured vs at-risk state and gap;
- release-gate result;
- cancellation/no-show fee;
- refund owed;
- deposit capture/release;
- customer-facing text snippets;
- admin-facing warnings;
- operator-facing release gate effect.

The simulator is preview-only. It does not mutate reservations.

## 5. Policy area specification matrix

The table below covers the 24 financial/commercial decisions. Every row is configurable only through safe controls.

| # | Area | Configurable | Not freely configurable | Safe limits, defaults, validation | Preview, permission, audit, versioning, impact, risk |
|---:|---|---|---|---|---|
| 1 | Payment model | Choose preset: full online prepay, partial prepay + desk balance, deposit-only reservation, pay at desk with authorization. | No custom payment state machine; no code-defined payment flows; no bypass of money breakdown from `20`. | Default preset: partial prepay + deposit authorization. Payment model must still expose rental, deposit, desk balance, refunds, and charges separately. | Requires `PERM-062` to draft and `PERM-063`/Owner approval to approve. Simulator shows checkout, desk balance, release gate, and money-at-risk effect. Audited, versioned, effective dated. Risk: releases with unexpected unpaid balance. |
| 2 | Booking prepayment amount | Fixed amount, percentage of rental, first-day amount, full amount, or none for selected channels/categories. | No negative prepayment; no arbitrary calculation. | Percent range 0-100; fixed amount cannot exceed estimated rental unless explicitly confirmed as full prepay. Default: business-selected preset. | Preview shows customer checkout amount and remaining desk balance. Conflicts if prepayment + deposit exceeds configured customer-visible cap. Risk: conversion loss or under-secured bookings. |
| 3 | Deposit requirement | Required, optional for selected trusted categories, waived only by explicit protected preset. | No silent waiver for all bookings without warning; deposit remains separate from rental payment. | Default: required. Waiver requires reason and approval. Rule conditions limited to vehicle category, protection plan, business channel, customer risk status. | Simulator shows `deposit-pending`, `secured`, and release gate. Existing reservations keep original deposit policy unless manually reviewed. Risk: fleet exposure. |
| 4 | Deposit calculation | Fixed amount, per vehicle category, percentage of rental, duration band, protection-plan adjusted. | No open formula; no deposit based on arbitrary customer attributes. | Min/max per vehicle class; percentage 0-300 of rental; zero deposit only via waiver preset. | Preview shows per-category deposit table and customer message. Conflict if premium vehicle has lower deposit than lower-risk configured minimum without warning. Risk: under-collateralized damage exposure. |
| 5 | Deposit authorization timing | At booking, before pickup, at desk, or re-authorize before return if expiring. | No release without a defined authorization checkpoint unless release gate explicitly accepts at-risk override. | Default: authorize before pickup. Timing must produce a visible blocker if missing at release. | Simulator shows when blocker appears. Audit includes changed timing and reason. Risk: operational surprise at airport. |
| 6 | Secured vs at-risk definition | Business may configure which funds count as secured only within allowed categories: captured, authorized, reconciled desk collection. | Cannot redefine `FIN-010`; cannot count unreconciled operator-recorded money as secured unless reconciled. | Default follows `FIN-010` and `FIN-011`. Any relaxation is blocked; wording can be configured, logic cannot. | Preview shows gap calculation. Locked by product safety; change attempts explain why. Risk: false financial clearance. |
| 7 | Release gate with money pending | Configure whether release requires full desk balance, deposit, and no unresolved financial blockers; configure tolerance `P-TOL`; define override policy. | Cannot remove visibility of financial blockers; cannot make override one-click; cannot hide at-risk state. | Default tolerance 0 unless owner sets small rounding tolerance. Tolerance must be currency-bounded. Override always reasoned and audited. | Simulator shows pass/fail checklist. Approval required if loosening gate. Risk: vehicle leaves with unpaid balance or no deposit. |
| 8 | Desk balance handling | What balance must be collected at desk, whether extras add before release, allowed rounding tolerance, operator instruction text. | Admin cannot mark desk money reconciled automatically from operator entry. | Desk balance cannot be negative without creating `refund-owed`. Operator instruction must be previewed. | Preview shows operator-facing release note and admin money breakdown. Risk: mismatch between desk collection and finance reconciliation. |
| 9 | Cancellation policy | Presets: flexible, moderate, strict, non-refundable rate; custom structured windows. | No arbitrary clauses; no hidden fees not shown to customer. | Windows must be ordered; fees 0-100% or fixed bounded amount; no overlapping contradictory windows. | Customer terms preview required. Approval for stricter policy. Existing reservations retain booked terms. Risk: disputes and chargebacks. |
| 10 | Cancellation window | Time bands before pickup, such as 48h+, 24-48h, 0-24h. | No ambiguous natural-language windows. | Windows cannot overlap or leave undefined gaps unless default fallback is set. Timezone must be explicit. | Simulator shows examples with exact pickup/cancel times. Risk: staff/customer disagreement. |
| 11 | Cancellation fee | Fixed fee, percentage of rental/prepayment, first-day charge, full prepayment retention by window. | No fee above configured cap without warning; no negative fee. | Percentage 0-100 unless legal/business override is approved. Fixed fee cannot exceed amount paid without routing to charge flow. | Preview shows refund due and retained fee. Risk: refund errors or customer disputes. |
| 12 | No-show policy | Grace period, trigger rule, fee basis, whether deposit may be used for fee. | No automatic no-show before grace period; no silent deposit capture. | Grace period bounded; fee follows same caps as cancellation unless owner-approved stricter preset. | Simulator shows no-show moment and financial consequence. Audited as distinct from cancellation. Risk: unfair charge, poor customer experience. |
| 13 | Pickup grace period | Minutes/hours after scheduled pickup before warning and no-show eligibility. | No zero-minute no-show without high-risk warning. | Default uses business-selected airport pickup preset. Must be explicit in timezone and shown to staff/customer where relevant. | Preview customer waiting-room message and admin alert timing. Risk: premature no-show and customer service failure. |
| 14 | Late return tolerance | Time buffer before late fee, warning, or incident. | No hidden late fee without customer-facing term preview. | Tolerance must be non-negative; late fee bounded by fixed amount, hourly, daily, or selected preset. | Simulator shows return at +15m/+2h/+1d. Risk: revenue leakage or unfair charges. |
| 15 | Refund behavior | Automatic refund owed flag vs manual finance action, partial refund allowance, refundable fee basis. | No refund above captured amount; no undo refund. | Must follow `FIN-050`; max refundable shown; reason required. | Preview cancellation/refund chain. Permission `PERM-032`; approval for exceptional refund rules. Risk: over-refund or unresolved credit. |
| 16 | Refund timing message | Customer-facing estimate text by method or policy: "usually X business days". | No promise of provider settlement as guaranteed if not controlled. | Must use message templates and whole-sentence localization from `19`; range must be realistic and approved. | Preview customer email/receipt wording. Risk: expectation mismatch and support load. |
| 17 | Deposit release | Release timing after return, manual review requirement, damage hold window. | No capture without charge/evidence flow; no indefinite hold without warning. | Timing must be explicit; hold extension requires reason. Release uses `INT-033`. | Simulator shows no-damage return and damage review path. Risk: customer disputes and card authorization expiry. |
| 18 | Damage charge policy | Deposit-first, separate excess charge, evidence required level, charge types. | Cannot charge pre-existing damage; cannot bypass reason/evidence warning. | Default: deposit-first per `FIN-072`; positive amount only; evidence link required or missing-evidence warning. | Preview out/in evidence, deposit capture, excess charge. Permission `PERM-033`. Risk: unwinnable disputes. |
| 19 | Damage exceeding deposit | How excess becomes a separate charge, invoice line, approval threshold. | Cannot silently increase deposit capture above held amount. | Excess must route to separate charge; threshold can require finance/owner approval. | Simulator shows damage EUR 500 with deposit EUR 300. Risk: uncaptured loss or illegal over-capture. |
| 20 | Extras and fines charging moment | Pre-release extras increase desk balance; post-return fines become charges; selected extras can prepay online. | No untyped charges; no hidden extra added without line item. | Charge types must come from controlled catalog; amount positive; tax behavior defined. | Preview invoice/money breakdown and release gate. Risk: invoice confusion and lost revenue. |
| 21 | Protection/insurance reducing deposit | Plans can reduce deposit by fixed amount/percent or use per-category table. | Cannot make plan legal terms arbitrary; cannot reduce below protected minimum without approval. | Default plan set must state deposit effect, included/excluded damage, and customer-facing label. | Simulator compares no plan/basic/premium. Risk: underpriced protection or ambiguous coverage. |
| 22 | Currency model | Primary currency, display currency, rounding, exchange-rate display policy if future multi-currency. | No per-reservation arbitrary currency without explicit product support; no bare numbers. | Default EUR per `19 LOC-03`. Currency change is high-risk and scheduled only. | Preview all money surfaces and invoices. Existing reservations retain booked currency. Risk: accounting mismatch. |
| 23 | Tax/VAT display | Inclusive/exclusive display, VAT rate table, fee taxability, invoice wording. | No hidden tax; no unlabelled fees. | Rates bounded 0-100; changes effective dated; invoice/customer preview required. | Approval required for rate/display change. Simulator shows checkout, invoice, refund tax handling. Risk: compliance and customer trust. |
| 24 | Who can change financial rules | Assign capabilities and approval chain for policy drafts, approvals, rollback. | No self-approval for sensitive financial change when separation-of-duties applies; no anonymous changes. | Default: Owner can approve; Finance can draft refund/tax rules; Ops can simulate/review pickup/no-show timing and may draft only if granted `PERM-062`; all sensitive changes require reason. | Governed by `22` and `23`; audit includes diff, reason, approval, effective date, impacted policy areas. Risk: employee misconfiguration or hidden financial changes. |

## 6. Validation and conflict detection

The Financial Policies section blocks save when:

- cancellation windows overlap or leave an undefined outcome;
- no-show grace period conflicts with cancellation window;
- release gate says deposit required but deposit policy can produce no required deposit without waiver warning;
- protection plan reduces deposit below minimum without approval;
- tax display has no rate for a taxable fee;
- currency change is scheduled while future reservations exist without an impact plan;
- refund rules allow refund greater than captured funds;
- damage policy tries to capture more than held deposit;
- customer-facing terms are missing for a customer-impacting policy.

Warnings, not hard blocks, appear when:

- policy is unusually strict and may reduce conversion;
- policy is unusually loose and may increase financial/fleet risk;
- rule priority means a new rule rarely or never applies;
- upcoming reservations will use an older version while new bookings use the new version.

## 7. Permission requirements

Financial policy configuration introduces specialized sensitive capabilities in `11`:

- `PERM-062` Manage financial policies;
- `PERM-063` Approve financial policy changes;
- `PERM-064` Roll back financial policy versions;
- `PERM-065` Simulate financial policy impact.

Default posture:

- Owner / CEO: manage, approve, rollback, simulate.
- Finance Admin: manage finance-owned policy drafts and simulate; approval only if granted.
- Operations Manager: simulate and review operational timing impact by default; may draft operational timing rules only if granted `PERM-062`; cannot approve money-impacting changes by default.
- Supervisor: view history and audit if audit capability granted.

## 8. Versioning, effective dates, and rollback

- Every saved change creates a policy draft with a diff against the active version.
- Approved changes are scheduled with an effective date/time.
- Existing reservations keep the policy version captured at booking or at the relevant lifecycle decision, unless a permitted admin explicitly applies a change to selected future reservations with preview and reason.
- Rollback creates a new version that restores the selected prior version from a chosen effective date.
- Version comparison shows: changed fields, old value, new value, author, approver, reason, effective date, customer impact, and simulator snapshots.

## 9. Customer, admin, and operator impact

| Audience | What changes they see |
|---|---|
| Customer | Checkout prepayment, deposit amount, cancellation terms, no-show grace, refund/deposit timing messages, protection plan explanation, tax display, invoice wording. |
| Operator | Release gate pass/fail, desk balance instruction, deposit authorization requirement, no-show timing, late return alerts. Operator cannot configure these policies. |
| Admin | Money at risk, policy warnings, simulator output, version history, approvals, audit entries, reports segmented by policy version where useful. |

## 10. States

Financial Policies must support:

- `draft`;
- `invalid draft`;
- `pending approval`;
- `approval rejected`;
- `scheduled`;
- `active`;
- `superseded`;
- `rolled back`;
- `conflict detected`;
- `simulation stale`;
- `permission-limited`;
- `read-only historical version`.

## 11. Empty, loading, error, and permission states

- **Empty first-run:** Show recommended starter presets: "Airport standard", "Strict premium fleet", "Flexible conversion". Admin must review before activation.
- **Loading:** Skeletons preserve table/form shape; active policy summary loads independently from version history.
- **Validation errors:** Inline per `18 FV-010` with summary on submit.
- **Conflict errors:** Use `ERR-04` style if another admin changed the policy draft.
- **Permission-limited:** Viewers without manage capability can view active policies and simulator only if granted; sensitive values hidden where financial view is not granted.
- **Forbidden:** Route uses `SCR-900`.

## 12. Accessibility and form requirements

- All rule tables must be keyboard-operable and expose row/column relationships (`16 10.1`).
- Drawers and confirmations follow `16 10.2`.
- Money fields follow `18 5` and `CMP-049`.
- Reordering rule precedence provides move up/down controls, not drag-only (`16 A11Y-018`).
- Simulator result changes are announced via live region (`16 A11Y-040`).
- Long localized labels must fit with 35 percent expansion (`19 LOC-04`).

## 13. Acceptance criteria

- [ ] All 24 financial decisions are represented as safe structured configuration, not hardcoded undocumented policy.
- [ ] No area allows arbitrary formulas, scripts, custom code, or unbounded free logic.
- [ ] Every sensitive change has preview, reason, audit, versioning, effective date, and rollback.
- [ ] Simulator covers booking, pickup, active rental, cancellation, no-show, return, damage, refund, and deposit release scenarios.
- [ ] Existing reservations are protected from silent retroactive policy changes.
- [ ] Customer-facing impact is previewed before customer-impacting policy changes are saved.
- [ ] Release-gate and secured/at-risk semantics remain aligned with `20`.
- [ ] Permission-limited states, validation, accessibility, and localization follow `11`, `16`, `18`, and `19`.
