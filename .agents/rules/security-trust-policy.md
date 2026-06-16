# Security and Trust Policy

**Severity:** blocking  
**Applies to:** all agents — Trust Agent, Backend Agent, Data Agent, Ops Agent are primary; all others are secondary  
**Version:** 1.0

---

This is a **blocking rule**. Any task that touches a trust boundary must involve the Trust Agent. No other agent may independently implement auth, permissions, payments, or sensitive data handling.

---

## Trust Agent Is Mandatory When the Task Touches:

| Area | Examples |
|---|---|
| **Authentication** | Login, logout, session creation, OAuth, magic links, JWT |
| **Sessions** | Session storage, session expiry, session invalidation |
| **Permissions** | Role checks, resource ownership, admin gates, operator gates |
| **Authorization** | Route protection, middleware, API guards, RLS policies |
| **Payments** | Stripe charge, payment intent, refund, subscription, checkout |
| **Webhooks** | Stripe webhooks, any inbound webhook handling payment or auth events |
| **Secrets** | API keys, private tokens, environment credentials |
| **Sensitive uploads** | Driver documents, ID verification, payment method documents |
| **PII (Personal Identifiable Information)** | Name, email, phone, address, passport, payment details |
| **Audit logs** | Admin action logs, financial transaction records |
| **Admin actions** | Any action taken in the admin or operator panel that affects financial or user data |

---

## Specific Rules

### Authentication

- Default auth provider for this project: **Auth.js (authjs)**
- `better-auth` is an on-demand alternative — it must not be loaded as default alongside `authjs`
- Auth middleware must be applied to all protected routes — never trust frontend guards alone
- Session tokens must be validated server-side on every protected request
- Never implement "fake" auth that silently passes in any environment (including demo mode)

### Permissions

- Fine-grained authorization uses **OpenFGA**
- Role and permission checks must be enforced server-side
- Do not create implicit permissions (if a permission is not explicitly granted, it is denied)
- Admin and operator routes must have role checks at the middleware level, not just UI level

### Payments

- Payment flows use **Stripe**
- No payment flow may be implemented without a dedicated, explicit task packet approved by the user
- All Stripe webhook handlers must:
  - Validate the Stripe signature on every incoming request
  - Implement idempotency (same event ID must not be processed twice)
  - Handle async payment states (payment_intent.created, succeeded, failed, etc.)
- Never store raw card data — always use Stripe's tokenization
- Payment API keys must exist only in environment variables, never in committed code

### Secrets

- No secret (API key, token, password, private key) may appear in any committed file
- Secrets belong in `.env.local` (git-ignored) or a secrets manager
- Environment variable names must be documented in `.env.example` with placeholder values
- Ops Agent manages secrets configuration in CI/CD — Trust Agent defines what secrets are needed

### Demo Mode

- Demo bypasses must be:
  - Behind an explicit `DEMO_MODE=true` environment variable
  - Impossible to activate in a production build (guarded by build-time flag)
  - Clearly labeled in code with a comment: `// DEMO MODE ONLY — remove before production`
- Demo mode must never silently elevate permissions or skip payment validation

### Sensitive Data in Responses

- API responses must never include sensitive fields not required by the consumer
- PII fields must be stripped from logs (never log email, phone, passport numbers, card details)
- Error messages must not reveal internal implementation details or stack traces to end users

---

## Escalation Trigger

If any agent encounters any of the areas listed above during a task that did not include Trust Agent in its task packet, the agent **must stop and escalate** to PM Orchestrator immediately.

The agent must not proceed with implementing the sensitive area independently.

```txt
ESCALATION REQUIRED

Reason: Task involves [auth / permissions / payments / PII / secrets / ...]
Current agent: [agent name]
Action: Pausing implementation. Escalating to PM Orchestrator for Trust Agent involvement.
```
