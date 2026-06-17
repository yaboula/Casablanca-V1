# UI Change Workflow

## Purpose

Handle visual, layout, component, and design system changes — ensuring visual quality, design system consistency, accessibility, and responsive behavior are all validated before closure.

## When to use

- Adding or modifying UI components
- Updating design tokens (color, spacing, typography, radius)
- Changing the layout of a screen or page
- Introducing a new visual style direction
- Redesigning existing components or screens

## When not to use

- Pure backend API changes (no UI) → `backend-api-workflow.md`
- Pure data changes → `data-change-workflow.md`
- Full cross-cutting feature → `feature-development-workflow.md`

## Required agents

- PM Orchestrator
- UI Design System Agent
- Frontend Agent
- QA Agent

## Optional agents

- UX Agent (when interaction patterns or flows are undefined)

## Required rules

- `global-operating-rules.md`
- `ui-design-system-policy.md`
- `qa-gates-policy.md`
- `conflict-matrix-policy.md`
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| UI Design System Agent | `design-taste-frontend` |
| Frontend Agent | `next-app-router`, `tanstack-query` |
| QA Agent | `playwright-testing`, `tdd`, `review`, `axe-core` |

On-demand (with justification):
- UI Agent: one `optional-style-mode` skill (never multiple)
- QA Agent: `wcag-22` (full audit), `storybook` (component isolation)

## Inputs

- Task packet with component or screen scope defined
- Existing design tokens (if available)
- UX flow documentation (if available)
- Component reuse inventory (if available)

---

## Procedure

### Step 1 — PM Orchestrator: Task Packet

Create task packet with:
- In scope: specific components, screens, or token areas
- Out of scope: backend logic, schema changes, auth
- Acceptance criteria: visual states, responsive behavior, accessibility

### Step 2 — UX Agent (if activated): Flow and State Clarity

If the interaction pattern is not already defined:
- UX Agent documents the flow and all states (loading, error, empty, success)
- UX Agent defines form behavior and error messaging if forms are involved
- Returns handoff to UI Design System Agent

Skip this step if UX flows are already documented.

### Step 3 — UI Design System Agent: Design Specification

UI Design System Agent:
1. Loads `design-taste-frontend` (default — always)
2. If optional style mode is requested: loads ONE only, documents choice
3. Verifies no conflict with `open-design` / `ui-ux-pro-max` (both needs-review — require explicit approval)
4. Checks for existing reusable components before specifying a new one
5. Defines:
   - Component visual states (default, hover, active, focus, disabled, error)
   - Token references (not hex values — use token names)
   - Responsive behavior at: 1366, 1440, 1536, 1920, 2560px
   - Accessibility requirements (contrast, focus, ARIA)
6. Returns: component spec, token references, style direction decision

**Critical checks:**
- No glassmorphism, heavy decorative shadows, or noisy animations
- No arbitrary hex colors outside the token system
- No duplicate component if a reusable one exists

### Step 4 — Frontend Agent: Implementation

Frontend Agent receives task packet + UI Agent spec:
1. Implements component following the spec precisely
2. Applies design tokens (not ad-hoc values)
3. Implements all visual states defined in spec
4. Validates responsive behavior at all breakpoints
5. Ensures no layout shift (CLS)
6. Handles all states: loading, error, empty, success
7. Does not make visual design decisions — consumes the spec
8. Returns: implemented component files, responsive validation notes

**Escalate if:** Component spec is missing or ambiguous → UI Design System Agent before continuing

### Step 5 — QA Agent: Validation

QA Agent runs `qa-validation-workflow.md`:
1. Code review with `review` skill
2. Playwright test for affected flows (all states)
3. axe-core accessibility scan (0 violations required)
4. Responsive check at breakpoints
5. Visual state validation (all states render correctly)
6. Confirms no duplicate components were created
7. Confirms design token usage (no arbitrary values)
8. Returns: PASS / CONDITIONAL PASS / FAIL

---

## Quality gates

- [ ] No multiple visual taste skills loaded simultaneously
- [ ] `design-taste-frontend` is default — not substituted
- [ ] Optional style mode (if used): one only, documented
- [ ] `open-design` or `ui-ux-pro-max`: not loaded without explicit approval
- [ ] No glassmorphism, heavy shadows, random gradients
- [ ] No arbitrary color/spacing tokens
- [ ] No duplicate components (reuse verified)
- [ ] Responsive behavior validated at all breakpoints
- [ ] All visual states implemented (default, hover, active, focus, disabled, error)
- [ ] Loading/error/empty/success states handled
- [ ] Accessibility: axe-core passes, focus visible, contrast AA
- [ ] QA sign-off: PASS or CONDITIONAL PASS

## Escalation points

- Visual direction unclear → UI Design System Agent → PM Orchestrator if still unclear
- Multiple taste skills requested → select one, document, continue
- `open-design` or `ui-ux-pro-max` requested → confirm needs-review status → user approval before loading
- Interaction pattern undefined → UX Agent (Frontend Agent waits)
- Accessibility failure → QA Agent returns FAIL to Frontend Agent

## Required handoffs

- UX Agent handoff (if activated): flow, states, form spec
- UI Design System Agent handoff: component spec, tokens, style direction
- Frontend Agent handoff: implementation summary, files touched, responsive validation
- QA Agent sign-off: PASS / CONDITIONAL PASS / FAIL with specifics

## Completion criteria

- Component spec: ✓ produced and complete
- Implementation: ✓ follows spec without deviation
- All states: ✓ implemented
- Responsive: ✓ validated at all breakpoints
- Accessibility: ✓ axe-core passes
- QA sign-off: ✓ PASS or CONDITIONAL PASS
- No conflicts: ✓ taste skill policy respected

## Output format

```txt
UI CHANGE COMPLETE

Task ID: [id]
Components changed: [list]
Style direction used: [design-taste-frontend / optional-style-mode: name]
Responsive validated: [1366 / 1440 / 1536 / 1920 / 2560]
Accessibility: [axe-core: 0 violations / issues found: list]
QA status: [PASS / CONDITIONAL PASS]
Files changed: [list]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
