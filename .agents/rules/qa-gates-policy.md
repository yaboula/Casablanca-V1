# QA Gates Policy

**Severity:** blocking  
**Applies to:** QA Agent (primary), PM Orchestrator, all implementation agents  
**Version:** 1.0

---

This is a **blocking rule**. No implementation task may be closed without QA Agent sign-off. PM Orchestrator must enforce this gate. Implementation agents must not self-certify completion.

---

## QA Is Mandatory Before Closing Tasks That Involve:

| Task Type | Required QA Activity |
|---|---|
| **Frontend changes** | E2E tests, accessibility check, visual state validation |
| **Backend changes** | API contract validation, error handling review |
| **Database changes** | Migration behavior validation, data integrity check |
| **Auth / Security / Payments** | Access control tests, security regression |
| **CI/CD workflow changes** | Pipeline validation, environment safety check |
| **UI component changes** | Component state review, accessibility audit |
| **Any implementation task** | Code review (always) |

---

## QA Agent Review Checklist

### 1. Code Review (`review` skill)
- [ ] Code follows project conventions and patterns
- [ ] No dead code or commented-out logic left in
- [ ] Error handling is honest and explicit (no silent fails)
- [ ] No hardcoded values that should be environment variables
- [ ] No business logic duplicated between frontend and backend

### 2. Test Coverage (`tdd` skill)
- [ ] Unit tests exist for new business logic
- [ ] Integration tests exist for new API routes
- [ ] Edge cases are covered
- [ ] Tests follow TDD principles (test behavior, not implementation)

### 3. End-to-End Tests (`playwright-testing` skill)
- [ ] Critical user flows are covered by E2E tests
- [ ] All user states are tested: loading, error, empty, success
- [ ] Regression tests for previously failing paths

### 4. Accessibility (`axe-core` skill)
- [ ] axe-core scan runs clean (no violations)
- [ ] Focus states are visible and correct
- [ ] Interactive elements are keyboard-navigable
- [ ] ARIA labels are present where needed
- [ ] Color contrast meets WCAG 2.2 AA

### 5. Acceptance Criteria Validation
- [ ] Every acceptance criterion from the task packet is confirmed met
- [ ] No criterion is left as "assumed" — each must be explicitly verified

### 6. Regression Risk Assessment
- [ ] Identify any existing functionality that could have been broken
- [ ] Run affected E2E tests to confirm no regressions
- [ ] Flag any unverified regression risk in the handoff

### 7. Build and Lint (when applicable)
- [ ] `next build` (or equivalent) completes without errors
- [ ] TypeScript type check passes
- [ ] ESLint passes with no new errors

---

## On-Demand QA Activities

These are activated only when the task explicitly requires them:

| Skill | When to activate |
|---|---|
| `vitest` | Unit or integration tests at function level are needed |
| `storybook` | Component-level isolation and visual documentation |
| `lighthouse-ci` | Performance scores and Core Web Vitals must be validated |
| `wcag-22` | Full WCAG 2.2 compliance audit beyond axe-core |

---

## QA Sign-Off Levels

### PASS
All required checklist items are complete. Task may be closed. PM Orchestrator routes to Workflow Agent for git/release steps.

### CONDITIONAL PASS
Minor issues found that do not block the core feature. Conditions are documented. Implementation agent must resolve conditions before next release.

### FAIL
One or more required checklist items are not met. Task is **returned to the implementation agent** with specific failure reasons. PM Orchestrator re-routes to the responsible agent.

---

## QA Rejection Format

When QA Agent rejects a task:

```txt
QA REJECTION

Task: [task description]
QA Agent: QA Agent
Decision: FAIL

Failures:
- [specific failure 1]
- [specific failure 2]

Required actions:
- [what the implementation agent must fix]

Returning to: [Frontend Agent / Backend Agent / Data Agent / ...]
```

---

## PM Orchestrator Enforcement

PM Orchestrator must not close any implementation task that:
1. Does not have a QA Agent handoff in its audit trail
2. Has a QA Agent handoff with a FAIL decision that was not subsequently resolved
3. Has no record of accessibility check for user-facing changes

If a task is attempted to be closed without QA sign-off, PM Orchestrator must redirect to QA Agent before completing the closure.
