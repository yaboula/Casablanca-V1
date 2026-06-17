# Workflow Retrospective

## Purpose

Review completed work — examining handoffs, routing decisions, rule applications, and outcomes — to identify improvements in agent routing, missing rules, missing skills, boundary violations, and workflow gaps. Does not modify skills, agents, or rules directly.

## When to use

- After completing a significant task or feature
- After a QA failure revealed a routing or process issue
- After a release revealed a gap in readiness checks
- Periodically (e.g., after every 5–10 completed task packets)
- When PM Orchestrator identifies systemic patterns in recurring issues

## When not to use

- As a substitute for fixing an active problem (fix the problem first, then retrospect)
- For trivial tasks with no notable outcomes

## Required agents

- PM Orchestrator
- Workflow Agent

## Optional agents

- QA Agent (if the retrospective focuses on test coverage or quality issues)
- Docs Agent (if retrospective findings need to be documented as ADRs or knowledge base updates)

## Required rules

- `global-operating-rules.md`
- `handoff-contract.md`

## Required skills

- PM Orchestrator defaults: `to-prd`, `to-issues`
- Workflow Agent defaults: `changesets`, `github-templates`, `full-output-enforcement`

## Inputs

- All handoff summaries from the completed task(s) being reviewed
- Task packets from the reviewed tasks
- QA sign-off decisions
- Any escalation notices that were raised
- Any blocking rule violations that occurred

---

## Procedure

### Step 1 — PM Orchestrator: Select Scope

Define what is being reviewed:
- Single completed task, or
- A batch of recent tasks, or
- A specific recurring issue pattern

### Step 2 — PM Orchestrator: Handoff Review

For each handoff in the review scope:
1. Was the handoff complete? (all fields present)
2. Were the files touched documented?
3. Were risks documented honestly?
4. Were decisions documented with rationale?
5. Was the QA sign-off clear?

**Flag:** Any handoff that was incomplete or missing.

### Step 3 — PM Orchestrator: Routing Review

For each task in the review scope:
1. Were the correct agents activated?
2. Were any unnecessary agents activated?
3. Were any required agents missed (e.g., Trust Agent for a task that touched auth)?
4. Was the activation order correct (e.g., Data Agent before Backend Agent)?
5. Did any agent exceed its boundary?

**Flag:** Any routing mistake or boundary violation.

### Step 4 — QA Agent (if activated): Quality Pattern Review

QA Agent reviews patterns across the tasks:
1. Were there recurring test coverage gaps?
2. Were there recurring accessibility failures?
3. Were there recurring acceptance criteria that were not verifiable?
4. Were there QA FAILs that could have been prevented by earlier review?

**Flag:** Any recurring quality pattern.

### Step 5 — PM Orchestrator: Rule and Skill Gap Analysis

For each flagged issue:
1. Is there a missing rule that would have prevented this issue?
2. Is there a missing skill that would have helped?
3. Is an existing rule unclear or insufficient?
4. Is an existing agent boundary unclear?

**Important:** PM Orchestrator proposes changes but does not modify rules, agents, or skills directly in this workflow. Proposed changes are documented for user review.

### Step 6 — Workflow Agent: Process Improvement Proposals

Workflow Agent:
1. Structures the improvement proposals from PM Orchestrator.
2. Categorizes proposals: new rule / rule update / new skill / skill update / agent boundary clarification / workflow update.
3. Assigns priority: P1 (blocking, fix soon) / P2 (important, fix next cycle) / P3 (nice to have).

### Step 7 — Docs Agent (if activated): Retrospective Documentation

Docs Agent:
1. Writes the retrospective report.
2. If a proposal is ready to be a formal ADR → writes the ADR.
3. Updates project knowledge base with lessons learned.

### Step 8 — PM Orchestrator: Retrospective Closure

PM Orchestrator:
1. Reviews the improvement proposals.
2. Presents proposals to the user for approval (if they require changes to rules, agents, or skills).
3. Does not apply changes to `.agents/skills/`, `.agents/agents/`, or `.agents/rules/` without user approval.

---

## Quality gates

- [ ] All handoffs reviewed for completeness
- [ ] Routing reviewed for correctness
- [ ] Quality patterns identified (by QA Agent if activated)
- [ ] Rule and skill gaps identified
- [ ] Improvement proposals structured and prioritized
- [ ] No direct modifications to skills/agents/rules without user approval

## Escalation points

- If a retrospective reveals a security or data integrity gap → treat as a blocking issue and address immediately, not just in the retrospective
- If a boundary violation occurred → document and flag for user review before the next task

## Required handoffs

- PM Orchestrator: retrospective summary and routing review
- QA Agent: quality pattern analysis (if activated)
- Workflow Agent: structured improvement proposals
- Docs Agent: retrospective report and ADRs (if activated)

## Completion criteria

- All handoffs reviewed: ✓
- Routing reviewed: ✓
- Gaps identified: ✓ (or confirmed none)
- Proposals structured: ✓
- No unauthorized modifications to `.agents/` directories

## Output format

```txt
RETROSPECTIVE COMPLETE

Review scope: [task IDs / date range]
Handoffs reviewed: [count]
Issues found: [count]

Routing issues:
  - [issue 1: description]

Handoff completeness issues:
  - [issue 1: description]

Quality patterns (QA):
  - [pattern 1: description]

Improvement proposals:
  P1: [proposal 1 — type: new rule / skill / boundary clarification]
  P2: [proposal 2]
  P3: [proposal 3]

User approval required for: [list of proposals that require modifying .agents/ directories]

Next step: [user review of proposals / PM Orchestrator implements approved changes]
```
