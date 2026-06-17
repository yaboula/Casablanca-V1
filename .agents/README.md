# .agents/ — Casablanca-V1 Multi-Agent System

This directory is the operational core of the Casablanca-V1 multi-agent workspace. It defines how intelligent agents collaborate to deliver product, design, engineering, security, quality, and operations work — from a raw user request through to a validated, documented handoff.

---

## What this system is

The multi-agent system is a **coordination architecture** built around four layers:

```txt
.agents/skills/       — Knowledge and competency references (how to do things)
.agents/agents/       — Role definitions with responsibilities (who does what)
.agents/rules/        — Behavioral guardrails (what must and must not happen)
.agents/workflows/    — Coordination protocols (how agents work together)
```

These four layers are connected through the **PM Orchestrator** — the routing hub that reads user requests, creates task packets, selects minimum agents, and integrates handoffs.

---

## The four layers

### 1. Skills (`.agents/skills/`)

Skills are competency references — documentation, patterns, and cheat sheets that agents load to know *how* to do their work. Skills are not installed software. They are reference artifacts.

- Source of truth: `.agents/skills/manifest.json`
- Skills have statuses: `real-skill`, `generated-wrapper`, `tool-reference`, `blocked`, `needs-review`
- Skills are loaded per agent, not globally

### 2. Agents (`.agents/agents/`)

Agents are role definitions — each with a mission, responsibilities, default skills, on-demand skills, boundaries, and escalation rules.

- Source of truth: `.agents/agents/agents.manifest.json`
- 12 specialist agents + PM Orchestrator
- Agents operate within strict boundaries. They do not self-activate.

### 3. Rules (`.agents/rules/`)

Rules are behavioral guardrails — mandatory constraints that every agent must follow. Some are **blocking** (work stops until satisfied), some are **required** (must be followed in normal operations).

- Source of truth: `.agents/rules/rules.manifest.json`
- 5 blocking rules (dependency installation, security/trust, data integrity, QA gate, conflict matrix)
- Rules override agent preferences and workflow choices

### 4. Workflows (`.agents/workflows/`)

Workflows are coordination protocols — step-by-step scripts for recurring task categories. They define which agents activate, in what order, with which skills, and what the quality gates are.

- Source of truth: `.agents/workflows/workflows.manifest.json`
- 14 operational workflows covering all task categories
- Every workflow ends with a handoff summary

---

## How to start a real task

1. **Read the user request**
2. **PM Orchestrator** runs `task-intake-workflow` to classify and create a task packet
3. PM Orchestrator runs `agent-routing-workflow` to select minimum agents
4. PM Orchestrator dispatches the task packet to the first active agent
5. Agents execute in sequence, each producing a handoff
6. QA Agent validates all implementation tasks
7. PM Orchestrator integrates handoffs and confirms completion criteria
8. Task is closed, escalated, or split

See `.agents/activation-guide.md` for the practical quick-start.

---

## What PM Orchestrator does

PM Orchestrator is the central routing hub. It:
- Reads and classifies every user request
- Creates structured task packets (scope, agents, skills, acceptance criteria)
- Selects the minimum necessary agents (not all agents)
- Sequences agent activation in dependency order
- Collects and integrates all handoffs
- Enforces QA gates before closure
- Escalates when blocking rules are triggered
- Splits tasks when scope is too broad for a single packet

PM Orchestrator does **not** implement features. It coordinates.

---

## Why not all agents are loaded

Activating all agents simultaneously creates conflicting instructions, wastes context, and produces unpredictable behavior. The system is designed around **minimum activation**: select only the agents whose domain is touched by the task.

A typical task uses 2–4 agents. A complex cross-cutting feature may use 5–7. More than 7 agents is a signal the task should be split.

---

## Why not all skills are loaded

Skills are loaded per active agent and only when relevant. Default skills are loaded when the agent is activated. On-demand skills require justification in the task packet. Blocked and needs-review skills are never loaded without explicit user approval.

Loading all skills simultaneously would create contradictory guidance (e.g., two ORM patterns, two auth patterns, two visual directions at once).

---

## How task packets work

A task packet is the **authorization document** for an agent. It defines:
- What the agent is allowed to do (in scope)
- What the agent must not touch (out of scope)
- Which rules apply
- Which skills to load
- What the acceptance criteria are
- When to escalate

No agent may expand beyond the task packet. If more scope is needed, it must be escalated to PM Orchestrator.

Template: `.agents/task-packet.template.md`

---

## How handoffs work

A handoff summary is the **completion record** produced by every agent before the next agent can begin. It documents:
- What changed
- Files touched
- Decisions made
- Risks identified
- Validation performed
- Next agent recommended

No task is closed without a handoff. No agent self-certifies completion without a handoff.

Template: `.agents/handoff.template.md`

---

## How QA works before closure

Every implementation task (frontend, backend, data, UI, trust) must pass through QA Agent before it is closed. This is a **blocking rule** — PM Orchestrator cannot close a task without a QA sign-off.

QA Agent produces one of four decisions: `QA PASS`, `QA PASS WITH RISKS`, `QA BLOCKED`, `QA FAIL`. A `QA FAIL` returns the task to the implementation agent — it is not closed.

Workflow: `.agents/workflows/qa-validation-workflow.md`

---

## How Trust Agent handles sensitive tasks

Any task touching auth, sessions, permissions, payments, webhooks, secrets, PII, or admin actions **requires Trust Agent**. This is a blocking rule. No other agent may implement these areas independently.

If a non-trust agent discovers a sensitive area during its task, it must stop and escalate to PM Orchestrator. PM Orchestrator routes to Trust Agent before implementation continues.

Workflow: `.agents/workflows/trust-sensitive-change-workflow.md`

---

## How Data Agent handles database changes

Any task requiring schema changes, new migrations, indexing decisions, or data integrity rules **requires Data Agent**. Data Agent runs before Backend Agent — the schema must exist before the API is built.

Destructive migrations (DROP TABLE, DROP COLUMN) require explicit user sign-off. The ORM choice (Drizzle vs Prisma) must be declared once and never mixed.

Workflow: `.agents/workflows/data-change-workflow.md`

---

## System entry points

| Purpose | File |
|---|---|
| Activation guide (quick start) | `.agents/activation-guide.md` |
| PM Orchestrator runtime | `.agents/orchestration/pm-orchestrator-runtime.md` |
| Task intake runtime | `.agents/orchestration/task-intake-runtime.md` |
| Routing runtime | `.agents/orchestration/routing-runtime.md` |
| Closure runtime | `.agents/orchestration/closure-runtime.md` |
| Task packet template | `.agents/task-packet.template.md` |
| Handoff template | `.agents/handoff.template.md` |
| Routing table | `.agents/routing-table.md` |
| Operating contract | `.agents/operating-contract.md` |
| System manifest | `.agents/system.manifest.json` |
