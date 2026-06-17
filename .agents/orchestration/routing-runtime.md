# Routing Runtime

## Procedure

Define the minimal agent execution path based on the task packet.

### 1. Select Primary Agent

Prefer **1 primary agent + QA** when implementation is required. Use `.agents/routing-table.md` to map the request type to the primary agent.

### 2. Add Mandatory Specialists

Add specialists only when triggered by blocking rules or explicit scope:
- **Trust Agent**: Mandatory if auth, sessions, permissions, payments, PII, webhooks, or secrets are touched.
- **Data Agent**: Mandatory if schema, migrations, or data integrity rules change.
- **QA Agent**: Mandatory if any implementation (code/config) occurs.

### 3. Add Optional Specialists

Add only if the deliverable explicitly requires them:
- **Docs Agent**: If ADRs, READMEs, or formal handoffs are requested.
- **Workflow Agent**: If git operations, PRs, or releases are needed.

### 4. Sequence Activation

Define the order of execution to respect dependencies:
1. Product / UX / UI (Definition)
2. Data / Trust (Foundations & Constraints)
3. Backend (Contracts & Services)
4. Frontend (Consumption & UI)
5. QA (Validation)
6. Docs / Workflow (Closure & Release)
