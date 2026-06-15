# 20 — Financial Rules: Money, Deposit, Refund & Risk (Focused Review)

**Type:** Focused functional review + rule specification for the money domain.
**Scope:** The exact, build-ready rules behind every money figure and money action the Admin sees — at the **UX/functional** level. No payment-provider, ledger-storage, accounting-engine, or API decisions (those are out of scope, `00 §2`).
**Authority:** This is the source of truth for fixed money semantics: components, lifecycle states, secured/at-risk, release gate, cancellation/no-show/refund/deposit/damage math. `21` is the source of truth for how business policy parameters are safely configured in Admin. `18 §5` remains the source of truth for how money actions behave in the UI (validation, double-submit, confirm pattern). `M-05` owns the money-control screens. `SCR-082` / `21` owns financial policy configuration. `09 INT-030..033` and `INT-071` own the interactions. `11` owns who can do them.
**ID scheme:** Financial rules use `FIN-###`. Money lifecycle states use `MS-##`.

> **Why this document exists.** The v0 audit (`15`) flagged that "secured vs at-risk" was a vibe, not a rule, and that refund/charge/deposit edges were under-specified. This review defines them precisely **and** separates *product framework* (fixed here) from *business policy parameters* (configured safely in `21`). Where a number or window is a business choice, it is shown as a named parameter, never invented or hardcoded.

---

## 1. The money model: components of a reservation's financial picture

Every reservation case carries these **separate, never-collapsed** money components (extends `06 M-05` "Required sections"). The product must never reduce these to "paid/unpaid."

| Component | Meaning | Sign | Shown via |
|---|---|---|---|
| **Rental price** | Agreed price for the rental itself (base + duration + booked extras + taxes/fees). | + due | `CMP-009` MoneyBreakdown |
| **Prepayment / online payment** | What the customer already paid (at booking or later, online). | − paid | `CMP-009` |
| **Security deposit / authorization** | Held or captured security amount, **distinct from the rental payment**. Covers damage/fees. | held / captured | `CMP-009` (deposit row) |
| **Desk balance** | Amount still to be collected **before release** (remaining rental + desk-chosen extras + local fees). | + due | `CMP-009` (balance row) |
| **Extras** | Add-ons (GPS, child seat, extra driver, insurance upgrade). Booked online or added at desk. | + due | line items |
| **Post-return charges** | Damage, fuel shortfall, mileage overage, late return, fines/tolls — assessed after return. | + due | charges section |
| **Refunds** | Money returned (cancellation, correction, deposit release, goodwill). | − returned | refunds section |
| **Invoice / receipt** | Document presence for the above. | n/a | `SCR-052` |

- **FIN-001:** Rental payment and security deposit are **always tracked and displayed separately**. A captured deposit is never shown as "payment," and a rental payment never reduces the required deposit.
- **FIN-002:** Every money component links to the reservation and customer; every money figure renders with currency via `CMP-009` (`18 FV-020`); none appears as a bare number.

## 2. Money lifecycle states (per reservation)

These are the canonical financial states. They are **derived** from the components above, not entered by hand.

| ID | State | Definition |
|---|---|---|
| MS-01 | `awaiting-payment` | Required prepayment per policy not yet received. |
| MS-02 | `deposit-pending` | Required deposit not yet authorized/held. |
| MS-03 | `secured` | Authorized + captured funds cover the **expected amount due up to this lifecycle stage** (see §3). |
| MS-04 | `balance-due` | A desk balance remains to be collected before release. |
| MS-05 | `at-risk` | Expected due **exceeds** secured funds; the gap is the at-risk amount (see §3). |
| MS-06 | `refund-owed` | A refund is due to the customer and not yet issued. |
| MS-07 | `charge-pending` | A post-return charge is assessed but not yet captured. |
| MS-08 | `settled` | All expected amounts collected, deposit resolved (released/captured), no refund owed. |

`StatusPill` (`CMP-007`) renders these with text + non-color cue (`16 A11Y-003`). They are not mutually exclusive in display (e.g., a case can be `balance-due` and `secured` for what's been collected so far); the UI shows the governing one plus the gap.

## 3. Secured vs at-risk — the exact rule (FIN-010)

This is the definition the audit demanded. It is **stage-aware**: the "expected amount due" depends on where the reservation is in its lifecycle.

> **Secured** ⇔ `funds_authorized_or_captured ≥ expected_due_at_stage`
> **At-risk** ⇔ `expected_due_at_stage > funds_authorized_or_captured`
> **At-risk amount** = `expected_due_at_stage − funds_authorized_or_captured` (never negative; clamp at 0)

Where `expected_due_at_stage` is:

| Lifecycle stage | `expected_due_at_stage` = |
|---|---|
| **Before pickup** | required prepayment (per rate/policy) + required deposit authorization |
| **At pickup (release gate)** | full rental due + chosen extras + required deposit held |
| **During rental** | full rental + extras + deposit held |
| **After return** | final total (rental + extras + post-return charges) − refunds already owed/issued |

- **FIN-011:** "Funds" counts only **authorized or captured** money the business can actually rely on. Operator-**recorded** desk collection that is not yet reconciled is shown as *pending* and does **not** by itself flip a case to `secured` (resolves the v0 tension where operators "record" collection but Admin/Finance "controls" it — `06 M-05` operator boundary). Reconciliation (`INT-030`) is what confirms pending → secured.
- **FIN-012:** The UI always shows the **gap amount** and **what would close it** for any at-risk case (e.g., "€180 balance due" / "deposit not authorized"). No silent at-risk.
- **FIN-013:** Overpayment (`funds > expected`) surfaces as `refund-owed` (MS-06), not as extra "secured" headroom.

## 4. Release gate — the financial conditions (FIN-020)

A reservation may pass the **financial** portion of the release/readiness gate (`CMP-011` ReadinessChecklist) only when **all** hold:

1. **Payment:** desk balance ≤ 0, or within an allowed rounding tolerance `P-TOL` (§11).
2. **Deposit:** required deposit is **authorized/held** for at least the required amount `P-DEP` (§11).
3. **No unresolved financial blocker** (failed auth, disputed charge, expired authorization).

- **FIN-021:** If any condition fails, the case shows a **financial blocker** (`CMP-008` BlockerCallout) stating the unmet condition and the resolving action — it is a *prevention*, not a post-hoc error (`17 H5`, `18 ERR-03`).
- **FIN-022:** Release despite a failed financial condition requires **override** (`PERM-006`, `INT-023`) with mandatory reason; the case is then flagged **`at-risk`** (MS-05) and the override is audited (`M-14`). This is the only path to releasing with money outstanding.
- **FIN-023:** The Admin **governs and supervises** this gate; the operator console executes the physical handoff. Admin does not perform the desk release (`02 §8`, `06 M-05/M-06` boundary).

## 5. Cancellation (FIN-030)

- **FIN-031 — Fee model (policy-driven):** Cancellation fee is determined by the cancellation policy window `P-CXL` (§11): typically free before a cutoff, a percentage fee within a window, and up to full charge after a no-cancel cutoff. The exact thresholds/percentages are business parameters, **not** invented here.
- **FIN-032 — Refund on cancel:** `refund = amount_paid − applicable_fee` (clamp ≥ 0). If the rate is **non-refundable**, `applicable_fee = amount_paid` and refund = 0 — the confirm dialog states this explicitly.
- **FIN-033 — Deposit on cancel:** Any held deposit authorization is **released in full** on cancellation (no capture), unless a fee is policy-defined to be captured from it.
- **FIN-034 — Flow:** Cancellation (`INT-020`) restates the fee, resulting refund, and deposit release **before** commit (`18 FV-022`), requires a reason, chains to refund (`INT-031`) when a refund results, and writes to audit.
- **FIN-035 — State guard:** Only states allowed by `11` (not `active`/`completed`/`cancelled`) can be cancelled; otherwise the action is disabled with explanation (`18 ERR-02/03`).

## 6. No-show (FIN-040)

- **FIN-041:** A no-show is a **cancellation variant** triggered when the customer does not arrive within the pickup window `P-NOSHOW-WINDOW` (§11). It uses a dedicated **no-show reason** (consistent with `09 INT-020` edge case).
- **FIN-042 — Fee:** No-show fee follows policy `P-NOSHOW-FEE` (§11) — commonly stricter than standard cancellation (e.g., first rental period or a fixed no-show fee). Business parameter, not invented.
- **FIN-043:** Held deposit authorization is released (no capture) unless policy captures the no-show fee from it. The action restates the charge, requires a reason, and is audited.
- **FIN-044:** A no-show case must remain distinguishable in history and reports from a normal cancellation (feeds risk flags `M-04`, audit `M-14`, reports `M-13`).

## 7. Refunds — total & partial (FIN-050)

Refund behavior is owned jointly with `18 §5`; the **rules** are:

- **FIN-051 — Maximum refundable:** `max_refundable = amount_captured − amount_already_refunded`. The UI shows original, already-refunded, **max**, and the live remaining balance as the admin types (`18 FV-023`).
- **FIN-052 — Over-max is blocked at input** with the max stated (`18 ERR-01`); never allow a refund beyond captured funds.
- **FIN-053 — Partial refunds accumulate** correctly; multiple partials can sum up to (never beyond) the max (`09 INT-031` edge case).
- **FIN-054 — Reason required**, captured to audit (`PERM-032`, `M-14`).
- **FIN-055 — Irreversible:** there is **no "undo refund"**; recovery is a new, opposite, audited charge (`17 §1` reversibility; `18 FV-026`).
- **FIN-056 — Deposit release ≠ rental refund:** releasing/returning a held deposit is a **distinct operation** (§8), tracked separately from refunding a rental payment, even though both return money to the customer.
- **FIN-057 — Method/timing** of the actual money movement is a backend/provider concern (out of scope); the UI states the intent and result, and shows `charge-pending`/`refund-owed` states until resolved.

## 8. Security deposit / authorization lifecycle (FIN-060)

> **Finding (gap from v0):** v0 specified refund (`INT-031`) and charge (`INT-032`) but **no explicit deposit capture/release action**. Deposits were tracked as a component but had no governing interaction. This review closes that gap by defining the lifecycle and adding `INT-033` (see `09`).

| Phase | Rule |
|---|---|
| **Authorize/hold** | At booking or pickup, hold the required deposit `P-DEP` (§11). Until held, case is `deposit-pending` (MS-02) and fails the release gate (FIN-020.2). |
| **Hold during rental** | Authorization remains; if it would expire before return, the UI surfaces a **re-authorization** prompt (edge case). |
| **Resolve at return** | Either **release** in full (no damage/fees) or **capture** part/all toward assessed charges (§9), then release the remainder. |

- **FIN-061 — Capture limit:** Capture from a deposit cannot exceed the held amount; charges exceeding the deposit become a **separate post-return charge** (FIN-070).
- **FIN-062 — Capability mapping (reuse existing capabilities, no new PERM):** capturing from a deposit is a charge → gated by **`PERM-033`** (Record charge/adjustment); releasing/returning a deposit is a return of funds → gated by **`PERM-032`** (Refund payment). Both restate amount + reason and are audited.
- **FIN-063:** Deposit capture/release (`INT-033`) restates: held amount, amount to capture, amount to release, linked evidence (for capture), reason. Result updates `CMP-009` and writes audit.

## 9. Damage charge (FIN-070)

- **FIN-071 — Source:** A damage charge originates from handover evidence (`M-06`, `SCR-061`) comparing out vs in. It **must link the evidence** that justifies it (`09 INT-032`).
- **FIN-072 — Funding order:** A damage charge is satisfied **first from the held deposit** (capture, FIN-060) up to the deposit amount; any **excess** becomes a separate charge against the customer (FIN-070 continues as a standalone charge).
- **FIN-073 — Pre-existing vs new:** Only **new** damage (not pre-existing, per `M-06` out/in comparison) is chargeable; the UI requires the assessor to confirm this distinction before charging.
- **FIN-074:** Positive amount only; reason required; gated by `PERM-033`; audited; surfaces as `charge-pending` (MS-07) until resolved.

## 10. Extras & fines (FIN-080)

- **FIN-081 — Pre-release extras:** Extras chosen at the desk (before release) **increase the desk balance** (FIN-020.1) and must be cleared or accepted before/at release.
- **FIN-082 — Post-return extras/fines:** Fuel shortfall, mileage overage, late return, tolls/fines assessed after return become **post-return charges** (FIN-070 mechanics): typed, positive, reasoned, evidence-linked where applicable, gated by `PERM-033`.
- **FIN-083 — Typing:** Every charge declares a type (`damage` / `extra` / `fine` / `fuel` / `mileage` / `late`) so reports (`M-13`) and invoices (`SCR-052`) can categorize it. (Type list is extensible; adding types is config, not code.)

## 11. Business policy parameters - configurable in Admin (do not invent)

These govern the rules above and are **business policy**, not product structure. The build treats them as configurable in Financial Policies (`SCR-082`, `21`) using presets, structured rule tables, bounded numeric fields, simulator, approval, audit, versioning, effective dates, rollback, and existing-reservation protection. Until configured, they are explicit assumptions, not facts.

| Param | Governs | Configured through |
|---|---|---|
| `P-PREPAY` | Required prepayment at booking (full / % / deposit-only). | `21` Booking payment rules. |
| `P-DEP` | Required security deposit (fixed / % / per vehicle class). | `21` Deposit rules. |
| `P-CXL` | Cancellation windows & fees. | `21` Cancellation rules. |
| `P-NOSHOW-WINDOW` | Time after scheduled pickup that defines no-show. | `21` No-show rules. |
| `P-NOSHOW-FEE` | No-show penalty. | `21` No-show rules. |
| `P-TOL` | Allowed desk-balance rounding tolerance for release. | `21` Release gate rules. |
| `P-DAMAGE-FROM-DEPOSIT` | Whether damage captures from deposit first (assumed yes, FIN-072). | `21` Damage and charge rules. |
| `P-DEP-CAPTURE-ON-CXL` | Whether cancellation/no-show fees capture from deposit. | `21` Cancellation/no-show rules. |
| `P-TAX` | Tax/fee composition shown in breakdown. | `21` Currency and tax rules. |
| `P-CURRENCY` | Currency (assumed **EUR**, `18 LOC-03`). | `21` Currency model. |

## 12. Review findings & contradictions resolved

| ID | Finding | Resolution |
|---|---|---|
| RF-1 | "Secured vs at-risk" was undefined (audit). | Defined as stage-aware rule **FIN-010**; `18 FV-021` now points here. |
| RF-2 | No explicit deposit capture/release action in v0. | Added lifecycle (FIN-060) + interaction `INT-033` in `09`; mapped to existing `PERM-032/033` (FIN-062). |
| RF-3 | Operator "records" desk collection vs Admin "controls" money — ambiguity about what counts as secured. | **FIN-011:** only authorized/captured (reconciled) funds count as secured; recorded-but-unreconciled shows as pending. |
| RF-4 | Damage charge vs deposit relationship unspecified. | **FIN-072:** deposit-first, excess as separate charge. |
| RF-5 | Refund reversibility unclear. | **FIN-055:** irreversible; recovery is a new opposite charge. |
| RF-6 | Policy numbers risked being invented in specs. | **§11 + `21`:** all monetary policy externalized as named parameters configured safely in Admin, with preview/simulation, approval, audit, versioning, and no arbitrary formulas. |

## 13. Acceptance criteria (testable)

- [ ] Rental payment and security deposit are always displayed as separate components; neither offsets the other (FIN-001).
- [ ] Every case's secured/at-risk status follows FIN-010 with a visible gap amount and the action that closes it (FIN-012).
- [ ] Pending (unreconciled) desk collection never flips a case to `secured` (FIN-011).
- [ ] The financial release gate enforces payment + deposit + no-blocker; override is the only bypass and flags `at-risk` + audits (FIN-020/022).
- [ ] Cancellation restates fee + resulting refund + deposit release before commit; non-refundable rates show €0 refund explicitly (FIN-031/032).
- [ ] No-show is a distinct, reasoned variant with its own fee and stays distinguishable in history/reports (FIN-041/044).
- [ ] Refunds never exceed `amount_captured − already_refunded`; over-max blocked at input; partials accumulate; irreversible (FIN-051/052/053/055).
- [ ] Deposit capture/release exists as an action (`INT-033`), capped at held amount, evidence-linked for capture, reasoned, audited (FIN-060/063).
- [ ] Damage charges link evidence, draw from deposit first, and route excess to a separate charge (FIN-071/072).
- [ ] Every charge is typed for reporting/invoicing (FIN-083).
- [ ] All monetary policy values resolve to named parameters in Financial Policies (`21`), not hardcoded copy or developer-only decisions (§11).
