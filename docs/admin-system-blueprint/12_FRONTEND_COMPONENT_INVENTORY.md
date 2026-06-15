# 12 — Frontend Component Inventory

**Scope:** Reusable UX components and patterns the Admin frontend needs. This is a **functional** inventory (behavior, props-as-intent, states) — not code, not a visual design spec.
**Read after:** `11_PERMISSION_UX_MATRIX.md`. Components realize the screens (`08`), interactions (`09`), and states (`10`).

---

## 1. How to use this inventory

- Each component has a stable ID (`CMP-###`), purpose, where it is used, the variants/states it must support, and notes.
- "Props (intent)" describe the information a component needs, not a code signature.
- Build these as a shared kit first; screens compose them. This maximizes consistency and the premium-quiet tone (`01 §6`).
- Components must support the canonical states from `10` (loading/empty/error/permission) where applicable.

## 2. Layout & shell components

| ID | Component | Purpose | Used on | Variants / states | Notes |
|---|---|---|---|---|---|
| CMP-000 | AppShell | Top bar + primary nav + content region | All | wide / collapsed / drawer (narrow) | Hosts CMP-001/014, account menu, breadcrumbs |
| CMP-001 | GlobalSearch | Cross-entity search overlay | All | idle / typing / results / empty / error | Keyboard-openable; permission-filtered results |
| CMP-002 | PrimaryNav | Business-task grouped navigation | All | full / icon-only / drawer; item active/gated/disabled | P1 items gated per `11` |
| CMP-003 | Breadcrumbs | Orientation in detail screens | Detail screens | default | list → detail → sub-tab |
| CMP-004 | PageHeader | Title + context + primary/secondary actions | All screens | with/without filters; with status | Enforces one primary action |
| CMP-005 | SectionPanel | A titled content region with its own state | Detail screens | loaded / loading / empty / error | Enables `ST-005` partial errors |
| CMP-006 | QuickCreateMenu | Permission-gated create entries | Shell | open/closed; gated entries | Reservation/vehicle/staff/incident |

## 3. Status, money & risk primitives (the trust layer)

| ID | Component | Purpose | Used on | Variants / states | Notes |
|---|---|---|---|---|---|
| CMP-007 | StatusPill | Canonical status display | Reservations, fleet, payments, handover | per-status color/label; neutral/positive/warning/critical | Single source of status vocabulary; never invent ad-hoc labels |
| CMP-008 | BlockerCallout | Shows blocking reason(s) + clear action | SCR-010, SCR-021, SCR-031 | single/multi reason; resolvable/override | Implements `ST-007`; never hides the reason |
| CMP-009 | MoneyBreakdown | Explicit money components | SCR-021, SCR-050/051, SCR-041 | full / gated-summary; secured / at-risk | Paid · deposit · balance · charges · refund; always shows currency; gated per PERM-030 |
| CMP-010 | RiskFlag | Customer/vehicle risk indicator | SCR-040/041, SCR-021 | none / flagged (+reason on hover) | Gated edit per PERM-022 |
| CMP-011 | ReadinessChecklist | Release-readiness steps | SCR-021, SCR-061 | each step pending/done/blocked | Reflects operator execution; does not perform it |
| CMP-012 | MetricStat | A number that links to its source | SCR-010, SCR-130 | normal / low-data / loading | Forbidden to render without a destination link |
| CMP-013 | Timeline | Chronological case/vehicle/customer history | SCR-021/031/041 | all / critical-only | Feeds and links to audit (`M-14`) |
| CMP-014 | AlertIndicator + AlertList | Prioritized actionable alerts | Shell, SCR-010 | severity levels; acknowledge/snooze | Critical alerts may be non-dismissible |

## 4. Data display components

| ID | Component | Purpose | Used on | Variants / states | Notes |
|---|---|---|---|---|---|
| CMP-020 | CaseRow / CaseCard | Reservation-as-case row/card | SCR-020 | row (wide) / card (narrow); blocked/at-risk emphasis | Shows ref, customer, vehicle, times, status, blocker, money, risk |
| CMP-021 | VehicleCard | Vehicle summary | SCR-030 | dual status; flags (maintenance/expiring) | Commercial + physical status both visible |
| CMP-022 | CustomerRow | Customer summary | SCR-040 | risk/outstanding indicators | |
| CMP-023 | TransactionRow | Financial line | SCR-050 | type/status; at-risk emphasis | Links to reservation |
| CMP-024 | DataTable | Sortable/filterable list shell | All lists | loading (skeleton rows) / empty / filtered-empty / error; selectable for bulk | Supports virtualization for large sets |
| CMP-025 | FilterBar | Filters + active filter chips | All lists | with segment bar; removable chips | Preserves filters per session |
| CMP-026 | SegmentTabs | State segments | SCR-020, SCR-030, SCR-060 | counts per segment | Canonical state vocabulary (`03 §7`) |
| CMP-027 | EvidenceViewer | Out/in photo + mileage/fuel compare | SCR-061 | side-by-side / stacked toggle; lazy-load | For handover evidence |
| CMP-028 | CalendarGrid | Occupancy timeline (P1) | SCR-100 | day/week/month; conflict highlight | Blocks link to detail |
| CMP-029 | CapabilityMatrix | Roles × capabilities (P1-ish, P0 module) | SCR-072 | editable / read-only; critical marker | Business-language descriptions |
| CMP-030 | ReportPanel | Decision-oriented metric + drilldown | SCR-130 | normal / low-data / loading | Every metric drills to source |
| CMP-031 | PolicyRuleTable | Structured financial/business policy rules | SCR-082, SCR-110 | active / draft / scheduled / invalid / conflict | Dropdown conditions and bounded numeric effects only; no formula editor |
| CMP-032 | PolicySimulator | Preview policy outcomes on sample reservations | SCR-082 | fresh / stale / loading / conflict | Shows payment, deposit, release, cancellation, no-show, refund, damage, tax outcomes |
| CMP-033 | VersionDiffPanel | Compare governed configuration versions | SCR-072, SCR-082, SCR-110, SCR-120 | side-by-side / summary / approval | Old/new values in business language, reason, approver, effective date |
| CMP-034 | RoleDiffPreview | Show access gained/lost before role change | SCR-071, SCR-072 | staff assignment / role edit / sensitive grant | Screens/actions/data visibility gained or removed |
| CMP-035 | ApprovalStatusBanner | Show draft/approval/scheduled/active state | SCR-072, SCR-082, SCR-110, SCR-120 | draft / pending / rejected / scheduled / active | Links to approval trail and audit where permitted |

## 5. Action & input components

| ID | Component | Purpose | Used on | Variants / states | Notes |
|---|---|---|---|---|---|
| CMP-040 | PrimaryActionButton | The one main action | All | default / busy / disabled (+tooltip) / hidden | Busy prevents double-submit (`ST-013`) |
| CMP-041 | ActionMenu | Secondary/overflow actions | Rows, detail headers | gated entries hidden | Hide-vs-disable per `11 §5` |
| CMP-042 | ConfirmDialog | Routine confirmation | Many | with/without reason field; busy/error | Used by non-heavy critical actions |
| CMP-043 | CriticalActionDialog | Heavy confirmation (override/refund/cancel) | INT-020/023/031 | mandatory reason; consequence preview; amount entry | Visually distinct from CMP-042; never one-click |
| CMP-044 | FormDrawer | Side-sheet for create/edit | Vehicle, staff, settings, rules, notes | edit / preview / unsaved-guard / error | Validation inline; preserves input on failure |
| CMP-045 | PreviewPane | Show effect before commit | Settings, pricing, notifications | up-to-date / stale | For previewable config changes |
| CMP-046 | ReasonField | Captures required reason | Critical dialogs | required / optional | Feeds audit (`M-14`) |
| CMP-047 | UnsavedChangesGuard | Navigation guard | Config screens | triggered on dirty | Stay / discard / save-and-leave (INT-130) |
| CMP-048 | ExportDialog | Export options | Lists, reports | scope/format; gated by view capability | Never exports gated data |
| CMP-049 | AmountInput | Validated money entry | Refund/charge dialogs | within-limit / over-limit error; currency-aware | Validates against refundable/original |
| CMP-050 | EffectiveDatePicker | Choose when governed config takes effect | SCR-082, SCR-110, SCR-120 | immediate / scheduled / invalid | Must preview existing-reservation impact where relevant |

## 6. Feedback components

| ID | Component | Purpose | Used on | Variants / states | Notes |
|---|---|---|---|---|---|
| CMP-060 | Toast | Transient success/info | All | success / info / with-undo | Auto-dismiss; undo where reversible |
| CMP-061 | InlineError | Field/region error + retry | All | with/without retry | Preserves input |
| CMP-062 | ErrorBoundaryState | Full-screen recoverable error | All | retry / back | Implements `ST-006`; never blank |
| CMP-063 | EmptyState | No-data / filtered-empty | All lists/regions | no-data (with action) / filtered (clear) / all-clear (calm) | Implements `ST-002`/`ST-003` |
| CMP-064 | SkeletonBlock | Loading placeholder | All | shapes matching final layout | Implements `ST-001` |
| CMP-065 | ForbiddenShell | No-access screen | Gated routes | default | Implements `ST-009` (`SCR-900`) |
| CMP-066 | OfflineBanner | Connection lost | Live regions | lost / recovering | Implements `ST-012`; preserves input |
| CMP-067 | StaleDataPrompt | Changed-elsewhere notice | Live/detail | refresh / dismiss | Implements `ST-011`; non-destructive |

## 7. Permission-aware wrappers

| ID | Component | Purpose | Notes |
|---|---|---|---|
| CMP-080 | CapabilityGate | Conditionally render by capability | Hide-for-permission per `11 §2`; supports "locked" affordance variant |
| CMP-081 | GatedSection | Section that hides/summarizes without capability | For money/PII/audit regions (`ST-008`) |
| CMP-082 | GatedField | Field-level data gating | For money components and sensitive PII |

## 8. Component → screen coverage (spot check)

| Screen | Key components |
|---|---|
| SCR-010 | CMP-000/004/008/009/012/014/063/064 |
| SCR-020 | CMP-020/024/025/026/007/063/064 |
| SCR-021 | CMP-004/005/007/008/009/011/013/041/043/046 |
| SCR-030/031 | CMP-021/024/025/007/008/044/043 |
| SCR-040/041 | CMP-022/024/010/013/044/081/082 |
| SCR-050/051/052 | CMP-023/024/009/043/049/048/081 |
| SCR-060/061 | CMP-011/027/043/044 |
| SCR-070/071/072 | CMP-024/029/034/035/044/043/046 |
| SCR-080/081 | CMP-044/045/047/061 |
| SCR-082 | CMP-031/032/033/035/045/047/050/061 |
| SCR-090/091 (P1) | CMP-024/044/043 |
| SCR-100 (P1) | CMP-028 |
| SCR-110 (P1) | CMP-044/045 |
| SCR-120 (P1) | CMP-044/045 |
| SCR-130 (P1) | CMP-030/012/048 |
| SCR-140 (P1) | CMP-013/024/048/080 |

## 9. Component acceptance criteria

- StatusPill (CMP-007) is the only source of status labels; no screen invents ad-hoc status text.
- MoneyBreakdown (CMP-009) always shows components separately with currency; never a bare "paid/unpaid".
- BlockerCallout (CMP-008) always shows the reason and a clear action.
- CriticalActionDialog (CMP-043) enforces reason capture and consequence preview; routine ConfirmDialog (CMP-042) is visually distinct.
- Every list uses DataTable (CMP-024) with built-in loading/empty/filtered-empty/error states.
- CapabilityGate/GatedSection/GatedField enforce hide-vs-disable and data-gating from `11`.
- No component renders a metric (CMP-012) without a destination, a money value without currency, or a blocker without a reason.
- Every interactive component meets the WCAG 2.2 AA requirements in `16`: keyboard operability, visible non-obscured focus (`A11Y-015/016`), ≥24×24px targets (`A11Y-005`), non-color-only status (`A11Y-003`), and status announcements (`A11Y-040`). The relevant per-pattern checklist in `16 §10` is the component's accessibility Definition of Done (the `14` gate verifies it; `16` is the source of truth).
- Form/input components follow the validation and error rules in `18 §3`–`§4`; money components follow `18 §5`. All component copy comes from the `19 §3` catalog.
- Policy and access-control configuration components enforce `21`, `22`, and `23`: no arbitrary formulas, diff preview before save, reason capture for sensitive changes, effective dates, version history, and existing-reservation protection.
