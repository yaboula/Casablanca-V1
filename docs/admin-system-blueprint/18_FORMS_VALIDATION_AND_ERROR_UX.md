# 18 — Forms, Validation, Money & Error UX Standard

**Type:** Cross-cutting interaction standard (frontend behavior, not code/backend).
**References (verified in `15 §1`):** Baymard inline-validation findings ("reward early, punish late"; avoid premature validation; remove error on correction; positive inline validation; link errors to fields). Smashing Magazine live-validation guide. WCAG 2.2 (`16`).
**Applies to:** every form, drawer, and money action in the Admin System. Where `06`/`08`/`09` say "validated" or "reason required," **this document defines exactly how.**
**ID scheme:** `FV-###` for form/validation rules, `ERR-##` for error classes.

> This standard fixes audit weaknesses W3, W4, W5, W6, W7, W10. It is the single source of truth for validation timing, money rules, error handling, microcopy hooks, and data freshness.

---

## 1. Principles

1. **One standard, everywhere.** Every drawer/form behaves identically. No team invents its own validation.
2. **Reward early, punish late.** Don't flag an in-progress field; do clear an error the instant it becomes valid.
3. **Prevent over correct.** Block impossible actions (disabled + reason) instead of letting them fail.
4. **Money is sacred.** Financial actions get the strictest treatment: restate, confirm, prevent double-submit, audit.
5. **Errors are recoverable and human.** Every error states what happened, why, and the next step.

---

## 2. Form structure & field rules

- **FV-001 — Labels:** Every field has a persistent visible label above or beside the input. Placeholders are hints only, never labels (`16 A11Y-030`).
- **FV-002 — Optional, not required, is marked.** Mark **optional** fields with "(optional)"; do not decorate required fields with asterisks as the primary signal (reduces noise; required is the default expectation on admin forms). Required state is still programmatically exposed (`16 A11Y-031`).
- **FV-003 — Grouping & chunking:** Long forms are split into labeled sections (Miller's Law). Multi-entity setup (add vehicle, configure location, pricing) uses steps with a visible task list and the ability to move between steps.
- **FV-004 — Draft & discard:** Drawers/forms with meaningful input warn on close/navigation if there are unsaved changes ("Discard changes?" with Keep editing / Discard). Where a save-as-draft concept exists for setup flows, drafts persist the entered values.
- **FV-005 — Redundant entry (WCAG 3.3.7):** Within a multi-step flow, values entered earlier are pre-filled or selectable, never re-typed (except deliberate security re-confirmation).
- **FV-006 — Autosave vs explicit save:** Settings sections use **explicit Save** with a clear dirty state and a "Saved" confirmation (avoids silent partial changes to operational config). Filters/sorts apply instantly (no save).

## 3. Validation timing & feedback (Baymard model)

- **FV-010 — When validation fires (the core rule):**
  - **While typing (pristine field):** no error. Never punish mid-typing.
  - **On blur (field complete, has content, invalid):** show the error ("punish late").
  - **Field already in error + user editing:** re-validate on each keystroke and **remove the error the instant it becomes valid** ("reward early").
  - **On submit:** validate all; move focus to and scroll to the first invalid field; render a summary if multiple.
- **FV-011 — Positive inline validation:** For high-value/format-sensitive fields (email, phone, plate, IBAN-like refs, amounts), show a subtle success confirmation when valid (non-color-only, e.g., a check + text). Builds confidence on money/setup screens.
- **FV-012 — Error placement & linkage:** Error text appears **immediately below the field**, programmatically linked to it (`16 A11Y-031`), with the field border and label sharing an error treatment that is not color-only.
- **FV-013 — No layout thrash:** Reserve space for one line of error text (or animate within reduced-motion rules) so the form doesn't jump.
- **FV-014 — Postel's Law normalization:** Accept messy input and normalize on blur — trim whitespace; accept pasted phone/plate/amount formats; flexible date entry; never reject purely-formatting differences. Show the normalized value.
- **FV-015 — Submit lifecycle:** On submit the primary button enters a busy state ("Saving…"/"Processing…"), is disabled against re-click, and the result is announced (`16 A11Y-040`). Re-enable on failure with the error preserved and fields intact.

## 4. Error taxonomy & recovery (fixes audit W6)

Every error in the product is one of these classes. Each has a fixed surface and recovery pattern. Microcopy templates live in `19`.

| ID | Class | Surface | Recovery pattern |
|---|---|---|---|
| ERR-01 | **Validation** (bad/missing input) | Inline under field (§3) | Fix field; error clears on valid (reward early). |
| ERR-02 | **Permission** (not allowed) | Disabled control + tooltip/inline reason; or blocked panel | Explain who can do it / how to request; never a dead silent disable (`11`). |
| ERR-03 | **Precondition/blocker** (state not ready) | Inline blocker in context (e.g., reservation case) | Show the unmet condition + the action that resolves it. |
| ERR-04 | **Conflict** (stale/edited elsewhere) | Inline banner on save | Show what changed; offer reload/compare; never silently overwrite. |
| ERR-05 | **Not found / gone** | Empty-state on the surface | Explain + route back to the list; don't show a broken shell. |
| ERR-06 | **System/unexpected** | Toast + inline region | Plain explanation + Retry; preserve user input; log reference for support. |
| ERR-07 | **Network/offline** | Non-blocking banner | "Reconnecting…"; queue read-only; block writes with clear messaging; auto-recover. |

- **ERR rule 1:** Never show a bare "Something went wrong." Always class + next step.
- **ERR rule 2:** On any failed write, **input is never lost.**
- **ERR rule 3:** Critical/money errors are announced assertively (`16 A11Y-040`) and never auto-dismiss before being readable.

## 5. Money & financial action standard (fixes audit W4)

Applies to refund, charge, cancel-with-fee, deposit capture/release, manual adjustment, and any override with financial impact (`INT-031/032/033`, `06 M-05`). **The financial *semantics* (secured/at-risk, release gate, cancellation/no-show/refund/deposit/damage math) live in `20`; the safe configuration system for policy parameters lives in `21`; this section governs how money actions *behave in the UI*.**

- **FV-020 — Currency formatting:** All amounts use a single locale-aware money format (`19 §3`): currency symbol/code, grouping separators, two decimals, explicit sign for credits/debits. Never raw numbers. Money is never shown as plain "paid/unpaid" (preserve v0 strength).
- **FV-021 — "Secured vs at-risk" is a defined rule, not a vibe:** The authoritative, stage-aware definition is **`20 FIN-010`**. In short: **Secured** when authorized/captured funds cover the expected amount due *at the current lifecycle stage*; **At-risk** when expected due exceeds secured funds, with the gap shown. Only reconciled/authorized funds count (`20 FIN-011`). The UI labels this with text + non-color cue (`16 A11Y-003`) and always shows the gap amount and what closes it.
- **FV-022 — Restate before commit (WCAG 3.3.4):** Every money action opens a confirm step that restates: action, exact amount, affected reservation/customer, resulting balance, and reason field (required, free text + optional reason category). The confirm button repeats the amount ("Refund €240.00").
- **FV-023 — Partial-refund math:** For partial refunds/charges, show: original amount, already-refunded, **maximum allowable**, and the live remaining balance as the admin types. Block amounts above the allowable max at input (ERR-01) with the max stated.
- **FV-024 — Double-submit / idempotency at UX level:** The confirm button disables on first click and shows "Processing…"; the drawer cannot be re-triggered until a result returns. If the result is unknown (timeout), show a "we're checking the status of this payment — do not retry" state rather than inviting a second attempt.
- **FV-025 — Result feedback:** Success restates what happened and the new balance, updates the money breakdown in place (`CMP-009`), writes to the audit log with the captured reason (`06 M-14`), and announces the result. Failure preserves the entered amount/reason and surfaces an ERR class with Retry.
- **FV-026 — Reversibility:** Money actions are irreversible by design (see `17 §1 H3` table). There is no "undo refund"; the recovery is a new, opposite, audited action.

## 6. Data-table & list form behavior (fixes audit W9/W13)

- **FV-030 — Column priority & responsive degradation:** Each list declares priority columns (always visible) and secondary columns that collapse into a row-expand/detail at narrow widths. Horizontal scroll is a labeled, keyboard-scrollable region, never silent overflow (`16 A11Y-050/051`).
- **FV-031 — Density:** Two densities (comfortable default, compact for power users). Compact must still meet 24×24px targets (`16 A11Y-005`).
- **FV-032 — Sticky headers:** Sticky table headers must not obscure a focused cell (`16 A11Y-016`).
- **FV-033 — Bulk selection:** Selecting rows shows a persistent action bar with the count ("3 selected") and only **safe** bulk actions; destructive bulk actions require the §5/confirm pattern and list affected items.
- **FV-034 — Pagination vs load-more:** Use pagination with a visible total where counts matter operationally (reservations, money); virtualization is an implementation detail left to build, but keyboard navigation and announcements must hold.
- **FV-035 — Empty / loading / error per list:** Each list specifies its three non-happy states with copy from `19`; states are announced (`16 A11Y-040`). Loading uses skeletons within the Doherty budget (§7).

## 7. Perceived performance & data freshness (fixes audit W10/W11)

- **FV-040 — Doherty budget:** Interactions target <400ms perceived response. Optimistic/skeleton feedback appears within ~100ms; any operation exceeding ~400ms shows explicit progress.
- **FV-041 — Freshness model (UX-level, transport-agnostic):** Any region that can change underneath the admin (Command Center, reservation case money/state, fleet status) shows an **"as of HH:MM"** timestamp and a manual **Refresh** affordance. When the system knows data is stale, it shows a non-blocking "New updates available — Refresh" prompt rather than silently swapping data under the user's cursor. This avoids both staleness and disruptive auto-changes. (No assumption about polling/sockets — that is a backend decision out of scope.)
- **FV-042 — Stale-write protection:** If the admin acts on data that changed since load, surface ERR-04 (conflict) instead of overwriting.

## 8. Search & filter behavior (fixes audit W14, H6/H7)

- **FV-050 — Global search:** Opens via the top-bar control and a keyboard shortcut (announced in-product, remappable per `16 A11Y-012`). Shows recent searches when empty; results are permission-filtered (`11`); selecting routes to the entity. Esc closes and restores focus.
- **FV-051 — List filters:** Apply instantly; applied filters render as individually-removable chips with labels; "Clear all" present; result count announced (`16 A11Y-040`).
- **FV-052 — Saved views:** Each P0 list supports saving a segment+filters+sort combination as a named view (H7). Views are recognition-not-recall aids; no syntax to remember.

## 9. First-run / activation (fixes audit W12)

- **FV-060 — First-run setup path:** On first sign-in to an empty system, the admin sees a short, ordered setup guide (e.g., add first vehicle → set business/pricing basics → invite staff). Each step deep-links to the relevant create flow and marks completion. This is the activation path that converts a sale into a working deployment; it is guidance, not a wizard that blocks normal navigation.
- **FV-061 — Empty states as onboarding:** Until data exists, list empty states carry the "do this next" guidance and the primary create action (copy from `19`).

## 10. Acceptance criteria (testable; tightens audit W7)

- [ ] No field shows an error while pristine/typing; errors appear on blur; errors clear the instant input becomes valid (FV-010).
- [ ] Positive validation shows on valid high-value fields, non-color-only (FV-011).
- [ ] Every error maps to an ERR class with the specified surface + recovery (§4); no bare generic errors.
- [ ] Failed writes never lose user input (ERR rule 2).
- [ ] Every money action restates amount + impact + reason before commit, repeats amount on the button, blocks double-submit, and announces the result (§5).
- [ ] Partial refunds show original/already-refunded/max/remaining and block over-max at input (FV-023).
- [ ] "Secured vs at-risk" follows the FV-021 rule with text + non-color cue and a stated gap amount.
- [ ] Lists declare priority/secondary columns, two densities, and announced empty/loading/error states (§6).
- [ ] Changeable regions show "as of" time + Refresh; stale writes raise conflict, not overwrite (§7).
- [ ] Global search has a keyboard open + recents; each P0 list supports at least one saved view (§8).
- [ ] First-run setup guidance exists and deep-links to create flows (§9).
