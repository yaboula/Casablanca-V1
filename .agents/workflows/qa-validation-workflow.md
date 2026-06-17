# QA Validation Workflow

## Purpose

Validate all implementation changes before a task is closed — serving as the mandatory quality gate for every implementation workflow. This workflow is never optional for implementation tasks.

## When to use

- At the end of every frontend, backend, data, trust, or UI implementation task
- Before any PR is marked ready for merge
- When explicitly requested by PM Orchestrator
- When an implementation agent requests review before handoff

## When not to use

- Documentation-only tasks (Docs Agent output does not require QA gate — though accuracy review is encouraged)
- Purely investigatory tasks with no code or config changes
- Workflow / git hygiene tasks (Workflow Agent manages its own validation)

## Required agents

- QA Agent

## Optional agents

- PM Orchestrator (to receive and process the QA sign-off decision)

## Required rules

- `qa-gates-policy.md`
- `handoff-contract.md`
- `security-trust-policy.md` (when security-sensitive changes are in scope)

## Required skills

| Skill | Always loaded |
|---|---|
| `playwright-testing` | Yes |
| `tdd` | Yes |
| `review` | Yes |
| `axe-core` | Yes (for any UI-touching changes) |

On-demand (with justification):
- `vitest` — unit or integration tests at function level needed
- `storybook` — component-level visual isolation testing
- `lighthouse-ci` — performance scores and Core Web Vitals validation
- `wcag-22` — full WCAG 2.2 audit beyond axe-core

## Inputs

- Implementation handoff summary from the responsible agent
- Files touched (full list)
- Acceptance criteria from the original task packet
- Risk level assigned in the task packet
- Tests performed by the implementation agent (if any)
- Any known regression risks documented in the handoff

---

## Procedure

### Step 1 — QA Agent: Read Handoff

QA Agent:
1. Reads the implementation handoff summary.
2. Reads the task packet acceptance criteria.
3. Confirms all required inputs are present.

If the handoff is incomplete (missing files touched, missing acceptance criteria, missing risk assessment):
- Request a complete handoff before proceeding.
- Do not validate an incomplete handoff.

### Step 2 — QA Agent: Code Review

Using `review` skill:
- [ ] Code follows project conventions and patterns
- [ ] No dead code or commented-out blocks
- [ ] Error handling is honest and explicit (no silent fails)
- [ ] No hardcoded values that should be environment variables
- [ ] No business logic duplicated between frontend and backend
- [ ] No imports from wrong layer (frontend importing backend internals, etc.)

### Step 3 — QA Agent: Test Coverage Assessment

Using `tdd` skill:
- [ ] Unit tests exist for new business logic
- [ ] Integration tests exist for new API routes
- [ ] Edge cases are covered
- [ ] Tests are behavioral (test what it does, not how it does it)

Determine: are the existing tests sufficient? Or are new tests needed before sign-off?

### Step 4 — QA Agent: End-to-End Validation

Using `playwright-testing` skill:
- [ ] Critical user flows affected by this change are tested
- [ ] All user states tested: loading, error, empty, success
- [ ] Regression tests run for previously passing flows
- [ ] No new failures introduced

### Step 5 — QA Agent: Accessibility Check (UI changes only)

Using `axe-core` skill:
- [ ] axe-core scan: 0 violations
- [ ] Focus states: visible and styled
- [ ] Interactive elements: keyboard-navigable
- [ ] ARIA labels: present where needed
- [ ] Color contrast: WCAG 2.2 AA minimum

If `wcag-22` is activated (on-demand):
- Full WCAG 2.2 audit checklist applied

### Step 6 — QA Agent: Acceptance Criteria Verification

For each criterion in the task packet:
- [ ] Criterion 1: [pass / fail / not verifiable]
- [ ] Criterion 2: [pass / fail / not verifiable]
- [ ] ...

Every criterion must be explicitly checked. "Assumed to pass" is not acceptable.

### Step 7 — QA Agent: Security Check (if sensitive changes in scope)

- [ ] No PII in logs or error responses
- [ ] No secrets in committed files
- [ ] Auth middleware applied to protected routes
- [ ] Demo bypass cannot leak to production

### Step 8 — QA Agent: Build and Lint (if applicable)

- [ ] `next build` (or equivalent) completes without errors
- [ ] TypeScript type check passes
- [ ] ESLint passes with no new errors

### Step 9 — QA Agent: Sign-Off Decision

Based on all checks above:

#### QA PASS
All required checks passed. All acceptance criteria met. No blocking issues.
→ Task may be closed. PM Orchestrator routes to Workflow Agent if release steps needed.

#### QA PASS WITH RISKS (Conditional Pass)
Core functionality verified. Minor issues found that do not block the feature.
Conditions documented. Implementation agent must address before next release.
→ Task may proceed to merge with documented conditions.

#### QA BLOCKED
Inputs are insufficient to complete validation (missing handoff, missing files, missing criteria).
→ Return to implementation agent for complete handoff. Re-trigger QA after.

#### QA FAIL
One or more required checks failed. Task is returned to implementation agent.
→ PM Orchestrator routes to the responsible agent with specific failure reasons.

---

## Quality gates

- [ ] Handoff is complete (files, decisions, risks, validation performed)
- [ ] All acceptance criteria explicitly checked
- [ ] Code review complete
- [ ] Tests assessed and run
- [ ] Accessibility verified (for UI changes)
- [ ] Build passes (if applicable)
- [ ] Security checked (if sensitive changes present)
- [ ] Sign-off decision produced (not deferred)

## Escalation points

- Acceptance criteria unclear → PM Orchestrator (before proceeding)
- Security gaps found → Trust Agent (if not already involved)
- Serious regression found → PM Orchestrator + responsible agent

## Required handoffs

- QA Agent sign-off: structured output (see below)

## Completion criteria

QA validation is complete when:
- All checks are run (not skipped)
- Sign-off decision is produced
- Failures are documented with specific reasons
- PM Orchestrator has received the sign-off

## Output format

```txt
QA VALIDATION RESULT

Task ID: [id]
QA Agent decision: [QA PASS / QA PASS WITH RISKS / QA BLOCKED / QA FAIL]

Code review: [PASS / FAIL — issues: list]
Test coverage: [sufficient / gaps: list]
E2E tests: [X/Y passing / failures: list]
Accessibility: [0 violations / violations: list]
Acceptance criteria:
  - [criterion 1]: [PASS / FAIL]
  - [criterion 2]: [PASS / FAIL]
Security check: [PASS / N/A / issues: list]
Build: [PASS / FAIL / N/A]

Conditions (if PASS WITH RISKS):
  - [condition 1]

Failures (if FAIL):
  - [specific failure 1]
  - [specific failure 2]

Next agent: [PM Orchestrator (PASS) / Workflow Agent (PASS, release needed) / responsible agent (FAIL)]
```
