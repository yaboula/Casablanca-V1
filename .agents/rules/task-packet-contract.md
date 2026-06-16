# Task Packet Contract

**Severity:** required  
**Applies to:** PM Orchestrator (creates), all agents (consumes)  
**Version:** 1.0

---

No agent should begin work without a task packet, except for genuinely trivial tasks (single-file, zero-risk, no side effects, no dependency changes). For any task of meaningful scope, the task packet is the contract that defines what the agent is authorized to do.

---

## Task Packet Structure

```md
# Task Packet

## Task ID
[Unique identifier — e.g., TASK-001 or a descriptive slug like auth-session-expiry-fix]

## Objective
[One clear sentence: what must be accomplished by the end of this task]

## Request Source
[User request / PM Orchestrator decision / Escalation from: {agent name}]

## Scope

### In scope
- [Specific files, areas, or behaviors that the agent may touch]
- [Be explicit — if a file is not listed, it is out of scope]

### Out of scope
- [Explicitly list what the agent must NOT touch, even if adjacent]
- [This prevents silent scope expansion]

## Agents Assigned
- [Primary agent: e.g., Frontend Agent]
- [Secondary agents if required: e.g., QA Agent (gate before close)]

## Skills to Load

### Default
- [Skill names as they appear in .agents/skills/manifest.json]

### On-demand
- [Skill name] — Reason: [why this task requires it]
- (empty if none needed)

## Relevant Files / Areas
- [Specific file paths or module areas relevant to this task]
- [API contracts to consume: e.g., /api/reservations contract from Backend Agent]
- [Schema definitions: e.g., reservations table from Data Agent]

## Constraints
- [Technical constraints: e.g., must use tRPC — do not use REST for this endpoint]
- [Security constraints: e.g., Trust Agent must review before close]
- [Performance constraints: e.g., no new synchronous database calls in render path]
- [Compatibility constraints: e.g., must work at 1366px breakpoint]
- [Rules that apply: reference relevant rule files, e.g., dependency-installation-policy.md]
- No dependency installation without explicit approval (dependency-installation-policy.md)
- QA sign-off required before close (qa-gates-policy.md)

## Acceptance Criteria
- [ ] [Specific, verifiable criterion 1]
- [ ] [Specific, verifiable criterion 2]
- [ ] [Each criterion must be testable — not "it looks good" but "the reservation card renders with status badge at 1440px"]

## Risk Level
[low / medium / high]

Reasoning: [brief explanation of why this risk level was assigned]

## Required Output
- [What the agent must deliver: e.g., implemented component, API contract, migration file, test suite]
- Handoff summary (always required)
- QA sign-off (required for implementation tasks)

## Escalation Conditions
- [When should the agent stop and escalate to PM Orchestrator]
- [e.g., If the component spec is missing, escalate before implementing]
- [e.g., If the task requires touching auth logic, escalate to Trust Agent]
```

---

## Usage Rules

### PM Orchestrator must:
1. Create a task packet for every non-trivial task before routing to any agent.
2. Include explicit in-scope and out-of-scope lists — no implicit boundaries.
3. Reference applicable rule files under `Constraints`.
4. Always include QA Agent in `Agents Assigned` for implementation tasks.
5. Always include acceptance criteria — no open-ended tasks.

### Agents must:
1. Refuse to begin work without a task packet for non-trivial tasks.
2. Operate strictly within the stated scope.
3. Stop and escalate if they discover the task requires work not in scope.
4. Return the handoff summary at the end, documenting any scope deviations.

### Trivial Task Exception

A task may proceed without a full task packet if ALL of the following are true:
- Single file change
- No dependency changes
- No schema changes
- No auth or payment logic involved
- No new components being added
- Estimated effort: < 5 minutes

Even in this case, a brief handoff summary is still required.
