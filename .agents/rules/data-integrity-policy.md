# Data Integrity Policy

**Severity:** blocking  
**Applies to:** Data Agent (primary), Backend Agent, Trust Agent  
**Version:** 1.0

---

This is a **blocking rule**. Any task that requires schema changes, migrations, or data model decisions must involve the Data Agent. No other agent may define or modify the database schema independently.

---

## Data Agent Is Mandatory When the Task Involves:

- Creating new database tables
- Adding, removing, or renaming columns
- Changing column types or constraints
- Adding or removing foreign keys
- Adding or removing indexes
- Writing new migration files
- Running or reviewing existing migrations
- Defining transaction boundaries
- Defining data access patterns that require schema optimization

---

## ORM Policy

### Default ORM: Drizzle ORM (`drizzle-orm`)

This project uses Drizzle ORM as the default. Drizzle is loaded as the default skill for the Data Agent.

### On-demand alternative: Prisma ORM (`prisma-orm`)

Prisma may be used on-demand **only** if the project explicitly migrates to Prisma or if a legacy subsystem requires it.

### Conflict Rule — Blocking

**`drizzle-orm` and `prisma-orm` must never be loaded as defaults simultaneously.**

- If the project uses Drizzle, `prisma-orm` is on-demand only.
- If the project explicitly migrates to Prisma, `drizzle-orm` becomes on-demand only and the migration must be documented in an ADR (Docs Agent).
- The ORM choice must be declared once and respected across all Data Agent tasks.

---

## Migration Rules

### All migrations must:
1. Have both an **up** migration and a **down** migration (reversible).
2. Be named with a timestamp prefix and a descriptive name (e.g., `0001_add_reservation_status_column`).
3. Be reviewed by the Data Agent before execution.
4. Include comments explaining the reason for the change.

### Destructive migrations (requiring explicit approval):

The following migration types require explicit user sign-off before they may be executed:

```txt
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE (without WHERE clause)
ALTER COLUMN (changing type in a way that loses data)
```

For these, the Data Agent must present a **migration risk assessment**:

```txt
MIGRATION RISK ASSESSMENT

Migration: [migration name]
Type: [destructive]
Data at risk: [what data could be lost]
Production safety: [is there a safe rollout strategy?]
Rollback: [what the down migration does]
Backup required: [yes / no]
Explicit approval required: YES
```

---

## Schema Design Rules

### Integrity Rules (always required):
- All foreign keys must have explicit constraints defined (not just application-level enforcement)
- Non-nullable fields must have explicit `NOT NULL` constraints
- Use `CHECK` constraints for enum-like columns where the ORM supports it
- Timestamps (`created_at`, `updated_at`) must be present on all user-facing tables

### Indexing Rules:
- Index all foreign key columns
- Index all columns used in frequent `WHERE` clauses
- Index all columns used in `ORDER BY` on large tables
- Avoid over-indexing — document each index with a rationale

### Relationship Rules:
- No assumed relationships between entities that are not defined in the PRD or requirements
- Many-to-many relationships must use explicit junction tables (no comma-separated fields)
- Cascading deletes must be explicitly documented and approved — never default

---

## Schema Documentation

After any schema change, the Data Agent must produce or update schema documentation for the Backend Agent. This documentation must include:

- Table names and descriptions
- Column names, types, constraints, and descriptions
- Relationship diagram (text form is acceptable)
- Index list with rationale

---

## Violation Response

If any agent other than the Data Agent proposes or executes a schema change:
1. The change must be stopped immediately.
2. PM Orchestrator must be notified.
3. The Data Agent must review the change before it is applied.
4. The handoff must document the violation.
