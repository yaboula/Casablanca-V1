# Bugfix and Debugging Workflow

## Purpose

Diagnose a known or suspected bug and apply a minimal, targeted fix without scope creep — while ensuring regression risks are documented and QA validates before closure.

## When to use

- A specific bug has been reported or discovered
- A test is failing for an identified reason
- A regression from a recent change needs to be reversed
- A production issue needs a targeted hotfix

## When not to use

- The fix requires significant refactoring → create a new task packet for the refactor separately
- The fix requires new features → separate task packet
- The cause is unknown and requires deep research → use this workflow for the investigation phase, then create a new task packet for the fix

## Required agents

- PM Orchestrator
- Relevant specialist agent (determined by failure area)
- QA Agent

## Optional agents

- Ops Agent (if the bug is a production runtime issue requiring observability data)
- Trust Agent (if the bug involves auth, session, payment, or permission behavior)
- Data Agent (if the bug involves a data integrity issue)

## Required rules

- `global-operating-rules.md`
- `agent-boundaries.md`
- `security-trust-policy.md` (triggered if sensitive area is involved)
- `qa-gates-policy.md`
- `handoff-contract.md`
- `git-change-control-policy.md` (bugfix must not become broad refactor)

## Required skills

Skills are loaded per the activated specialist agent's defaults. No extra skills loaded without justification.

## Inputs

- Bug report or failure description
- Steps to reproduce (or observed behavior vs expected behavior)
- Relevant files or areas suspected
- Any related error logs or Playwright test failures

---

## Procedure

### Step 1 — PM Orchestrator: Triage

PM Orchestrator:
1. Reads the bug report.
2. Identifies the affected area (frontend / backend / data / trust / ops).
3. Assigns risk level:
   - `low` — cosmetic or isolated behavior
   - `medium` — functional regression affecting user journey
   - `high` — data loss risk or security impact
   - `critical` — auth bypass, payment error, PII exposure, data corruption
4. Selects the minimum necessary agent(s).
5. Creates a task packet with:
   - In scope: specific bug reproduction and fix
   - Out of scope: any refactor, unrelated improvement, or new feature
   - Acceptance criteria: bug no longer reproduces, existing tests pass

**Rule:** This workflow must not become a broad refactor. If the root cause reveals that a larger structural change is needed, PM Orchestrator creates a separate task packet for that work.

### Step 2 — Specialist Agent: Reproduce and Isolate

The selected specialist agent:
1. Reproduces the failure (or confirms the failure description).
2. Isolates the root cause to the smallest possible scope.
3. Checks if the root cause touches a sensitive area (auth, data, payments).

**If sensitive area discovered:**
- Stop.
- Escalate to PM Orchestrator.
- PM Orchestrator routes to Trust Agent or Data Agent as appropriate.
- Do not attempt to fix the sensitive area independently.

### Step 3 — Specialist Agent: Propose Minimal Fix

Before implementing:
1. Describe the proposed fix (what will change, what will not change).
2. Confirm the fix is minimal (no unrelated changes included).
3. Identify regression risks (what else could this fix affect?).

**No fix may touch files not related to the bug reproduction path.**

### Step 4 — Specialist Agent: Implement Fix

1. Apply the minimal fix.
2. Verify the bug no longer reproduces.
3. Run existing tests relevant to the affected area.
4. Does not add new features or unrelated improvements.
5. Returns: files changed, fix description, regression risk assessment.

### Step 5 — QA Agent: Validation

QA Agent:
1. Confirms the bug no longer reproduces.
2. Runs the full test suite for the affected area.
3. Checks for regressions in adjacent behavior.
4. Verifies the fix does not introduce new issues.
5. Accessibility check if UI was touched.
6. Returns: PASS / CONDITIONAL PASS / FAIL.

### Step 6 — PM Orchestrator: Closure or New Task

- If QA passes: task closed. PM Orchestrator documents the fix.
- If QA fails: return to specialist agent with specific failure reasons.
- If root cause requires structural change: PM Orchestrator creates a separate task packet for the refactor.

---

## Quality gates

- [ ] Bug is reproduced (or failure is confirmed) before fix is attempted
- [ ] Root cause isolated to minimum scope
- [ ] Fix is minimal (no unrelated changes)
- [ ] No sensitive area touched independently (Trust/Data Agent if needed)
- [ ] Existing tests run and pass
- [ ] Regression risks documented
- [ ] QA sign-off: PASS or CONDITIONAL PASS
- [ ] If structural change needed: separate task packet created (not mixed in)

## Escalation points

- Auth / payment / PII discovered → Trust Agent (mandatory, stop current agent)
- Schema / data integrity issue → Data Agent (mandatory, stop current agent)
- Production runtime issue → Ops Agent (observability data needed)
- Root cause requires broad refactor → PM Orchestrator creates separate task packet

## Required handoffs

- Specialist Agent handoff: root cause, fix description, files changed, regression risk
- Trust/Data Agent handoff (if escalated): security or data review result
- QA Agent sign-off: confirmation bug resolved, regression check result

## Completion criteria

- Bug: ✓ confirmed fixed (no longer reproduces)
- Scope: ✓ fix is minimal, no unrelated changes
- Sensitive areas: ✓ properly escalated (if applicable)
- Regression risk: ✓ documented
- Tests: ✓ existing tests pass
- QA sign-off: ✓ PASS or CONDITIONAL PASS

## Output format

```txt
BUGFIX COMPLETE

Task ID: [id]
Bug: [description]
Root cause: [brief explanation]
Fix applied: [what changed]
Files changed: [list]
Sensitive area escalated: [yes / no]
Regression risk: [documented — description]
Tests: [existing tests: pass / new tests: list]
QA status: [PASS / CONDITIONAL PASS]
Structural change needed: [yes — new task packet created: [ID] / no]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
