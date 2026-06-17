# Trust-Sensitive Change Workflow

## Purpose

Handle all tasks touching auth, permissions, security, payments, secrets, PII, webhooks, and sensitive admin actions — with Trust Agent as the mandatory gatekeeper and explicit blocking conditions for the most dangerous operations.

## When to use

Any time a task touches:
- Authentication (login, logout, sessions, OAuth, magic links, JWT)
- Authorization (roles, permissions, resource ownership, admin gates)
- Payments (Stripe charges, payment intents, refunds, subscriptions)
- Webhooks (inbound event handlers, especially payment or auth events)
- Secrets (API keys, tokens, private credentials)
- PII (name, email, phone, passport, payment details, address)
- Sensitive uploads (ID documents, verification files)
- Audit logs (admin action logs, financial records)
- Admin or operator actions affecting financial or user data

## When not to use

Tasks that have been confirmed to not touch any trust boundary. If in doubt, treat as trust-sensitive.

## Required agents

- PM Orchestrator
- Trust Agent
- QA Agent

## Optional agents

- Backend Agent (API implementation after Trust Agent defines auth requirements)
- Data Agent (if schema changes for user/session/payment data are needed)
- Ops Agent (if environment variables or secrets management configuration is required)
- Docs Agent (if ADR is needed for auth/permission model choice)

## Required rules

- `global-operating-rules.md`
- `security-trust-policy.md`
- `data-integrity-policy.md` (if schema involved)
- `dependency-installation-policy.md` (no SDK without approval)
- `conflict-matrix-policy.md` (authjs vs better-auth)
- `qa-gates-policy.md`
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| Trust Agent | `authjs`, `openfga`, `owasp-cheat-sheets`, `stripe` |
| QA Agent | `playwright-testing`, `tdd`, `review`, `axe-core` |

On-demand (with justification):
- Trust Agent: `better-auth` (only if project explicitly uses it instead of Auth.js — never both as default)
- Trust Agent: `owasp-zap` (automated security scanning — explicitly requested)

## Inputs

- Task packet specifying the sensitive area clearly
- Existing auth configuration (if modifying)
- Current permission model (if modifying)
- Payment flow description (if payment work is involved)

---

## Procedure

### Step 1 — PM Orchestrator: Task Packet

Create task packet with:
- In scope: specific sensitive area (auth / payments / PII / webhooks / etc.)
- Out of scope: frontend UI (delegate to Frontend Agent after Trust Agent defines requirements)
- Constraints: no real secrets in code, no silent demo bypass, no self-signed approval
- Acceptance criteria: auth works, permissions enforced, no bypass possible, payment safe

**Auth conflict check:** Confirm whether project uses Auth.js or Better Auth. Document. Never load both.

### Step 2 — Trust Agent: Threat Assessment

Trust Agent:
1. Identifies every trust boundary the task touches.
2. Identifies attack vectors relevant to the change (OWASP Top 10 reference via `owasp-cheat-sheets`).
3. Identifies data sensitivity level (PII / payment / credentials).
4. Returns: threat assessment, list of trust boundaries, risk classification.

### Step 3 — Data Agent (if activated): Schema for Sensitive Data

If the task requires schema changes for user tables, session tables, payment records, or audit logs:
1. Run `data-change-workflow.md` for the schema portion.
2. Trust Agent reviews schema for PII field exposure and access control.
3. Data Agent produces schema documentation.

### Step 4 — Trust Agent: Implementation

#### Authentication tasks:
1. Load `authjs` skill (default) or `better-auth` (if explicitly chosen).
2. Configure session management and token validation.
3. Apply auth middleware to all protected routes.
4. Verify demo bypass is guarded and cannot leak to production.

#### Permission tasks:
1. Load `openfga` skill.
2. Define or update the permission model.
3. Implement permission checks server-side.
4. Verify no implicit permissions are created.

#### Payment tasks (critical — requires dedicated task packet):
1. Load `stripe` skill.
2. Implement payment flow following PCI-safe patterns.
3. Verify webhook handler validates Stripe signature on every request.
4. Verify idempotency is implemented (same event ID not processed twice).
5. Verify all payment states are handled (pending, succeeded, failed, refunded).
6. Verify no raw card data is stored.

#### Security hardening:
1. Apply OWASP cheat sheet checklist to all affected code paths.
2. Verify secrets exist only in environment variables.
3. Verify PII is not logged.
4. Verify error responses do not expose internal details.

### Step 5 — Backend Agent (if activated): Route Integration

Backend Agent receives Trust Agent output:
1. Applies auth middleware to new or modified routes.
2. Enforces permission checks at route level.
3. Ensures validation strips or rejects unexpected sensitive fields.

### Step 6 — Ops Agent (if activated): Secrets Configuration

Ops Agent:
1. Documents required environment variables.
2. Updates `.env.example` with placeholder values.
3. Configures secrets in CI/CD pipeline.
4. Verifies no secrets appear in logs.

### Step 7 — QA Agent: Security Validation

QA Agent:
1. Reviews auth flow implementation.
2. Tests permission boundary: unauthenticated access denied, wrong role denied, correct role granted.
3. Tests payment flow (test mode): success, failure, webhook handling.
4. Verifies demo bypass cannot be activated in production build.
5. Verifies no secrets in any committed file.
6. Verifies PII is not in logs or error responses.
7. Returns: PASS / CONDITIONAL PASS / FAIL.

---

## Blocking conditions

These conditions **block the workflow entirely** until resolved:

| Condition | Action |
|---|---|
| Payment logic proposed without dedicated task packet | STOP — require dedicated task packet |
| Webhook handler without signature validation | STOP — not acceptable to proceed |
| Payment mutation without idempotency plan | STOP — must define idempotency before coding |
| Auth change without session/permission model review | STOP — Trust Agent must review first |
| PII field exposure without explicit scope approval | STOP — escalate to PM Orchestrator |
| Real secret in code (even in draft) | STOP — remove immediately, audit history |
| Auth.js and Better Auth both active | STOP — conflict must be resolved |

## Quality gates

- [ ] Auth conflict check: one provider only (authjs or better-auth)
- [ ] Auth middleware applied to all protected routes
- [ ] Permission checks server-side (not just UI-level)
- [ ] No implicit permissions
- [ ] Payment webhook: signature validated
- [ ] Payment webhook: idempotency implemented
- [ ] All payment states handled
- [ ] No raw card data stored
- [ ] Secrets in environment variables only
- [ ] PII not in logs or error responses
- [ ] Demo bypass guarded, cannot leak to production
- [ ] OWASP checklist applied
- [ ] QA sign-off: PASS or CONDITIONAL PASS

## Escalation points

- New payment flow discovered → stop, require dedicated task packet from PM Orchestrator
- Secret found in code → stop immediately, treat as P0
- Schema change needed for user/payment data → Data Agent (mandatory)
- Auth or permission model needs architectural decision → Docs Agent for ADR

## Required handoffs

- Trust Agent handoff: threat assessment, auth config, permission model, OWASP review, payment safety review
- Data Agent handoff (if activated): schema documentation
- Backend Agent handoff (if activated): route integration, middleware application
- Ops Agent handoff (if activated): env var documentation, secrets config
- QA Agent sign-off: security validation results, PASS / CONDITIONAL PASS / FAIL

## Completion criteria

- Trust boundaries: ✓ all identified and addressed
- Auth: ✓ middleware applied server-side
- Permissions: ✓ server-side checks enforced
- Payments: ✓ signature + idempotency + states (if applicable)
- Secrets: ✓ environment variables only
- PII: ✓ not exposed in logs or responses
- QA sign-off: ✓ PASS or CONDITIONAL PASS

## Output format

```txt
TRUST-SENSITIVE CHANGE COMPLETE

Task ID: [id]
Areas touched: [auth / permissions / payments / PII / webhooks / secrets / admin]
Auth provider: [authjs / better-auth — confirmed choice]
OWASP checklist: [applied — no violations / violations found: list]
Payment safety: [N/A / signature validated / idempotency: yes / states: covered]
Secrets in code: [none confirmed]
PII in logs: [none confirmed]
QA status: [PASS / CONDITIONAL PASS]
Files changed: [list]
Completion: [COMPLETE / COMPLETE WITH CONDITIONS]
```
