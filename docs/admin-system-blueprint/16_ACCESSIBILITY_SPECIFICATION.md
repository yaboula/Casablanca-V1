# 16 — Accessibility Specification (WCAG 2.2, build-ready)

**Type:** Functional accessibility specification (UX/frontend behavior, not code).
**Conformance target:** **WCAG 2.2 Level AA** for the whole Admin System, with named AAA criteria adopted where cheap and high-value (focus appearance, accessible auth enhanced).
**Scope:** All admin screens (`SCR-010`–`SCR-140` plus system screens `SCR-900`+), all components (`CMP-###`), all interactions (`INT-###`). Out of scope: visual design tokens, exact color values, and code.
**ID scheme:** Accessibility requirements use `A11Y-###`. WCAG success criteria are cited as `SC x.x.x`.

> This document closes the largest gap in v0. Treat every `A11Y-` requirement as a hard acceptance criterion. A screen is not "done" until it passes the per-pattern checklist in §10.

---

## 1. Why AA, and why this matters commercially

- The product is sold to **businesses**. Many buyers (corporate, public-sector, fleet, tourism) carry procurement accessibility requirements. In the EU, **EN 301 549** references WCAG, and the European Accessibility Act increases pressure on digital services.
- AA is the global default contractual bar. Hitting it removes a class of lost deals and legal risk (audit `CR1`).
- Accessibility overlaps heavily with operational reliability: keyboard operability and clear focus make airport-speed admin work faster for *everyone* (Fitts's/Doherty in `17`).

**Assumption (confirm):** sign-in is shared with the existing app shell; auth criteria here state the required stance, not a new login design.

---

## 2. WCAG 2.2 coverage map (what we commit to)

WCAG 2.2 added 9 criteria and **removed 4.1.1 Parsing**. The table lists every criterion that materially affects this admin product and where it is specified.

| SC | Title | Level | Adopted | Specified in |
|---|---|---|---|---|
| 1.3.1 | Info & Relationships | A | Yes | §4, §5 |
| 1.3.5 | Identify Input Purpose | AA | Yes | §6 |
| 1.4.3 | Contrast (Minimum) | AA | Yes | §3 |
| 1.4.10 | Reflow | AA | Yes | §8 |
| 1.4.11 | Non-text Contrast | AA | Yes | §3 |
| 1.4.12 | Text Spacing | AA | Yes | §3 |
| 1.4.13 | Content on Hover/Focus | AA | Yes | §7 |
| 2.1.1 | Keyboard | A | Yes | §4 |
| 2.1.2 | No Keyboard Trap | A | Yes | §4 |
| 2.1.4 | Character Key Shortcuts | A | Yes | §4 |
| 2.3.3 | Animation from Interactions | AAA | Yes (adopted) | §9 |
| 2.4.3 | Focus Order | A | Yes | §4 |
| 2.4.7 | Focus Visible | AA | Yes | §4 |
| **2.4.11** | **Focus Not Obscured (Min)** | AA | Yes | §4.4 |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | Target | §4.4 |
| 2.4.13 | Focus Appearance | AAA | Adopted | §4.3 |
| **2.5.7** | **Dragging Movements** | AA | Yes | §4.6 |
| **2.5.8** | **Target Size (Minimum)** | AA | Yes | §3.4 |
| 3.2.3 | Consistent Navigation | AA | Yes | §5 |
| 3.2.4 | Consistent Identification | AA | Yes | §5 |
| **3.2.6** | **Consistent Help** | A | Yes | §5.3 |
| 3.3.1 | Error Identification | A | Yes | `18 §3` |
| 3.3.2 | Labels or Instructions | A | Yes | §6 |
| 3.3.3 | Error Suggestion | AA | Yes | `18 §3` |
| 3.3.4 | Error Prevention (Legal/Financial) | AA | Yes | §6.4, `18 §5` |
| **3.3.7** | **Redundant Entry** | A | Yes | §6.3 |
| **3.3.8** | **Accessible Authentication (Min)** | AA | Yes | §6.5 |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | Target | §6.5 |
| 4.1.3 | Status Messages | AA | Yes | §7 |

(4.1.1 Parsing intentionally omitted — removed in WCAG 2.2.)

---

## 3. Perceivable: color, contrast, sizing, spacing

- **A11Y-001 (SC 1.4.3):** Body and UI text contrast ≥ **4.5:1**; large text (≥24px, or ≥18.66px bold) ≥ **3:1**. The "premium-quiet, high-contrast hierarchy" tone in `00` must be implemented as *measured* contrast, not visual impression.
- **A11Y-002 (SC 1.4.11):** Non-text UI (status pills, input borders, focus ring, icons that carry meaning, chart series boundaries) ≥ **3:1** against adjacent colors.
- **A11Y-003 (SC 1.4.1, reinforced):** **Status is never encoded by color alone.** Every `StatusPill` (`CMP-007`) carries a text label and/or shape/icon. "Money at risk," "blocked," "overdue" must be distinguishable in grayscale. This is a money-trust and color-blind requirement.
- **A11Y-004 (SC 1.4.12):** Layout must not break when users override text spacing (line-height 1.5×, paragraph 2×, letter 0.12em, word 0.16em). No clipping in tables, pills, or drawers.
- **A11Y-005 (SC 2.5.8 — Target Size):** All pointer targets ≥ **24×24 CSS px**, with ≥24px spacing where smaller. Applies to: row actions, icon buttons, pills used as buttons, filter chips, table sort handles, pagination, calendar cells. Primary actions should exceed this (≥40px tall) for airport-speed use (Fitts's, `17`).

## 4. Operable: keyboard, focus, pointer

### 4.1 Keyboard operability
- **A11Y-010 (SC 2.1.1):** Every action available by mouse is available by keyboard: navigation, search, filters, sorting, row actions, bulk selection, drawers, modals, money flows, overrides.
- **A11Y-011 (SC 2.1.2):** No keyboard traps. Modals/drawers trap focus *intentionally* while open and **return focus** to the triggering control on close.
- **A11Y-012 (SC 2.1.4):** Single-character shortcuts (if any, e.g. "/" for search) must be remappable or only active with a non-text-input focus, and documented in-product.

### 4.2 Focus order & management
- **A11Y-013 (SC 2.4.3):** Focus order follows reading/logical order. Opening a drawer/modal moves focus to its first meaningful control (or its heading). Closing returns focus to the trigger.
- **A11Y-014:** Async result regions (search results, filtered lists) do not steal focus; instead announce via live region (§7). After a destructive action, focus moves to a sensible anchor (e.g., the list, or the next row).

### 4.3 Focus appearance
- **A11Y-015 (SC 2.4.7 / 2.4.13 adopted):** Visible focus indicator on **every** focusable element, with ≥3:1 contrast against both the component and the background, and a thickness/area large enough to be obvious. Focus must never be removed (`outline:none` without replacement is prohibited).

### 4.4 Focus not obscured (sticky shell)
- **A11Y-016 (SC 2.4.11, AA):** The persistent app shell (top bar, sticky table headers, sticky drawer footers with primary actions) must **not fully hide** a focused element. Scroll-into-view must account for sticky offsets. Target 2.4.12 (Enhanced): keep the *entire* focused control visible where feasible. This directly mitigates audit `UX2`.

### 4.5 Hit/skip mechanics
- **A11Y-017:** Provide a "skip to main content" mechanism past the shell nav. Landmarks: `banner` (shell), `navigation`, `main`, `complementary` (contextual panels), `contentinfo` if a footer exists.

### 4.6 Dragging alternatives
- **A11Y-018 (SC 2.5.7):** Any reorder/drag interaction (e.g., reordering rental extras in Settings `M-08`, notification rules `M-12`, or pricing precedence `M-11`) must offer a **single-pointer / keyboard alternative** — "move up/move down" controls or a position field. Drag is an enhancement, never the only path.

## 5. Understandable: consistency, navigation, help

- **A11Y-020 (SC 3.2.3):** Navigation (shell `CMP-000`/`CMP-002`, breadcrumbs `CMP-003`, global search `CMP-001`) appears in the same place and order across all screens.
- **A11Y-021 (SC 3.2.4):** Components with the same function are labeled/iconed identically everywhere (one name for "Refund," one icon for "Edit," etc.). Pair with the microcopy catalog (`19`).
- **A11Y-022 (SC 3.2.6 — Consistent Help):** If a help affordance exists (help link, support contact, docs), it must appear in the **same relative position** on every screen that has it. Specify one fixed location (e.g., shell top-bar end) and do not move it per screen. This was entirely missing in v0.

## 6. Forms & authentication (a11y portions; full UX in `18`)

- **A11Y-030 (SC 3.3.2):** Every field has a persistent visible label (placeholder is never the label). Instructions/format hints are programmatically associated, not implied.
- **A11Y-031 (SC 1.3.1 / 4.1.2):** Inputs expose correct name/role/value/state to assistive tech; required, invalid, and disabled states are programmatically conveyed, not color-only.
- **A11Y-032 (SC 1.3.5):** Common inputs (name, email, phone, address on staff/customer forms) declare input purpose for autofill.
- **A11Y-033 (SC 3.3.7 — Redundant Entry):** In any multi-step create flow (e.g., add vehicle, configure location, set up pricing), information already entered earlier in the same process is **auto-populated or selectable**, not re-typed. Exceptions allowed only for security re-confirmation. New requirement vs v0.
- **A11Y-034 (SC 3.3.4 — Error Prevention, Financial):** For financial/legal actions (refund, charge, cancel-with-fee, override, role change), the action is **reversible, checked, or confirmed** — minimum: an explicit confirm step that restates amount/impact and requires a reason (already in `09`; here it becomes an accessibility requirement too).
- **A11Y-035 (SC 3.3.8 — Accessible Authentication):** Authentication must not require a cognitive function test (no puzzles, no memorize-and-transcribe) without an alternative. Allow **paste and password managers** in any password/OTP field. Target 3.3.9 (Enhanced) where possible.

## 7. Status messages, live regions, hover/focus content

- **A11Y-040 (SC 4.1.3):** Non-focus-stealing status changes are announced via polite live regions: save success/failure, validation summaries, filter result counts ("12 reservations"), background refresh completion, money action results. Errors/critical alerts use assertive announcement.
- **A11Y-041 (SC 1.4.13):** Tooltips/popovers shown on hover/focus are **dismissible** (Esc), **hoverable** (can move pointer onto them), and **persistent** (don't vanish prematurely). Critical info is never tooltip-only.
- **A11Y-042:** Toasts (`CMP-060`) are announced, are keyboard-reachable while present, and never auto-dismiss critical/error content faster than it can be read; provide a way to recall recent notifications (ties to audit `W15`).

## 8. Reflow & responsive a11y

- **A11Y-050 (SC 1.4.10):** Content reflows to a 320 CSS px equivalent width without loss of information or two-dimensional scrolling (except where 2D is essential, e.g., wide data tables — which then get a clearly labeled scroll region with keyboard scroll support).
- **A11Y-051:** Data tables that exceed width degrade gracefully (priority columns retained, secondary columns collapsible into a detail/row-expand). See responsive table rules in `18 §6` and `12`.

## 9. Motion & timing

- **A11Y-060 (SC 2.3.3 adopted):** Honor `prefers-reduced-motion`. Non-essential motion (slide-ins, parallax, animated counters) is reduced to instant/opacity-only. Essential motion (a brief state transition that conveys meaning) is kept minimal.
- **A11Y-061:** No content flashes more than 3×/second (SC 2.3.1). Avoid animated number tickers on money figures when reduced motion is set.
- **A11Y-062 (timing):** No time limits on admin tasks beyond session security. If a session warning appears, it is announced and gives a way to extend (SC 2.2.1).

## 10. Per-pattern accessibility acceptance checklists

Each pattern below is a reusable contract. A screen passes only if every used pattern passes.

### 10.1 Data list/table (`CMP-024`)
- [ ] Header cells associated with data cells; sortable columns expose sort state.
- [ ] Row actions reachable by keyboard; ≥24×24px (A11Y-005).
- [ ] Bulk-select announces selection count via live region.
- [ ] Sticky header does not obscure focused cell (A11Y-016).
- [ ] Horizontal scroll region is keyboard-scrollable and labeled.
- [ ] Empty/loading/error states are announced, not silent.

### 10.2 Drawer / modal (`CMP-044` FormDrawer; `CMP-042`/`CMP-043` dialogs)
- [ ] Focus moves in on open, returns to trigger on close.
- [ ] Esc closes (unless an unsaved-change guard intervenes; the guard is itself accessible).
- [ ] Focus trapped while open; background inert.
- [ ] Title is programmatically the dialog name.
- [ ] Primary action in sticky footer never hides the focused field (A11Y-016).

### 10.3 Money action (refund/charge/cancel-with-fee) (`INT-031/032`, `18 §5`)
- [ ] Amount/impact restated before confirm (A11Y-034).
- [ ] Reason field labeled and required state conveyed non-visually.
- [ ] Result announced (success/failure) via live region.
- [ ] No color-only encoding of "at risk"/"secured" (A11Y-003).
- [ ] Double-submit prevented and announced ("Processing…").

### 10.4 Filters/search (`CMP-001` GlobalSearch, `CMP-025` FilterBar)
- [ ] Result count announced after each filter change.
- [ ] Applied filters are visible, labeled, and individually removable by keyboard.
- [ ] Search overlay opens with focus inside; Esc closes and restores focus.

### 10.5 Status & alerts (`CMP-007` StatusPill, `CMP-014` AlertIndicator)
- [ ] Each status has text + non-color cue.
- [ ] New critical alerts announced assertively; non-critical politely.
- [ ] "As of" timestamp present for any auto-updating region (`18 §7`).

### 10.6 Governed configuration (`CMP-031/032/033/034/035/050`)
- [ ] Rule tables expose headers, row state, validation errors, and priority order to assistive tech.
- [ ] Rule precedence can be changed without drag-and-drop (`A11Y-018`).
- [ ] Simulator result changes are announced without stealing focus (`A11Y-040`).
- [ ] Version diff panels identify old value, new value, risk, effective date, reason, and approval state programmatically.
- [ ] Approval/rollback dialogs trap focus, return focus to the trigger, and restate consequences before commit (`A11Y-034`).
- [ ] Warnings are not color-only and are reachable by keyboard.

## 11. Testing & gate (feeds `14`)

- **A11Y-090:** Every screen passes the relevant §10 checklists before "done."
- **A11Y-091:** Keyboard-only walkthrough of each P0 critical flow (Command Center → reservation case → money action; staff role change; vehicle status change) with zero mouse.
- **A11Y-092:** Automated check (axe-class) = 0 critical violations, plus manual checks for focus order, announcements, and contrast (automation cannot catch these).
- **A11Y-093:** Reduced-motion and 320px-reflow spot checks on the heaviest screens (Command Center, reservation case, reports).

> Replaces the v0 "accessibility baseline" stub. `14` and `12` now reference this document as the source of truth (fixes audit C2/C3/C4).
