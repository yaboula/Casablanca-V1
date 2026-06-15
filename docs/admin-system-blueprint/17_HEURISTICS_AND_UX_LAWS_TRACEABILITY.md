# 17 — Heuristics & UX-Laws Traceability

**Type:** Benchmarking / traceability matrix (turns "good by taste" into "provably grounded").
**References (verified in `15 §1`):** Nielsen Norman Group's 10 Usability Heuristics; Laws of UX (Hick's, Fitts's, Jakob's, Miller's, Postel's, Doherty, Aesthetic-Usability, Gestalt).
**Purpose:** Give the build team and the client a defensible mapping from named principles to concrete, testable behaviors in this blueprint. Each row states the principle, the required behavior, where it lives, and how to verify.

> Use this document in design review. If a screen cannot point to the relevant rows here, it is not finished.

---

## 1. NN/g 10 Usability Heuristics — required behaviors

### H1 — Visibility of system status
- **Requirement:** The admin always knows the current state of work, money, and the system.
- **Behaviors:** Command Center surfaces what needs attention; every list shows result counts; every async region shows a loading state and an "as of" timestamp (`18 §7`); every action gives explicit success/failure feedback (`CMP-060` Toast / `CMP-061` InlineError); status changes announced to AT (`16 A11Y-040`).
- **Verify:** Trigger each money/state action — a visible + announced confirmation appears within the Doherty budget (L-Doherty). No silent successes/failures.

### H2 — Match between system and the real world
- **Requirement:** Language is rental-operations language, not database language.
- **Behaviors:** "Maria cancelled reservation R-1042 — reason: customer no-show" not raw logs (`06 M-14`); money shown as breakdown (`CMP-009`); states named in operational terms (`10`).
- **Verify:** No screen exposes internal codes/enums; audit log reads as sentences.

### H3 — User control & freedom
- **Requirement:** Clear exits and recovery; no dead ends.
- **Behaviors:** Cancel/close on every drawer/modal with focus return (`16 A11Y-013`); **undo where reversible**, confirm where not (table below); unsaved-change guard on drawers; "clear all filters" affordance.
- **Reversibility policy (new, fixes audit H3 gap):**

| Action | Reversible? | Pattern |
|---|---|---|
| Apply/clear filter, sort, column change | Yes | Instant, undoable by re-toggling |
| Edit vehicle/staff/setting draft | Yes (before save) | Discard guard |
| Status change (vehicle available↔maintenance) | Soft | Toast with **Undo** (time-boxed) |
| Cancel reservation | No (financial) | Confirm + reason; no silent undo |
| Refund / charge | No | Confirm restating amount; recorded in audit |
| Role/permission change | Soft | Confirm + reason; reversible by repeating |
| Override blocker | No | Confirm + mandatory reason; audited |

- **Verify:** Each row's pattern is implemented; reversible actions expose Undo, irreversible actions require confirm+reason.

### H4 — Consistency & standards
- **Requirement:** Same thing looks/behaves the same everywhere.
- **Behaviors:** Single `StatusPill` source (`CMP-007`); one name/icon per function (`16 A11Y-021`, `19`); consistent navigation/help placement (`16 A11Y-020/022`); the interaction patterns in `09` are the only sanctioned patterns.
- **Verify:** Cross-screen audit: refund/edit/export look identical wherever they appear.

### H5 — Error prevention
- **Requirement:** Prevent errors before they happen, especially on money.
- **Behaviors:** Disabled-vs-hidden rule (`11`); confirmation + amount restatement for financial actions (`18 §5`, `16 A11Y-034`); inline validation (reward-early/punish-late, `18 §3`); double-submit prevention; precondition checks shown as blockers, not post-hoc errors.
- **Verify:** Attempt invalid money action → blocked with reason *before* submit; cannot double-submit.

### H6 — Recognition rather than recall
- **Requirement:** Show options; don't make admins remember.
- **Behaviors:** Saved/visible applied filters; segments instead of remembered query syntax; global search with recents (`18 §8`); redundant-entry avoidance (`16 A11Y-033`); capabilities described in business language (`11`).
- **Verify:** No flow requires the user to remember a value from a previous screen and re-type it.

### H7 — Flexibility & efficiency of use
- **Requirement:** Fast paths for power users without harming novices.
- **Behaviors (new, fixes audit H7 gap):** keyboard shortcut to open global search; saved views per list (segment + filters + sort); bulk actions where the operation is safe; "open in drawer vs full page" choice for detail. Accelerators are additive — every action still has a discoverable UI path.
- **Verify:** Each P0 list supports at least one saved view and keyboard search open.

### H8 — Aesthetic & minimalist design
- **Requirement:** Premium-quiet; no vanity metrics, no decoration that competes with decisions.
- **Behaviors:** Reports = "metric + drillable list," not a wall of charts (`06 M-13`); one primary action per surface; whitespace and hierarchy over chrome (`01`).
- **Verify:** Every metric on a report drills to its source records; no metric is display-only.

### H9 — Help users recognize, diagnose, recover from errors
- **Requirement:** Errors are human, specific, and recoverable.
- **Behaviors:** Error taxonomy + recovery patterns (`18 §4`); messages say what happened, why, and the next step (`19`); errors programmatically linked to the offending field (`16 A11Y-031`, SC 3.3.1/3.3.3); never a bare "Something went wrong" without a recovery path.
- **Verify:** Each error class renders its specified message + recovery affordance.

### H10 — Help & documentation
- **Requirement:** Help is available, findable, consistent.
- **Behaviors:** Consistent Help placement (`16 A11Y-022`, SC 3.2.6); contextual empty-state guidance (`19`); first-run setup guidance (`18 §9`).
- **Verify:** Help affordance is in the same place on every screen that has it.

---

## 2. Laws of UX — required behaviors

| Law | Definition (verified) | Required behavior here | Where | Verify |
|---|---|---|---|---|
| **Hick's Law** | Decision time grows with number/complexity of choices. | Segment lists by state; one primary action per surface; progressive disclosure in settings; ≤ a handful of top-level nav items. | `01`, `03`, `06` | Count primary choices per surface; primary action is singular and obvious. |
| **Fitts's Law** | Time-to-target depends on size & distance. | Primary actions large (≥40px tall) and consistently placed; row actions ≥24×24px (`16 A11Y-005`); destructive actions not adjacent to common ones (spacing/placement to avoid mis-click). | `16 §3.4`, `12` | Measure target sizes; confirm destructive separation. |
| **Jakob's Law** | Users expect familiar patterns. | Conventional list/detail, breadcrumbs, top-bar search, standard table semantics; don't reinvent admin paradigms. | `03`, `09`, `12` | Patterns match mainstream enterprise admin conventions. |
| **Miller's Law** | ~7±2 items in working memory. | Group settings/regions into labeled sections; cap simultaneously visible competing alerts; chunk long forms into sections/steps. | `06 M-08`, `18 §2` | No screen forces tracking of many parallel unrelated items. |
| **Postel's Law** | Be liberal in what you accept. | Inputs normalize messy input (trim spaces, accept pasted phone/plate formats, flexible date entry) then format on blur; never reject merely-formatting differences. | `18 §3.4` | Paste varied formats → accepted & normalized. |
| **Doherty Threshold** | <400ms keeps interaction "instant." | Perceived-latency budget: optimistic UI/skeletons within ~100ms; any wait >400ms shows progress; money actions show "Processing…" immediately. | `18 §7`, `16 A11Y-042` | Instrument key actions; skeletons/progress appear within budget. |
| **Aesthetic-Usability Effect** | Attractive design feels more usable. | Premium-quiet visual tone is a feature, not vanity; consistency and polish build trust on money screens. | `01`, `19` | Visual review (out of build scope; intent recorded). |
| **Gestalt (proximity/common region/similarity)** | Grouping by layout conveys relationships. | Money breakdown grouped as one region; related filters grouped; status + entity visually bound; section cards for settings. | `12`, `18` | Related items are visually grouped, unrelated items separated. |

---

## 3. Screen-level traceability (high-value examples)

| Screen | Primary heuristics/laws engaged | Must demonstrate |
|---|---|---|
| Command Center (`SCR-010`) | H1, H8, Hick's, Miller's, Doherty | Attention-first, no vanity metrics, bounded alert count, fresh "as of" time, <400ms perceived response. |
| Reservation case (`SCR-021`) | H2, H3, H5, H9 | Case language, inline blockers (prevention), confirm+reason on money, recoverable errors. |
| Money action drawer (`INT-031/032`) | H1, H3, H5, H9, Fitts's, Doherty | Amount restated, reason required, double-submit blocked, result announced, large confirm target. |
| Staff & roles (`M-07`) | H4, H5, H6 | Capabilities in business language, confirm+reason on role change, no recall of permission codes. |
| Settings hub (`M-08`) | Hick's, Miller's, H6 | Sectioned/progressive, redundant-entry avoidance, recognition over recall. |
| Financial policies (`SCR-082`) | H2, H3, H5, H6, Hick's, Miller's | Business-language policy rules, no arbitrary formulas, preview/simulator before save, version/rollback, structured choices over recall. |
| Configurable access control (`SCR-072`) | H4, H5, H6, H9 | Templates/custom roles in business language, sensitive capability warnings, diff preview, self-escalation/last-owner prevention. |
| Reports (`M-13`) | H8, H2 | Every metric drills to source; operational language. |

---

## 4. How to use this in review (gate hook)

1. For the screen under review, list the patterns it uses.
2. Pull the matching rows from §1/§2 and the example in §3.
3. Confirm each "Verify" passes. Unverifiable = not done.
4. Record exceptions explicitly (e.g., an AAA item deferred) — never silently.

This document, together with `16` (accessibility) and `18` (forms/validation/error), converts the build-readiness gate in `14` from subjective to checkable.
