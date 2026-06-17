# Workflow Operating Standard

## Purpose

Define the global principles that govern every workflow in the Casablanca-V1 multi-agent system. Every workflow must comply with these principles. No workflow overrides them.

## When to use

Always. This is the baseline every other workflow is built on. Read this before executing any workflow.

## When not to use

Never — it applies universally.

## Required agents

- PM Orchestrator (always the initiating agent)

## Optional agents

None — this is a reference document, not an executable workflow.

## Required rules

- `global-operating-rules.md`
- `skill-loading-policy.md`
- `qa-gates-policy.md`
- `handoff-contract.md`
- `task-packet-contract.md`

## Required skills

None directly — PM Orchestrator's default skills apply (`to-prd`, `to-issues`).

---

## Global Workflow Principles

### 1. PM Orchestrator starts every non-trivial workflow

Every workflow of meaningful scope begins with PM Orchestrator. PM Orchestrator is responsible for:
- Reading the user request
- Selecting the appropriate workflow
- Creating the task packet
- Activating only the required agents
- Integrating all handoffs
- Enforcing QA gates before closure

No specialist agent self-activates. No workflow runs without PM Orchestrator's coordination.

### 2. Every workflow starts with a task packet

Before any agent begins implementation work, a task packet must exist. The task packet is created by PM Orchestrator using `.agents/rules/task-packet-contract.md`. It defines scope, in/out boundaries, constraints, skills to load, and acceptance criteria.

**No task packet = no implementation.**

### 3. Every workflow ends with a handoff summary

Before a workflow is considered complete, the last active agent must produce a handoff summary following `.agents/rules/handoff-contract.md`. PM Orchestrator reviews the handoff and confirms completion criteria are met.

**No handoff = task not closed.**

### 4. Do not activate all agents

The multi-agent system is designed around **minimum activation**. PM Orchestrator selects only the agents whose area is touched by the task. Activating unused agents adds noise, creates conflicting context, and wastes capacity.

The routing table in `agent-routing-workflow.md` guides correct selection.

### 5. Activate only necessary agents

1–3 agents is the target for normal tasks. 4–6 agents is acceptable for complex, cross-cutting features. More than 6 agents in a single workflow is a signal that the task should be split into smaller task packets.

### 6. Load only default skills for active agents

Default skills are loaded automatically when an agent is activated. On-demand skills require justification documented in the task packet. No agent loads skills not in `.agents/skills/manifest.json`.

### 7. Load on-demand skills only with justification

The task packet must include:
```txt
On-demand skill: [skill-name]
Reason: [why this task requires it]
Conflict check: [none / conflict with X — not loading X]
```

### 8. Blocking rules override agent preference

If a blocking rule from `.agents/rules/rules.manifest.json` is triggered, no workflow may proceed past that point without satisfying the rule. Agent preferences, time pressure, or user convenience do not override blocking rules.

**Blocking rules:**
- `dependency-installation-policy` — no install without explicit approval
- `security-trust-policy` — Trust Agent mandatory for sensitive areas
- `data-integrity-policy` — Data Agent mandatory for schema changes
- `qa-gates-policy` — QA mandatory before close
- `conflict-matrix-policy` — conflicting tools cannot be loaded simultaneously

### 9. QA is mandatory before closing implementation tasks

Every workflow that produces implementation (code, config, schema, CI changes) must route through the `qa-validation-workflow` before the task is marked complete. This is a non-negotiable gate.

### 10. Trust Agent is mandatory for sensitive areas

Any workflow step that encounters auth, permissions, security, payments, secrets, PII, webhooks, or sensitive admin actions must escalate to Trust Agent — even if Trust Agent was not in the original task packet.

### 11. Data Agent is mandatory for schema and migration changes

Any workflow step that requires schema changes, new migrations, or data model decisions must route through Data Agent before Backend Agent proceeds with implementation.

---

## Procedure

1. PM Orchestrator receives a user request.
2. PM Orchestrator runs `task-intake-workflow` to classify and create a task packet.
3. PM Orchestrator selects the appropriate workflow from `workflows.manifest.json`.
4. PM Orchestrator routes the task packet to the first required agent.
5. Agents execute in order, each producing a handoff before routing to the next.
6. Escalation triggers are checked at every step.
7. QA gate is enforced before closure for implementation tasks.
8. PM Orchestrator integrates all handoffs and confirms completion criteria.

## Quality gates

- Task packet created and complete before implementation starts
- No agent exceeds its defined boundary
- No blocking rule is violated
- QA sign-off obtained for implementation tasks
- All handoffs complete and filed

## Escalation points

- Any blocking rule triggered → escalate to PM Orchestrator immediately
- Any sensitive area discovered → escalate to Trust Agent
- Any schema change discovered → escalate to Data Agent
- Any scope ambiguity → escalate to PM Orchestrator

## Required handoffs

- PM Orchestrator: task packet created (not a handoff per se, but audit entry)
- Each specialist agent: handoff summary on task completion
- QA Agent: sign-off (PASS / CONDITIONAL PASS / FAIL)

## Completion criteria

- Task packet: ✓ created
- Agents: ✓ only required agents activated
- Implementation: ✓ within scope
- Handoffs: ✓ all complete
- QA: ✓ signed off (for implementation tasks)
- Blocking rules: ✓ none violated

## Output format

```txt
WORKFLOW COMPLETE

Workflow: [workflow name]
Task: [task ID]
Agents activated: [list]
Skills loaded: [list]
Handoffs received: [list of agents + sign-off status]
QA status: [PASS / CONDITIONAL PASS / N/A]
Blocking rules triggered: [none / list]
Completion: [COMPLETE / COMPLETE WITH RISKS / INCOMPLETE — see blockers]
```
