# Task Intake Workflow

## Purpose

Convert a raw user request into a structured task packet — the authoritative input for all subsequent workflow steps. No implementation may begin before a task packet exists.

## When to use

At the start of every non-trivial task. Triggered by PM Orchestrator as the first step of any workflow.

## When not to use

Genuinely trivial single-file changes with no dependencies, no schema changes, no auth logic, and minimal risk. Even then, a brief handoff is still required.

## Required agents

- PM Orchestrator

## Optional agents

- Product Agent (when the request involves requirements clarification)

## Required rules

- `global-operating-rules.md`
- `task-packet-contract.md`
- `agent-boundaries.md`
- `escalation-policy.md`

## Required skills

- `to-prd` (PM Orchestrator default)
- `to-issues` (PM Orchestrator default)

## Inputs

- Raw user request (text, conversation, or linked issue)
- Any referenced files or existing context

---

## Procedure

### Step 1 — Read and understand the request

PM Orchestrator reads the full request. If the request is ambiguous or contradictory, PM Orchestrator must seek clarification before proceeding.

Do not begin classification until the intent is clear.

### Step 2 — Classify request type

Determine which area(s) of the system are touched:

| Type | Signal words |
|---|---|
| `product` | PRD, requirements, scope, user stories, acceptance criteria |
| `ux` | user flow, journey, IA, heuristics, states, error recovery |
| `ui` | component, design system, tokens, visual, layout, styling |
| `frontend` | React, Next.js, App Router, data fetching, form, page |
| `backend` | API, endpoint, route, validation, service, contract |
| `data` | schema, table, column, migration, index, relation |
| `trust` | auth, login, session, permission, role, payment, webhook, PII, secret |
| `qa` | test, regression, accessibility, review, validation |
| `ops` | CI/CD, deployment, environment, pipeline, observability |
| `docs` | ADR, documentation, README, handoff, knowledge |
| `workflow` | git, PR, release, changeset, branch, version |

A request may touch multiple types. Each type maps to one or more agents (see `agent-routing-workflow.md`).

### Step 3 — Detect risk level

| Risk level | Conditions |
|---|---|
| `low` | No schema change, no auth/payment, no new dependencies, single area |
| `medium` | API contract change, new component, state management change, 2+ areas |
| `high` | Schema migration, significant auth change, new integration, 3+ areas |
| `critical` | Payment flow, webhook handling, PII access, admin privilege change, destructive migration |

### Step 4 — Identify blocking rules triggered

Check which rules from `.agents/rules/rules.manifest.json` are triggered by this request:

| Condition | Blocking rule triggered |
|---|---|
| Any dependency installation needed | `dependency-installation-policy` |
| Auth, payments, PII, secrets touched | `security-trust-policy` |
| Schema or migration changes needed | `data-integrity-policy` |
| Any implementation work | `qa-gates-policy` |
| Conflicting tools potentially active | `conflict-matrix-policy` |

### Step 5 — Identify required agents

Use `agent-routing-workflow.md` to select minimum necessary agents. Document:
- Primary agents (required)
- Secondary agents (required for blocking rules)
- Optional agents (may be needed depending on scope)

### Step 6 — Identify skills to load

For each selected agent, list:
- Default skills (auto-loaded)
- On-demand skills (with justification)

Do not list skills not in `.agents/skills/manifest.json`.

### Step 7 — Create task packet

Build the task packet following `.agents/rules/task-packet-contract.md`. Include:
- Task ID
- Objective (one sentence)
- Request source
- Scope (in + out)
- Agents assigned
- Skills to load
- Relevant files
- Constraints (including applicable rule references)
- Acceptance criteria
- Risk level
- Required output
- Escalation conditions

### Step 8 — Do not execute implementation

The task packet is the output. PM Orchestrator does not begin implementation in this workflow. After creating the task packet, PM Orchestrator routes to the appropriate workflow (`feature-development-workflow`, `backend-api-workflow`, etc.).

---

## Quality gates

- [ ] Request intent is unambiguous
- [ ] Request type classified (one or more types)
- [ ] Risk level determined
- [ ] Blocking rules identified
- [ ] Minimum agents selected
- [ ] Task packet complete and follows `task-packet-contract.md`
- [ ] No implementation started

## Escalation points

- If intent is ambiguous → ask for clarification before classifying
- If the request touches multiple types that conflict → route to Product Agent for scope clarification
- If the request requires a skill not in the manifest → flag as missing skill, do not proceed

## Required handoffs

- PM Orchestrator produces: task packet (structured document)
- PM Orchestrator produces: agent routing recommendation
- PM Orchestrator produces: list of blocking rules triggered

## Completion criteria

Task intake is complete when:
- Task packet exists and is complete
- Risk level is assigned
- Required agents are identified
- Blocking rules are documented
- The appropriate next workflow is selected

## Output format

```txt
TASK INTAKE COMPLETE

Task ID: [id]
Request type(s): [list]
Risk level: [low / medium / high / critical]
Blocking rules triggered: [list or none]
Required agents: [list]
Optional agents: [list]
Next workflow: [workflow name]
Task packet: [attached / linked]
```
