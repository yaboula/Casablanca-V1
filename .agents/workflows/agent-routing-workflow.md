# Agent Routing Workflow

## Purpose

Select the minimum necessary agents for a given task and determine their activation order. Prevent over-activation of agents and ensure that blocking-rule agents (Trust, Data, QA) are included when required.

## When to use

After `task-intake-workflow` creates the task packet. PM Orchestrator runs this workflow to finalize agent selection before routing.

## When not to use

Not a standalone workflow — it is always run inside another workflow, after the task packet exists.

## Required agents

- PM Orchestrator

## Optional agents

None — PM Orchestrator uses this to select others.

## Required rules

- `global-operating-rules.md`
- `agent-boundaries.md`
- `conflict-matrix-policy.md`
- `security-trust-policy.md`
- `data-integrity-policy.md`
- `qa-gates-policy.md`

## Required skills

- PM Orchestrator defaults: `to-prd`, `to-issues`

## Inputs

- Completed task packet (from `task-intake-workflow`)
- Risk level assigned
- Request type(s) classified

---

## Routing Table

Use this table to select agents. Start with the primary agent for the request type, then add mandatory secondary agents based on what the task touches.

### Primary routing by request type

| Request Type | Primary Agent | Notes |
|---|---|---|
| `product` | Product Agent | Requirements, scope, user stories |
| `ux` | UX Agent | Flows, IA, heuristics, states |
| `ui` | UI Design System Agent | Tokens, components, visual direction |
| `frontend` | Frontend Agent | React, Next.js, components, data fetching |
| `backend` | Backend Agent | API, services, validation, contracts |
| `data` | Data Agent | Schema, migrations, indexes |
| `trust` | Trust Agent | Auth, permissions, payments, secrets, PII |
| `qa` | QA Agent | Tests, review, accessibility |
| `ops` | Ops Agent | CI/CD, deployment, observability |
| `docs` | Docs Agent | ADRs, documentation, handoffs |
| `workflow` | Workflow Agent | Git, PRs, releases, changesets |

### Mandatory secondary agents (add these regardless of primary selection)

| Condition | Mandatory secondary agent |
|---|---|
| Any implementation task | QA Agent (gate before close) |
| Task touches auth / sessions / permissions | Trust Agent |
| Task touches payments / webhooks | Trust Agent |
| Task touches secrets / PII / admin actions | Trust Agent |
| Task requires schema changes | Data Agent |
| Task requires new migrations | Data Agent |
| Schema change → backend must consume it | Backend Agent (after Data Agent) |
| Significant architectural decision | Docs Agent (ADR) |

---

## Standard Routing Combinations

### Copy-only / documentation task
```txt
Docs Agent → (Workflow Agent if git hygiene needed)
```
QA: not required

### UI visual change only
```txt
UI Design System Agent → Frontend Agent → QA Agent
```
Optional: UX Agent (if flow is unclear)

### Frontend feature (no backend change)
```txt
Frontend Agent → QA Agent
```
Optional: UI Design System Agent (if new components), UX Agent (if flow undefined)

### Backend API change (no schema, no auth)
```txt
Backend Agent → QA Agent
```
Optional: Frontend Agent (to consume new contract)

### Backend API change with schema
```txt
Data Agent → Backend Agent → QA Agent
```
Optional: Frontend Agent (to consume), Trust Agent (if sensitive data)

### Auth / security / payment change
```txt
Trust Agent → Backend Agent → QA Agent
```
Optional: Data Agent (if schema involved), Ops Agent (if env vars or secrets management involved)

### Full feature (cross-cutting)
```txt
Product Agent → UX Agent → UI Design System Agent → Frontend Agent → Backend Agent → Data Agent → Trust Agent → QA Agent → Docs Agent → Workflow Agent
```
PM Orchestrator activates only the subset needed — not all of these by default.

### Release
```txt
QA Agent → Ops Agent → Workflow Agent
```
Optional: Docs Agent (release notes), Trust Agent (if security-sensitive changes in release)

### Bug fix
```txt
[Relevant specialist agent] → QA Agent
```
PM Orchestrator determines which specialist based on the failure area.

---

## Procedure

### Step 1 — Read the task packet

Confirm risk level, request types, and blocking rules already identified by `task-intake-workflow`.

### Step 2 — Select primary agent

Use the routing table above. Select the single agent whose domain matches the primary request type.

### Step 3 — Add mandatory secondary agents

Check conditions for mandatory secondary agents. Add them to the active agent list.

### Step 4 — Add optional agents if needed

Consider optional agents only if the task packet scope explicitly requires them. Do not add agents "just in case."

### Step 5 — Determine activation order

Agents with dependencies must be sequenced:
- Data Agent before Backend Agent (schema must exist before API is built)
- Trust Agent before or alongside Backend Agent (auth middleware must be defined before routes are finalized)
- UI Design System Agent before Frontend Agent (component spec must exist before implementation)
- All implementation agents before QA Agent
- QA Agent before Workflow Agent (QA must pass before release steps)

### Step 6 — Validate no conflicts

Check the selected skill set for conflicts (see `conflict-matrix-policy.md`):
- Is Drizzle AND Prisma both selected? → Select one.
- Is Auth.js AND Better Auth both selected? → Select one.
- Is tRPC AND Fastify both as primary? → Select one.

### Step 7 — Confirm agent selection in task packet

Update the task packet's `Agents Assigned` field with the final list and order.

---

## Quality gates

- [ ] Primary agent correctly identified for request type
- [ ] All mandatory secondary agents added
- [ ] Activation order respects dependencies
- [ ] No conflicting skill combinations
- [ ] Agent list is minimal (not exhaustive)

## Escalation points

- If two request types require agents that conflict → escalate to user for scope clarification
- If a needed agent is unavailable or its skill is blocked → document and escalate to PM Orchestrator

## Required handoffs

- PM Orchestrator produces: final agent list with activation order (appended to task packet)

## Completion criteria

- Task packet's `Agents Assigned` field is complete
- Activation order is defined
- No conflicts in selected skills
- Mandatory secondary agents confirmed

## Output format

```txt
ROUTING COMPLETE

Task ID: [id]
Primary agent: [agent]
Secondary agents (mandatory): [list]
Optional agents (activated): [list]
Activation order: [ordered list]
Conflict checks: [passed / conflicts resolved: describe]
Next step: [first agent in activation order receives task packet]
```
