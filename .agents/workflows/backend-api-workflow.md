# Backend API Workflow

## Purpose

Handle backend API design, validation, service logic, and API contract changes — ensuring contracts are defined before implementation, inputs are validated server-side, and sensitive routes are reviewed by Trust Agent.

## When to use

- Adding new API endpoints or tRPC procedures
- Modifying existing API contract (request/response shape, error format)
- Implementing service layer logic
- Defining input validation rules
- Adding middleware or route-level guards

## When not to use

- Schema or database changes → `data-change-workflow.md` first, then return here
- Auth or payment logic → `trust-sensitive-change-workflow.md`
- Full feature → `feature-development-workflow.md`

## Required agents

- PM Orchestrator
- Backend Agent
- QA Agent

## Optional agents

- Data Agent (when schema must change to support new API)
- Trust Agent (when endpoint involves auth, permissions, payments, PII, or secrets)
- Frontend Agent (to consume the new API contract after it is produced)

## Required rules

- `global-operating-rules.md`
- `conflict-matrix-policy.md` (tRPC vs Fastify)
- `security-trust-policy.md` (triggered if sensitive areas touched)
- `data-integrity-policy.md` (triggered if schema changes needed)
- `qa-gates-policy.md`
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| Backend Agent | `openapi-contract`, `trpc` |
| QA Agent | `playwright-testing`, `tdd`, `review`, `axe-core` |

On-demand (with justification):
- Backend Agent: `fastify` (only if standalone microservice requires it — not as primary alongside tRPC)
- QA Agent: `vitest` (unit/integration tests at function level)

## Inputs

- Task packet with API scope defined
- Schema documentation from Data Agent (if schema changes are needed)
- Auth/permission model from Trust Agent (if protected routes are involved)

---

## Procedure

### Step 1 — PM Orchestrator: Task Packet

Create task packet with:
- In scope: specific routes, procedures, or services
- Out of scope: frontend, schema changes (delegate if needed), auth implementation
- Constraints: transport layer in use (tRPC default), error format standard, validation approach
- Acceptance criteria: contract shape, validation behavior, error handling, performance

**Conflict check:** If tRPC is active, do not also activate Fastify as primary. Document the transport choice.

### Step 2 — Data Agent (if activated): Schema First

If the API requires a schema change:
1. Pause Backend Agent — it must not proceed without schema.
2. Run `data-change-workflow.md` for the schema portion.
3. Data Agent produces schema documentation.
4. Backend Agent resumes with schema documentation in hand.

### Step 3 — Trust Agent (if activated): Security Review

If the endpoint touches auth, permissions, payments, PII, webhooks, or secrets:
1. Trust Agent defines or reviews the auth middleware for the route.
2. Trust Agent defines permission checks (OpenFGA model).
3. Trust Agent reviews any payload that contains PII.
4. Trust Agent returns: auth config, permission model, security review notes.

**Escalate if:** Payment flow is new → dedicated task packet required.

### Step 4 — Backend Agent: API Contract First

Before writing any implementation code:
1. Load `openapi-contract` skill.
2. Define the full API contract:
   - HTTP method + path (or tRPC procedure name)
   - Request schema (with validation rules)
   - Response schema (success + error shapes)
   - HTTP status codes
   - Authentication requirements
3. Document the contract for Frontend Agent consumption.

**Do not write implementation code before the contract is reviewed.**

### Step 5 — Backend Agent: Implementation

After contract is defined:
1. Load `trpc` skill (or `fastify` if explicitly required for microservice).
2. Implement route handler with input validation.
3. Implement service layer logic.
4. Apply auth middleware from Trust Agent spec.
5. Ensure error responses are consistent and honest.
6. Ensure dev/debug routes are not accessible in production.
7. Returns: implemented route files, service files, API contract document.

### Step 6 — Frontend Agent (if activated): Contract Consumption

Frontend Agent receives API contract:
1. Wires data fetching to the new contract using TanStack Query.
2. Handles all response states: loading, error, empty, success.
3. Does not replicate server-side validation.

### Step 7 — QA Agent: Validation

QA Agent:
1. Code review of route, service, and validation logic.
2. API contract validation (does implementation match the contract?).
3. Error handling check (all error cases handled, honest messages).
4. Security check (no PII in logs, no internal details in error responses).
5. Unit tests for service logic.
6. Integration tests for the route.
7. Returns: PASS / CONDITIONAL PASS / FAIL.

---

## Quality gates

- [ ] API contract defined BEFORE implementation code
- [ ] Transport layer confirmed (tRPC default; Fastify only if explicitly needed)
- [ ] tRPC and Fastify not both active as primary backend strategy
- [ ] Input validation enforced server-side
- [ ] Error responses honest and consistent
- [ ] Trust Agent involved if sensitive logic present
- [ ] Data Agent involved if schema change needed
- [ ] Dev/debug routes not exposed in production
- [ ] No N+1 queries introduced
- [ ] No PII in logs or error responses
- [ ] Tests or validation steps defined
- [ ] QA sign-off: PASS or CONDITIONAL PASS

## Escalation points

- Schema change needed → Data Agent (Backend Agent pauses, resumes after)
- Auth/permissions/payments/PII discovered → Trust Agent (stop, escalate)
- API contract shape unclear → Product Agent (clarify requirements)
- Dependency installation required (new SDK) → `dependency-proposal-workflow.md`

## Required handoffs

- Data Agent handoff (if schema involved): schema documentation, migration status
- Trust Agent handoff (if sensitive): auth middleware, permission model, security review
- Backend Agent handoff: contract document, implemented route list, files touched
- Frontend Agent handoff (if activated): data fetching implementation
- QA Agent sign-off: PASS / CONDITIONAL PASS / FAIL

## Completion criteria

- API contract: ✓ documented before code
- Implementation: ✓ matches contract
- Validation: ✓ enforced server-side
- Security: ✓ Trust Agent reviewed (if applicable)
- Schema: ✓ Data Agent handled (if applicable)
- Tests: ✓ route and service covered
- QA sign-off: ✓ PASS or CONDITIONAL PASS

## Output format

```txt
BACKEND API COMPLETE

Task ID: [id]
Routes/procedures: [list]
Transport: [tRPC / Fastify — with reason if Fastify]
Contract status: [documented]
Trust Agent involved: [yes / no — reason]
Data Agent involved: [yes / no — reason]
Tests: [unit: X / integration: X]
QA status: [PASS / CONDITIONAL PASS]
Files changed: [list]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
