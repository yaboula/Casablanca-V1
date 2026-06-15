# 01 — Product UX Vision

**Scope:** Foundational. Governs every other document.
**Read after:** `00_README.md`.

---

## 1. Product thesis

> The Casablanca Admin System is a **Business Operations Control Center** for premium car rental with airport pickup. It is not a dashboard, not a CRUD admin, not an extended operator console. It is the layer where the business is **controlled**: money is protected, the fleet is protected, risk is visible, staff is accountable, and the rules of the business are configured.

The winning version of this product is not the one with the most screens. It is the one that lets a manager, in the first minute of the day, understand what is happening, what is blocked, what is at risk, and what to do next — and then act.

## 2. The one-sentence value promise

> "You can run and supervise your entire rental operation from one place — reducing errors, manual work, financial losses, and blind spots."

## 3. What the business owner must control (first principles)

The Admin exists to answer, every day, questions the operator console cannot fully answer:

- Is the business running well **today**?
- Where are we **losing money** (unpaid balances, unauthorized deposits, refunds, damages)?
- Which vehicles are **generating value** and which are **blocked**?
- Which reservations are **at risk** or **blocked**, and **why**?
- Which payments, deposits, or invoices are **missing**?
- Which staff made **critical changes**, and when?
- Which **business rules** govern pricing, hours, extras, deposits, and cancellations?
- Which problems **repeat**?
- What **decision** must the manager make now?

If a screen cannot trace back to one of these questions, it does not belong in P0/P1.

## 4. The first 30 seconds

When an admin opens the product, within ~30 seconds they must understand:

1. **Today's shape** — how many pickups and returns, how much revenue is expected/at risk.
2. **What is blocked** — reservations that cannot proceed and the concrete reason.
3. **What is at risk financially** — money not yet secured before a vehicle leaves.
4. **What needs a human decision** — items that will not resolve themselves.

The Command Center (`M-01`) is designed around exactly this. Everything else is reachable from there.

## 5. Experience principles

These principles are inherited from the commercial proposal and are binding.

### 5.1 Action-first, not data-first

Every primary surface answers: *What is happening? What is blocked? What requires action? What risk exists? What should I do now?* Numbers exist to drive an action, never as decoration.

### 5.2 Daily operation comes first

The intended first experience of the day:

```txt
Open admin → understand the day → see critical reservations → see problem vehicles → see pending payments/documents → act
```

Not:

```txt
Open admin → see many numbers → hunt for what to do → scan several tables → lose time
```

### 5.3 Clear states over giant tables

Tables are tools, not the product. Work is organized by **state**, not just by date:

```txt
ready · blocked · payment pending · document pending · vehicle unavailable · return due · issue detected · completed
```

### 5.4 Trust before decoration

A pretty UI is insufficient; the user must **trust** the system. Trust means: consistent states, confirmed critical actions, visible history, auditable changes, explicit blocking reasons, unambiguous messages, and traceable financial data.

### 5.5 Premium, not generic SaaS

The product should feel sober, operational, premium, fast, and clear — strong visual hierarchy, minimal decorative cards, no dashboards full of irrelevant metrics. We call this tone **premium-quiet**.

### 5.6 Safe configurability

The owner can adapt financial policies, business rules, roles, pricing, notifications, and contract terms without a developer, but only through presets, structured rules, preview, approval, audit, versions, effective dates, and rollback. Arbitrary formulas, code, and unsafe free logic are not part of the Admin product.

## 6. Design tone guardrails (functional, not visual implementation)

These are UX intent guardrails, not a visual design spec. They tell the build team *how the product should behave and feel*, while leaving exact visual tokens to design.

| Guardrail | Intent |
|---|---|
| Hierarchy over density | The most decision-relevant information is the most prominent. Secondary data is available but quiet. |
| One primary action per surface | Each screen has an obvious primary action; secondary actions are visually subordinate. |
| Status is a first-class citizen | Status and blocking reason are always legible at a glance and never hidden behind a click. |
| Money is always explicit | Where money is involved, the breakdown (paid / deposit / balance / refund / charges) is visible, never collapsed into "paid/unpaid". |
| Calm by default, loud only when it matters | Critical alerts are visually distinct and rare; everything else is calm. |
| No dead ends | Every important screen offers a next action, even in empty/error states. |

## 7. Anti-patterns (explicitly forbidden)

From the proposal's "what it is not" and the UX quality bar. A module or screen that exhibits any of these fails review.

| Anti-pattern | Why it is banned |
|---|---|
| Decorative dashboard | Looks good, helps nothing. Metrics must lead to action. |
| Collection of CRUDs | The product is a control system, not a database editor. |
| One giant reservations table | Reservations are cases, not rows. |
| Generic SaaS visual language | The product must feel specific to premium rental ops. |
| Extended operator console | Admin supervises and configures; it does not execute handoffs. |
| AI-first with no solid data | No intelligence features in P0/P1; only forward-compatibility. |
| Hidden blockers | A blocked case must always explain why. |
| Ambiguous status | The user must always know what a status means. |
| Silent risky actions | Critical changes (cancel, refund, override release, role change, price change) require confirmation and context. |
| Noisy alerts | Alerts must be actionable and prioritized, never a wall of notifications. |
| Vanity metrics | "Total bookings ever" with no decision attached is noise. |

## 8. UX acceptance principles (product-wide)

These apply to every module and screen. They are restated as concrete acceptance criteria in `06`, `08`, and `14`.

| Principle | Concrete meaning |
|---|---|
| No ambiguity | Every status has a single clear meaning, documented in `10`. |
| No hidden blockers | Blocked cases display the blocking reason inline. |
| No dead ends | Empty, loading, and error states each offer a next step. |
| No fake dashboards | Each metric links to the underlying list or action. |
| No generic SaaS | Visual language matches premium rental operations. |
| No table-only product | Every list view has a detail view where decisions happen. |
| No noisy alerts | Alerts are prioritized and actionable. |
| No risky silent actions | Critical actions require confirmation and capture context (reason, amount, etc.). |
| Auditability | Critical actions are expected to be traceable (surfaced in `M-14`). |
| Premium hierarchy | Strong visual hierarchy on every screen. |

## 9. Commercial differentiation themes

These themes guide emphasis across the product and the demo (`13`).

1. **Control every rental from booking to return** — full lifecycle visibility: `booking → payment → documents → ticket → handoff → active → return → close`.
2. **Protect your fleet and your money** — deposits, desk balances, damages, contracts, photos, audit, maintenance.
3. **Airport-ready operations** — terminal pickup, smart ticket, QR/code fallback, fast readiness before the customer arrives.
4. **Replace WhatsApp, Excel, and paper** — fewer mistakes, fewer lost documents, fewer payment surprises, fewer post-return disputes.
5. **Professional experience for premium customers** — premium ops produce a premium customer experience.

## 10. P2 forward-compatibility constraints (do not build, do not block)

P2 is out of scope, but P0/P1 must not be designed in a way that blocks it. The blueprint preserves these conceptually:

| Future P2 capability | What P0/P1 UX must preserve now |
|---|---|
| AI Copilot | Clean, consistent statuses and a visible event/action history. |
| Dynamic pricing intelligence | Pricing rules expressed as clear, inspectable rules (`M-11`). |
| Fraud / risk scoring | Customer history, documents, payments, incidents are centralized and linkable (`M-04`). |
| Telematics / GPS | Each vehicle is a controlled object with identity, status, and usage history (`M-03`). |
| Multi-branch | Locations exist as a configurable concept in Settings (`M-08`); the UI does not hard-assume a single branch. |
| Accounting integrations | Payments, deposits, refunds, fees, invoices are clean and traceable (`M-05`). |
| Predictive maintenance | Maintenance, incidents, and cost history accrue per vehicle (`M-09`). |

**Rule:** Do not build P2 now. But do not design P0/P1 as if the business will forever have one branch, one user, and no history.

## 11. Product risks this vision actively mitigates

| Risk | Mitigation baked into this blueprint |
|---|---|
| Building a dashboard instead of a control system | Command Center is blocker/action/money-first (`M-01`, `06`). |
| Duplicating the operator console | Explicit operator boundary on every module (`02`, `06`). |
| Too much P2 thinking | P2 is constraints-only (section 10; `14`). |
| Weak financial model | Payments/Deposits/Invoices is P0 and money is always explicit (`M-05`). |
| Weak handover model | Contracts & Digital Handover is P0 with a guided checklist (`M-06`). |
| Generic UI | Premium-quiet guardrails and anti-patterns (sections 6–7). |
| P1 before P0 maturity | Build order and gates require P0 completeness first (`14`). |
| Overloaded settings | Business-language, sectioned settings (`M-08`). |
| Unsafe configurability | Financial Policies (`21`), Configurable Access Control (`22`), and Configuration Governance (`23`) forbid arbitrary formulas/code and protect existing reservations from silent policy changes. |
| Reports without data quality | Reports are P1, after consistent operational data (`M-13`). |
