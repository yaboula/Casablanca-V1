# Task Intake Runtime

## Procedure

Convert a raw user request into a structured task packet.

### 1. Classify request_type

Identify which area(s) the request touches:
- `product` (Requirements, scope, stories)
- `ux` (Flows, heuristics, states)
- `ui` (Visuals, tokens, components)
- `frontend` (React, Next.js, UI logic)
- `backend` (API, services, contracts)
- `data` (Schema, migrations, indexes)
- `trust` (Auth, permissions, payments, secrets)
- `qa` (Tests, regression, validation)
- `ops` (CI/CD, deployment, env)
- `docs` (ADRs, READMEs)
- `workflow` (Git, release)
- `mixed` (Touches multiple areas)

### 2. Assign Risk Level

Evaluate the risk of the change:
- `low`: Isolated change, no schema, no auth, no new dependencies.
- `medium`: API contract change, state management change, touches 2+ areas.
- `high`: Schema migration, integration, touches 3+ areas.
- `critical`: Auth, payments, PII, webhooks, destructive migration, secrets.

### 3. Generate Task Packet

Output the task packet using `.agents/task-packet.template.md`.
