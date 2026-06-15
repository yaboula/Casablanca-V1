# 14 — Build Readiness Checklist

**Scope:** The gates that confirm the blueprint is ready to build from, the recommended build order, and the per-screen Definition of Done.
**Read after:** all prior documents. This is the closing control document.

---

## 1. How to use this checklist

- Before building: confirm the blueprint-completeness gates (§2).
- While building: follow the build order (§3) and apply the per-screen DoD (§5) to each screen.
- Before shipping a module: apply the module exit criteria (§6) and the global quality gates (§7).

This checklist is UX/frontend-functional only. It does not gate backend/API/data work (out of scope, `00 §2`).

## 2. Blueprint-completeness gates (pre-build)

- [ ] All 14 modules (`M-01`..`M-14`) are specified in `06` with every required field.
- [ ] All 27 primary screens + 5 system screens are specified in `08` with every required field.
- [ ] Every screen maps to a module and at least one use case (`07 §6`).
- [ ] Every critical interaction in `09` maps to a use case and screen.
- [ ] Every screen's applicable states are defined in `10`.
- [ ] Every capability, default role-template grant, and custom-role constraint is defined in `11`/`22`.
- [ ] Every screen's key components are listed in `12`.
- [ ] No ID is orphaned (every `SCR`/`UC`/`INT`/`PERM`/`CMP` referenced is defined).
- [ ] The operator boundary note is present on every module (`06`, `02`).
- [ ] No backend/API/DB/code/visual-implementation decision appears anywhere.
- [ ] No P2/AI feature is specified as build work (only constraints in `01 §10`).
- [ ] The cross-cutting standards exist and are referenced: accessibility (`16`), heuristics/laws traceability (`17`), forms/validation/money/error (`18`), microcopy/localization (`19`), financial semantics (`20`), financial policy configuration (`21`), configurable access control (`22`), and configuration governance (`23`).
- [ ] The v0 audit (`15`) corrections are reflected; no gate over-claims accessibility readiness.

## 3. Recommended build order

Build P0 to completeness before deep P1. Within P0, build the shell + trust layer first, then the hero, then transactional depth.

```txt
Phase A — Foundation
  1. AppShell + nav + global search + system screens (CMP-000/001/002, SCR-900..904)
  2. Trust-layer primitives (CMP-007 StatusPill, CMP-008 BlockerCallout,
     CMP-009 MoneyBreakdown, CMP-011 ReadinessChecklist, CMP-042/043 dialogs,
     CMP-060..067 feedback/state components)
  3. CapabilityGate + permission wrappers (CMP-080/081/082)

Phase B — Hero + core cases
  4. Command Center (SCR-010)
  5. Reservations list + case (SCR-020/021) with interventions (INT-020..023)
  6. Fleet list + vehicle (SCR-030/031) with block/reassign (INT-040/041, INT-021)

Phase C — Money + people + documents
  7. Payments + transaction + invoices (SCR-050/051/052) with refund/charge (INT-031/032)
  8. Customers + profile (SCR-040/041) with notes/flags (INT-050)
  9. Contracts & handover (SCR-060/061) with evidence + charge-from-damage

Phase D — Governance
  10. Staff + staff detail + roles/access control (SCR-070/071/072)
      with role changes, custom roles, diff preview, and emergency suspend (INT-060/061/062)
  11. Settings hub + sections (SCR-080/081) with previewable config (INT-070)
  12. Financial Policies (SCR-082) with guarded rule builder, simulator,
      approvals, effective dates, version history, and rollback (INT-071)

Phase E — P1 differentiation (only after P0 exit criteria met)
  13. Maintenance & incidents (SCR-090/091)
  14. Calendar (SCR-100)
  15. Pricing rules (SCR-110)
  16. Notifications (SCR-120)
  17. Reports & analytics (SCR-130)
  18. Audit logs (SCR-140) + in-context history panels
```

Rationale: the trust layer and shell are dependencies for every screen; the Command Center and Reservations case are the demo/value core; P1 is gated behind P0 completeness (`01 §11`, product risk "P1 before P0 maturity").

## 4. Cross-cutting foundations (must exist before screens depend on them)

- [ ] Canonical status vocabulary implemented once in `CMP-007` (no ad-hoc statuses).
- [ ] Canonical reservation state segments (`03 §7`) used consistently.
- [ ] Money is always rendered via `CMP-009` with currency and explicit components.
- [ ] Critical-action pattern (`CMP-043` + `CMP-046` reason) reused for all critical interactions.
- [ ] All canonical states (`10 §1`) have reusable components (`CMP-063/064/061/062/065/066/067`).
- [ ] Permission gating wrappers (`11`) applied consistently (hide-vs-disable).
- [ ] "Today" definition consistent across Command Center and Calendar (`00 §7`).
- [ ] **Accessibility foundation (`16`):** focus management, visible focus (`A11Y-015`), focus-not-obscured for sticky shell (`A11Y-016`), 24×24 targets (`A11Y-005`), status announcements (`A11Y-040`), reduced motion (`A11Y-060`) — implemented in shared primitives before screens depend on them.
- [ ] **Forms/validation/money standard (`18`):** one validation engine (reward-early/punish-late, `FV-010`), money confirm pattern (`FV-022`), error taxonomy (`§4`), and freshness model (`FV-041`) implemented once and reused.
- [ ] **Microcopy/localization (`19`):** message catalog wired, strings externalized, locale-aware money/date formatting (`LOC-03`), RTL-capable layout (`LOC-02`).
- [ ] Responsive baseline: desktop-first with defined narrow behavior (`03 §8`); reflow + responsive tables per `16 §8` / `18 §6`.

## 5. Per-screen Definition of Done

A screen is done when all of the following hold:

- [ ] Implements its spec in `08` (purpose, sections, data, actions).
- [ ] Has a single clear primary action (or none, intentionally).
- [ ] Implements loading, loaded, empty (where applicable), and full-error states from `10`.
- [ ] Empty/error states offer a next step (no dead ends).
- [ ] Blocked entities show the reason inline (`ST-007` where applicable).
- [ ] Permission-limited and forbidden behaviors per `11` (gated sections/actions; forbidden shell on gated routes).
- [ ] All critical actions use the critical-action dialog with reason/consequence (`09`).
- [ ] State-unavailable actions are disabled with a tooltip; permission-unavailable actions are hidden/locked.
- [ ] All actions give success/failure feedback; failures preserve input.
- [ ] Money shown with currency and explicit components (where money appears).
- [ ] Detail screens have breadcrumbs and a back-to-list path; lists route to detail.
- [ ] Cross-links from `03 §5.1` that originate here are reachable.
- [ ] Responsive behavior implemented per `08`/`03 §8`; reflow + table degradation per `16 §8`/`18 §6`.
- [ ] **Accessibility:** passes the relevant per-pattern checklists in `16 §10` (keyboard-only path, focus order/return, announcements, target sizes, no color-only status); keyboard-only walkthrough of the screen's critical flow succeeds (`A11Y-091`).
- [ ] **Forms/money:** validation follows `18 §3`; money actions follow `18 §5`; errors follow the `18 §4` taxonomy.
- [ ] **Copy:** all confirmations/errors/empty states use the `19 §3` catalog; one canonical term per concept.
- [ ] **Benchmark trace:** the screen's patterns map to the relevant rows in `17` and pass their "Verify" checks.
- [ ] No vanity metric (every number links to a list); no table-only dead end.

## 6. Module exit criteria

A module is shippable when:

- [ ] All its owning screens meet the per-screen DoD.
- [ ] All its use cases (`04`) can be completed end-to-end.
- [ ] Its operator boundary holds (no operator-console duplication; `02 §8`).
- [ ] Its critical interactions are confirmed, reasoned, and (where applicable) surface in audit (`M-14`).
- [ ] Its acceptance criteria in `06` are met.
- [ ] Its empty/error/permission states match `10`/`11`.

### P0 completeness gate (before any P1 build)

- [ ] M-01..M-08 all meet module exit criteria.
- [ ] The demo flow (`13`) runs end-to-end on seeded data without unintended empty/error states.
- [ ] The boundary acceptance criteria (`02 §8`) all hold.
- [ ] Money control (`M-05`) is trustworthy: every transaction links to a reservation; refunds/charges/deposit actions are gated, confirmed, and reasoned.
- [ ] Financial rules (`20`) are implemented: stage-aware secured/at-risk (`FIN-010`) with visible gap; financial release gate (`FIN-020`); cancellation/no-show/refund/deposit/damage math; deposit capture/release (`INT-033`); all monetary policy resolves to safe Financial Policy configuration (`21`), never hardcoded.

## 7. Global quality gates (product-wide)

Mapped to the UX acceptance principles (`01 §8`):

- [ ] **No ambiguity** — every status has one documented meaning (`10 §4`).
- [ ] **No hidden blockers** — blocked cases explain why (`CMP-008`).
- [ ] **No dead ends** — every screen/state offers a next step.
- [ ] **No fake dashboards** — every metric drills to its source.
- [ ] **No generic SaaS** — premium-quiet tone held (`01 §6`).
- [ ] **No table-only product** — every list has a decision-making detail view.
- [ ] **No noisy alerts** — alerts prioritized and actionable (`CMP-014`).
- [ ] **No risky silent actions** — critical actions confirmed + reasoned (`09`).
- [ ] **Auditability** — critical actions traceable (`M-14`).
- [ ] **Premium hierarchy** — strong visual hierarchy on every screen.
- [ ] **Accessible by standard** — WCAG 2.2 AA met per `16`; automated checks 0 critical + manual focus/announce/contrast checks pass (`A11Y-090..093`).
- [ ] **Benchmarked, not by taste** — heuristics/laws traceability holds (`17`); no screen fails its mapped "Verify."
- [ ] **Consistent language** — one canonical term per concept; all states use the `19` catalog.
- [ ] **Localization-ready** — strings externalized, locale formatting + RTL layout verified on key screens (`LOC-02/03`).

## 8. Anti-drift guardrails (reject if present)

- [ ] No screen reproduces the operator desk queue as its primary mode.
- [ ] No money shown as bare "paid/unpaid."
- [ ] No critical action is one-click.
- [ ] No gated data leaks via list, search, or export.
- [ ] No P2/AI feature built (only forward-compatibility preserved).
- [ ] No backend/API/data-model decision embedded in the frontend build.
- [ ] No invented reservation states beyond the canonical set (`10 §4`).

## 9. P2 forward-compatibility preservation (verify, do not build)

Confirm P0/P1 leave the door open for P2 (`01 §10`) without building it:

- [ ] Statuses and event history are clean and consistent (AI/analytics readiness).
- [ ] Customer history, documents, payments, incidents are centralized and linkable (risk scoring readiness).
- [ ] Each vehicle is a controlled object with identity/status/usage history (telematics readiness).
- [ ] Locations exist as a configurable concept (multi-branch readiness).
- [ ] Payments/deposits/refunds/fees/invoices are clean and traceable (accounting integration readiness).
- [ ] Maintenance/incident/cost history accrues per vehicle (predictive maintenance readiness).

## 10. Handoff note for the build team / next agent

To build a screen, work in this order:
1. Read its module spec (`06`) for intent and acceptance criteria.
2. Read its screen spec (`08`) for layout, sections, data, and states.
3. Read its interactions (`09`) for action behavior and confirmations.
4. Cross-check states (`10`) and permissions (`11`).
5. Compose from the component inventory (`12`); add new components only if a genuine gap exists, and register them with a new `CMP-###` ID.
6. Apply the cross-cutting standards: accessibility (`16`), forms/validation/money/error (`18`), microcopy/localization (`19`); confirm benchmarking via `17`.
7. Validate against the per-screen DoD (§5) and global quality gates (§7).

This blueprint is intentionally complete enough to build the entire Admin System frontend with minimal ambiguity. Where a genuine gap is found, record it as an assumption and resolve it with product before improvising.
## 11. Configuration safety addendum

Before frontend architecture begins for the governance phase:

- [ ] **Financial policy configuration (`21`):** safe presets, structured rule tables, guarded rule builder, simulator, version history, effective dates, rollback, and no arbitrary formulas are specified for `SCR-082`.
- [ ] **Configurable access control (`22`):** default templates, custom roles, sensitive capabilities, permission diff preview, view-as-role simulation, emergency suspend, and last-owner protection are specified for `SCR-072`.
- [ ] **Configuration governance (`23`):** preview, reason, approval, audit, versioning, rollback, contradiction detection, and existing-reservation protection are applied to Financial Policies, Roles & Permissions, Business Rules, Pricing Rules, Notification Templates, and Handover/Contract Terms.
- [ ] Financial rules (`20`) resolve to safe Financial Policy configuration (`21`), never hardcoded policy values or developer-only decisions.
- [ ] No arbitrary formulas, scripts, custom code, or free-form rule logic appears in Admin configuration.
- [ ] No sensitive configuration change silently rewrites existing reservations, completed handovers, invoices, contracts, or accepted customer terms.
