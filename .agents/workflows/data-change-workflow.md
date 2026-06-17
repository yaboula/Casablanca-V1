# Data Change Workflow

## Purpose

Handle database schema changes, migrations, indexing decisions, transaction boundaries, and data integrity rules — ensuring no schema changes are made without a plan, rollback, and downstream impact review.

## When to use

- Adding or removing tables or columns
- Changing column types, constraints, or foreign keys
- Adding or removing indexes
- Writing new migrations
- Changing relationships between entities
- Reviewing data integrity for existing schema

## When not to use

- Pure API implementation with no schema change → `backend-api-workflow.md`
- Pure frontend work → `ui-change-workflow.md`
- Full feature that includes data changes → `feature-development-workflow.md` (which internally triggers this workflow for the data portion)

## Required agents

- PM Orchestrator
- Data Agent
- Backend Agent (to update APIs after schema changes)
- QA Agent

## Optional agents

- Trust Agent (when schema involves PII, user data, payments, or audit logs)
- Ops Agent (when migration must run in CI or production deployment)

## Required rules

- `global-operating-rules.md`
- `data-integrity-policy.md`
- `conflict-matrix-policy.md` (ORM conflict: Drizzle vs Prisma)
- `security-trust-policy.md` (if PII or sensitive data is involved)
- `qa-gates-policy.md`
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| Data Agent | `drizzle-orm` |
| Backend Agent | `openapi-contract`, `trpc` |
| QA Agent | `playwright-testing`, `tdd`, `review`, `axe-core` |

On-demand (with justification):
- Data Agent: `prisma-orm` (only if project explicitly uses Prisma instead of Drizzle — never both as default)

## Inputs

- Task packet with schema scope defined
- Existing schema files
- Migration history
- Business requirements explaining why the change is needed

---

## Procedure

### Step 1 — PM Orchestrator: Task Packet

Create task packet with:
- In scope: specific tables, columns, relations, indexes
- Out of scope: API implementation (separate step), UI changes
- Constraints: ORM in use (Drizzle default), zero-downtime requirements, backwards compatibility
- Acceptance criteria: migration runs clean, rollback tested, integrity constraints valid

**ORM conflict check:** Confirm whether project uses Drizzle or Prisma. Document in task packet. Do not load both.

### Step 2 — Data Agent: Schema Analysis

Data Agent:
1. Reviews the existing schema and migration history.
2. Identifies all tables, columns, and relations affected.
3. Identifies downstream impact: which APIs consume this data?
4. Identifies integrity risks: what existing data could be affected?
5. Returns: impact analysis, list of affected APIs and consumers.

### Step 3 — Trust Agent (if activated): Sensitive Data Review

If the schema change involves PII, user data, payment data, or audit logs:
1. Trust Agent reviews the schema change for PII exposure.
2. Trust Agent confirms data retention and access control implications.
3. Trust Agent returns: sensitive data review, any additional constraints.

### Step 4 — Data Agent: Schema Design

Data Agent:
1. Loads `drizzle-orm` skill (or `prisma-orm` if explicitly approved).
2. Designs the schema change.
3. Defines integrity rules: constraints, foreign keys, not-null, check constraints.
4. Defines index strategy: which columns to index and why.
5. Writes migration (up + down).
6. Confirms migration is reversible.

**For destructive changes (DROP TABLE, DROP COLUMN, TRUNCATE):**
- Present migration risk assessment to PM Orchestrator.
- Require explicit user sign-off before proceeding.
- Do not execute without sign-off.

```txt
MIGRATION RISK ASSESSMENT

Migration: [name]
Type: destructive
Data at risk: [description]
Rollback: [down migration behavior]
Backup required: [yes / no]
Approval required: YES — explicit user sign-off
```

### Step 5 — Data Agent: Documentation

Data Agent produces schema documentation for Backend Agent:
- Table names and descriptions
- Column names, types, constraints, descriptions
- Relationships
- Index list with rationale
- Migration files (up + down)

### Step 6 — Backend Agent: API Update

Backend Agent receives schema documentation:
1. Updates or creates API contracts that depend on the schema change.
2. Updates service layer queries.
3. Ensures queries use indexes correctly.
4. Does not introduce N+1 patterns.
5. Returns: updated API contract, query changes.

### Step 7 — QA Agent: Validation

QA Agent:
1. Validates migration runs without error in dev environment.
2. Validates down migration (rollback) runs without error.
3. Checks data integrity after migration (no orphaned records, no constraint violations).
4. Reviews query patterns for N+1 or missing index usage.
5. Runs integration tests on affected API routes.
6. Returns: PASS / CONDITIONAL PASS / FAIL.

---

## Quality gates

- [ ] ORM choice confirmed and documented (Drizzle or Prisma — not both as default)
- [ ] Impact analysis complete (all affected APIs identified)
- [ ] Schema change designed before migration written
- [ ] Migration includes both up and down paths
- [ ] Destructive migrations: explicit user sign-off obtained
- [ ] Integrity constraints defined (constraints, foreign keys, not-null)
- [ ] Index strategy documented with rationale
- [ ] PII/sensitive data: Trust Agent reviewed (if applicable)
- [ ] Backend Agent APIs updated after schema change
- [ ] Migration: runs clean in dev environment
- [ ] Migration: rollback runs clean
- [ ] QA sign-off: PASS or CONDITIONAL PASS

## Escalation points

- Destructive migration → PM Orchestrator → user sign-off required before continuing
- PII or sensitive data in schema → Trust Agent (mandatory)
- Migration breaks existing API contracts → Backend Agent + PM Orchestrator for scope review
- ORM conflict detected → PM Orchestrator → resolve before Data Agent proceeds

## Required handoffs

- Data Agent handoff: impact analysis, schema documentation, migration files
- Trust Agent handoff (if activated): sensitive data review, constraints
- Backend Agent handoff: updated API contracts and queries
- QA Agent sign-off: migration validation, integration test results

## Completion criteria

- Schema documentation: ✓ complete and consumed by Backend Agent
- Migration: ✓ up and down run clean
- Destructive changes: ✓ user sign-off obtained (if applicable)
- Integrity constraints: ✓ defined and validated
- APIs: ✓ updated after schema change
- QA sign-off: ✓ PASS or CONDITIONAL PASS
- No ORM conflict: ✓ confirmed

## Output format

```txt
DATA CHANGE COMPLETE

Task ID: [id]
Tables affected: [list]
ORM used: [drizzle-orm / prisma-orm]
Migration type: [additive / destructive — if destructive: sign-off obtained]
Rollback: [tested and clean]
Indexes added: [list with rationale]
APIs affected: [list]
Trust Agent involved: [yes / no — reason]
QA status: [PASS / CONDITIONAL PASS]
Files changed: [list]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
