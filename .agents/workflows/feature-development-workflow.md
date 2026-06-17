# Feature Development Workflow

## Purpose

Execute a complete feature from raw request through to a validated, documented handoff — ensuring every implementation step is scoped, quality-gated, and properly handed off between agents.

## When to use

When a new feature, capability, or significant enhancement is being built that touches more than one area of the system. This is the primary workflow for feature work.

## When not to use

- Pure bug fixes → use `bugfix-debugging-workflow.md`
- Pure UI/visual changes → use `ui-change-workflow.md`
- Pure backend API change → use `backend-api-workflow.md`
- Documentation only → use `documentation-update-workflow.md`

## Required agents

- PM Orchestrator
- Product Agent (requirements and acceptance criteria)
- QA Agent (mandatory gate before close)

## Optional agents

Activate only those whose area is touched:

- UX Agent (user flows and interaction design)
- UI Design System Agent (visual design and component specs)
- Frontend Agent (React/Next.js implementation)
- Backend Agent (API contracts and service logic)
- Data Agent (schema and migrations)
- Trust Agent (auth, permissions, payments, PII)
- Docs Agent (ADRs and documentation)
- Workflow Agent (git hygiene and release)

## Required rules

- `global-operating-rules.md`
- `task-packet-contract.md`
- `handoff-contract.md`
- `qa-gates-policy.md`
- `agent-boundaries.md`
- `security-trust-policy.md` (if trust areas are touched)
- `data-integrity-policy.md` (if data areas are touched)
- `conflict-matrix-policy.md`

## Required skills

Skills are loaded per agent (see `agents.manifest.json` for defaults). No skills are loaded beyond what each activated agent requires.

## Inputs

- Raw user request or product brief
- Existing relevant files (if feature builds on existing code)
- Any prior handoffs or context from previous tasks

---

## Procedure

### Step 1 — PM Orchestrator: Task Intake

Run `task-intake-workflow.md` to:
- Classify request type(s)
- Assess risk level
- Identify required and optional agents
- Create task packet

### Step 2 — PM Orchestrator: Agent Routing

Run `agent-routing-workflow.md` to:
- Select minimum agent set
- Determine activation order
- Validate no conflicts

### Step 3 — Product Agent: Requirements Clarification

Product Agent receives task packet and:
- Clarifies requirements using `to-prd` skill
- Decomposes into issues using `to-issues` skill
- Defines clear acceptance criteria
- Returns: refined requirements, issue list, acceptance criteria

**Escalate if:** Requirements are contradictory or scope is unclear → PM Orchestrator

### Step 4 — UX Agent (if activated): Flow Design

UX Agent receives task packet and Product Agent handoff:
- Maps user flows
- Defines all user states (loading, error, empty, success)
- Applies heuristic checklist
- Returns: flow documentation, state matrix, form specs

**Escalate if:** Flow requires visual design decisions → UI Design System Agent

### Step 5 — UI Design System Agent (if activated): Component Specs

UI Design System Agent receives task packet and UX Agent handoff:
- Loads `design-taste-frontend` (default)
- Loads one optional style mode skill only if explicitly instructed
- Produces component visual specifications
- Defines tokens used
- Returns: component spec, token references, responsive behavior

**Escalate if:** Multiple taste skills requested → select one, document choice

### Step 6 — Data Agent (if activated): Schema and Migrations

Data Agent receives task packet:
- Reviews or defines schema changes
- Writes migration (up + down)
- Defines indexes and constraints
- Returns: schema documentation, migration files

**Escalate if:** Migration is destructive → explicit user sign-off required

### Step 7 — Trust Agent (if activated): Security and Auth

Trust Agent receives task packet:
- Reviews auth, permission, and payment requirements
- Applies OWASP checklist
- Defines or reviews access control model
- Returns: auth config, permission model, security review

**Escalate if:** Payment flow is new → dedicated task packet required

### Step 8 — Backend Agent (if activated): API Contracts and Services

Backend Agent receives task packet, Data Agent handoff, Trust Agent handoff:
- Defines OpenAPI contract before writing code
- Implements routes and service logic
- Validates inputs server-side
- Returns: API contract, implemented services, API documentation

**Escalate if:** API touches auth or PII → Trust Agent must be involved

### Step 9 — Frontend Agent (if activated): Implementation

Frontend Agent receives task packet, UI Agent spec, Backend Agent contract:
- Implements components following specs
- Wires data fetching to API contract
- Handles all user states
- Returns: implemented components, responsive validation notes

**Escalate if:** Component spec is missing → UI Design System Agent first

### Step 10 — QA Agent: Validation Gate

QA Agent receives all implementation handoffs:
- Runs `qa-validation-workflow.md`
- Code review, E2E tests, accessibility check
- Validates all acceptance criteria
- Returns: PASS / CONDITIONAL PASS / FAIL with specific reasons

**If FAIL:** Return to responsible implementation agent with failure details.

### Step 11 — Docs Agent (if activated): Documentation

Docs Agent receives all handoffs:
- Writes or updates ADR for any architectural decision
- Updates relevant documentation
- Returns: ADR, updated docs

### Step 12 — PM Orchestrator: Integration and Closure

PM Orchestrator:
- Collects all handoffs
- Confirms QA sign-off is PASS or CONDITIONAL PASS
- Confirms all acceptance criteria are met
- Confirms no unresolved blocking rules
- Produces final workflow completion summary

---

## Quality gates

- [ ] Task packet complete before implementation starts
- [ ] Acceptance criteria defined and explicit
- [ ] No agent exceeded its boundary
- [ ] Trust Agent involved if sensitive areas were touched
- [ ] Data Agent involved if schema changes were needed
- [ ] QA Agent produced PASS or CONDITIONAL PASS
- [ ] All handoffs documented
- [ ] No blocking rules violated

## Escalation points

- Requirements ambiguous → Product Agent → PM Orchestrator
- Schema change discovered mid-feature → Data Agent (stop, escalate, resume)
- Auth/payment logic discovered → Trust Agent (stop, escalate, resume)
- Component spec missing → UI Design System Agent (Frontend Agent waits)
- QA fails → responsible agent (not closed until resolved)

## Required handoffs

- Product Agent handoff (requirements + acceptance criteria)
- UX Agent handoff (if activated)
- UI Design System Agent handoff (if activated)
- Data Agent handoff (if activated)
- Trust Agent handoff (if activated)
- Backend Agent handoff (if activated)
- Frontend Agent handoff (if activated)
- QA Agent sign-off
- Docs Agent handoff (if activated)
- PM Orchestrator integration summary

## Completion criteria

- All acceptance criteria: ✓ met and verified by QA
- QA sign-off: ✓ PASS or CONDITIONAL PASS
- Blocking rules: ✓ none violated
- Handoffs: ✓ all complete
- Files touched: ✓ all documented
- Risks: ✓ all documented in handoffs

## Output format

```txt
FEATURE DEVELOPMENT COMPLETE

Task ID: [id]
Feature: [description]
Agents activated: [list]
Risk level: [assigned]
QA status: [PASS / CONDITIONAL PASS]
Blocking rules triggered: [list or none]
Conditions (if conditional): [list]
Files changed: [count]
Handoffs: [list of agents + status]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
