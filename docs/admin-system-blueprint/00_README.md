# Admin System — UX & Frontend Functional Blueprint

**Project:** Casablanca V1 — Premium Car Rental / Airport Pickup
**Document set:** Admin System UX & Frontend Functional Blueprint
**Scope:** P0 (sellable core) + P1 (commercial differentiation)
**Status:** Build-ready functional specification (no code, no backend, no visual design)
**Version:** v1.1 - benchmarked and hardened from v0 after the audit in `15`. Accessibility (`16`), heuristics/laws traceability (`17`), forms/validation/money/error standard (`18`), microcopy/localization (`19`), financial rule semantics (`20`), safe financial policy configuration (`21`), configurable access control (`22`), and configuration governance (`23`) are now part of the set.
**Audience:** Frontend engineering team, product, design, and any AI agent that will build the Admin frontend from this blueprint.

---

## 1. What this blueprint is

This is the complete UX and frontend **functional** blueprint for the new **Admin System** of Casablanca V1. It exists so that a frontend team (or an AI agent) can build the entire Admin frontend with minimal ambiguity, without re-deriving product intent.

It translates the product vision into:

- a responsibility model (USER vs OPERATOR vs ADMIN);
- an information architecture;
- a use-case catalog;
- admin journey maps;
- deep per-module specifications;
- a full screen inventory and screen-by-screen specification;
- an interaction model;
- a state and edge-case matrix;
- a permission-aware UX matrix;
- a reusable component/pattern inventory;
- a commercial demo flow;
- a build-readiness checklist;
- a safe financial policy configuration system;
- a configurable access-control system;
- a governance model for sensitive configuration changes.

## 2. What this blueprint is NOT

This document set deliberately excludes:

- backend design, database schemas, API contracts, or technical architecture;
- React components, code, or pseudo-code;
- final visual design (exact colors, type scale, pixel spacing, shadows);
- P2 / Advanced / AI / Enterprise feature design (referenced only as forward-compatibility constraints);
- any duplication of the existing **operator console** workflow;
- any modification to existing app files.

Where this blueprint mentions states, statuses, or data, it describes them at the **product/UX** level (what the user sees and decides), not at the storage or API level.

## 3. Source of truth and inputs

This blueprint is derived from and consistent with:

| Input | Role in this blueprint |
|---|---|
| `docs/app/CURRENT_USER_OPERATOR_FLOW_SUMMARY.md` | Ground truth for existing USER and OPERATOR flows. Defines the boundary the Admin must respect. |
| `admin_system_product_proposal_p0_p1.md` (commercial proposal) | Product vision, positioning, personas, P0/P1 module set, mental model, demo narrative, UX quality bar. |
| `docs/operator/ROLE_ACCESS_MATRIX.md` | Confirms the existing `ADMIN` role and current `/operator/admin/*` nesting. Used for the forward IA decision. |
| `docs/frontend/02-INFORMATION-ARCHITECTURE.md` | Existing app IA and route conventions. |
| `docs/REFACTORING_PLAN_ADMIN_OPERATOR.md` | Confirms admin/operator separation intent and the direction toward audit logging. |

When the proposal and the implemented flow disagree, the implemented flow defines reality and the proposal defines direction. This is called out explicitly where relevant.

## 4. How to read this document set

Read in numeric order for a first pass:

1. `00_README.md` — this file: scope, conventions, IDs, glossary.
2. `01_PRODUCT_UX_VISION.md` — why the product exists and the experience bar.
3. `02_ACTORS_AND_RESPONSIBILITIES.md` — who uses it and the USER/OPERATOR/ADMIN boundary.
4. `03_INFORMATION_ARCHITECTURE.md` — navigation, routes, shell.
5. `04_USE_CASE_CATALOG.md` — what the admin does, formally.
6. `05_ADMIN_JOURNEY_MAPS.md` — how a day flows.
7. `06_MODULE_SPECIFICATIONS_P0_P1.md` — deep functional spec per module.
8. `07_SCREEN_INVENTORY.md` — the full list of screens.
9. `08_SCREEN_BY_SCREEN_SPECIFICATION.md` — full spec for each screen.
10. `09_INTERACTION_MODEL.md` — how critical interactions behave.
11. `10_STATE_AND_EDGE_CASE_MATRIX.md` — every state for every surface.
12. `11_PERMISSION_UX_MATRIX.md` — what each default role template and custom role can see/do.
13. `12_FRONTEND_COMPONENT_INVENTORY.md` — reusable UX building blocks.
14. `13_COMMERCIAL_DEMO_FLOW.md` — how to sell it in a demo.
15. `14_BUILD_READINESS_CHECKLIST.md` — gates before/while building.

**Benchmarking & cross-cutting standards (added in v1):**

16. `15_BLUEPRINT_AUDIT_V0.md` — the critical audit of v0: scores, gaps, risks, and the Phase 2 mandate.
17. `16_ACCESSIBILITY_SPECIFICATION.md` — build-ready WCAG 2.2 AA specification (`A11Y-###`).
18. `17_HEURISTICS_AND_UX_LAWS_TRACEABILITY.md` — NN/g heuristics + Laws of UX mapped to concrete behaviors.
19. `18_FORMS_VALIDATION_AND_ERROR_UX.md` — Baymard-grade form/validation, money, error taxonomy, freshness (`FV-###`, `ERR-##`).
20. `19_MICROCOPY_AND_LOCALIZATION.md` — voice/tone, message catalog, i18n + RTL (`CP-##`, `LOC-##`).
21. `20_FINANCIAL_RULES_MONEY_DEPOSIT_REFUND.md` — focused review: money model, secured/at-risk, release gate, cancellation/no-show/refund/deposit/damage rules, policy parameters (`FIN-###`, `MS-##`).
22. `21_FINANCIAL_POLICY_CONFIGURATION_SYSTEM.md` - safe configuration model for payment, deposit, cancellation, no-show, refund, damage, protection, currency, tax, and release-gate policies (`FPC-###`).
23. `22_CONFIGURABLE_ACCESS_CONTROL_SYSTEM.md` - default role templates, custom roles, capability-based permissions, sensitive capability controls, simulation, and emergency revoke (`ACC-###`).
24. `23_CONFIGURATION_GOVERNANCE_AND_SAFETY.md` - preview, approval, reason, audit, versioning, effective dates, rollback, contradiction prevention, and existing-reservation protection for sensitive configuration changes (`GOV-###`).

When building, the working triad is: **module spec (06) -> screen spec (08) -> interaction model (09)**, cross-checked against states (10) and permissions (11). Every screen must additionally satisfy the cross-cutting standards: **accessibility (16), forms/validation/money/error (18), and microcopy/localization (19)**, with benchmarking traced through (17). Financial behavior is governed by **money semantics (20) + safe configuration (21)**. Access behavior is governed by **permissions (11) + configurable access control (22)**. Sensitive configuration changes follow **governance (23)**. `15` is the audit of record and is historical once corrections land.

## 5. Scope levels

| Level | Meaning | In this blueprint |
|---|---|---|
| **P0** | Sellable operating core. The client can run the business with it. | Fully specified. |
| **P1** | Commercial differentiation layer. Helps run the business better. | Fully specified. |
| **P2** | Advanced / AI / Enterprise. | Out of scope. Only referenced as constraints in `01` and `14` so P0/P1 do not block it. |

P0 modules: Command Center, Reservations, Fleet, Customers & Drivers, Payments / Deposits / Invoices, Contracts & Digital Handover, Roles & Permissions, Settings / Business Rules.

P1 modules: Maintenance & Incidents, Calendar View, Pricing Rules, Notifications, Reports & Analytics, Audit Logs.

## 6. Identifier schemes

Stable IDs are used across all documents so they cross-reference cleanly. Never reuse a retired ID.

| Prefix | Meaning | Example | Defined in |
|---|---|---|---|
| `M-##` | Module | `M-01` Command Center | `06` |
| `SCR-###` | Screen / view | `SCR-010` Command Center | `07`, `08` |
| `UC-###` | Use case | `UC-012` Cancel a reservation | `04` |
| `INT-###` | Interaction | `INT-031` Confirm refund | `09` |
| `ST-###` | State pattern | `ST-002` Empty state | `10` |
| `PERM-###` | Permission capability | `PERM-032` Refund payment | `11` |
| `CMP-###` | Component / pattern | `CMP-007` StatusPill | `12` |
| `RP-#` | Role profile | `RP-1` Owner | `02`, `11` |
| `A11Y-###` | Accessibility requirement | `A11Y-016` Focus not obscured | `16` |
| `FV-###` | Form/validation rule | `FV-022` Restate before commit | `18` |
| `ERR-##` | Error class | `ERR-04` Conflict | `18` |
| `CP-##` | Content/microcopy rule | `CP-11` One name per concept | `19` |
| `LOC-##` | Localization rule | `LOC-02` RTL mirroring | `19` |
| `FIN-###` | Financial rule | `FIN-010` Secured vs at-risk | `20` |
| `MS-##` | Money lifecycle state | `MS-05` at-risk | `20` |
| `FPC-###` | Financial policy configuration rule | `FPC-004` Preview before commit | `21` |
| `ACC-###` | Access-control configuration rule | `ACC-003` Sensitive capabilities | `22` |
| `GOV-###` | Configuration governance rule | `GOV-006` Protect existing reservations | `23` |

### Module ID map

| ID | Module | Level |
|---|---|---|
| `M-01` | Command Center | P0 |
| `M-02` | Reservations Management | P0 |
| `M-03` | Fleet Management | P0 |
| `M-04` | Customers & Drivers | P0 |
| `M-05` | Payments, Deposits & Invoices | P0 |
| `M-06` | Contracts & Digital Handover | P0 |
| `M-07` | Roles & Permissions | P0 |
| `M-08` | Settings / Business Rules | P0 |
| `M-09` | Maintenance & Incidents | P1 |
| `M-10` | Calendar View | P1 |
| `M-11` | Pricing Rules | P1 |
| `M-12` | Notifications | P1 |
| `M-13` | Reports & Analytics | P1 |
| `M-14` | Audit Logs | P1 |

## 7. The Admin mental model (four dimensions)

Every Admin screen should answer at least one of these four questions. This is the spine of the whole product and is referenced throughout.

```txt
TIME    → what happens today, soon, overdue, expiring
STATE   → ready, blocked, pending, active, completed
RISK    → payment, document, vehicle, contract, incident
MONEY   → revenue, deposit, balance due, refund, charges
```

**Action-first, not data-first.** A screen that only displays data without enabling a decision or next step does not meet the quality bar.

## 8. Responsibility boundary (summary)

Full detail in `02_ACTORS_AND_RESPONSIBILITIES.md`.

```txt
USER      = self-service: browse, book, pay, upload docs, waiting room, ticket, own history/profile
OPERATOR  = single-case execution at the airport: queue, scan, in-case doc review, financial clearance, handoff, manual fallback, completion
ADMIN     = business control across all cases: oversight, money, fleet, customers/risk, contracts governance, staff/permissions, business rules, reporting, audit
```

The Admin **supervises and configures**; it does not replace the operator's per-case handoff. Each module spec includes an explicit "Operator boundary" note.

## 9. Glossary

| Term | Meaning in this blueprint |
|---|---|
| Reservation case | A reservation viewed as an operational object: status + risk + money + customer + vehicle + documents + timeline. |
| Blocker | A concrete reason a reservation cannot proceed (e.g., deposit not authorized, document rejected, vehicle unavailable). |
| Readiness | Whether a reservation is cleared for pickup (documents approved + financial clearance + vehicle available + contract ready). |
| Deposit / authorization | The held/authorized security amount, distinct from the rental payment. |
| Desk balance | Amount still due to be collected at the desk before release. |
| Handover / handoff | The physical vehicle delivery and return process (out and in), with checklist, photos, mileage/fuel, signature. |
| Manual fallback | Audited manual release path used when the normal scan/release flow is not possible. |
| Smart ticket | The customer's pickup QR ticket with manual code fallback. |
| Role template | A default permission bundle (Owner, Ops Manager, etc.) that can be cloned safely. Formerly called a role profile in earlier blueprint passes. |
| Custom role | A business-defined role created by cloning a template and editing capability grants inside safety guardrails. |
| Capability | A business-language permission such as "Can issue refunds" or "Can approve financial policy changes." |
| Financial policy | A governed set of payment, deposit, cancellation, refund, damage, tax, currency, and release-gate rules configured in Admin without code. |
| Policy version | A saved financial or business-rule configuration with author, reason, approval, effective date, and rollback history. |
| Command Center | The Admin home: the operational control screen, not a vanity dashboard. |
| Premium-quiet | The visual tone: sober, operational, high-contrast hierarchy, minimal decoration. |

## 10. Document conventions

- Statuses and states are written in `code style` when they are canonical product states.
- All use cases follow the fixed UC field set (see `04`).
- All screens follow the fixed screen field set (see `08`).
- All critical interactions follow the fixed interaction field set (see `09`).
- "P0/P1" labels appear on every module, screen, use case, and major interaction.
- Mermaid diagrams use the syntax rules required by the workspace.
- Nothing in this set authorizes building P2/AI features.

## 11. Out-of-scope reminders (anti-drift)

If, while building, any of the following appears, it is out of scope for this blueprint:

- choosing a state-management library, data-fetching approach, or API shape;
- inventing reservation states not present in the existing flow;
- building dynamic pricing intelligence, fraud scoring, telematics, or multi-branch advanced features;
- exposing arbitrary formulas, custom code, or developer rule syntax in Admin configuration;
- replacing the operator console;
- shipping dashboards whose metrics do not lead to an action or decision.
