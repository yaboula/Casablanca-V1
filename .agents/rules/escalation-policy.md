# Escalation Policy

**Severity:** required  
**Applies to:** all agents, PM Orchestrator  
**Version:** 1.0

---

Escalation is the mechanism by which agents stay within their boundaries while ensuring that work requiring other expertise is properly handled. Escalation is not failure — it is correct system behavior.

**When in doubt, escalate. Never expand scope silently.**

---

## Escalation Trigger Conditions

### Escalate to PM Orchestrator when:
- The task scope is ambiguous or contradictory
- The task requires work in multiple agent domains that were not anticipated in the task packet
- A conflict exists between agents (e.g., two agents received contradictory instructions)
- A task is discovered to be out of the receiving agent's responsibility
- A blocking rule cannot be satisfied within the current task packet's constraints
- The user's intent cannot be determined from the task packet
- A previously completed task produced unexpected side effects that require coordination

### Escalate to Trust Agent when:
- Any of the following are encountered, even if not originally in scope:
  - Authentication or session logic
  - Permission checks or role enforcement
  - Payment processing or Stripe webhooks
  - Secret management or API key handling
  - PII handling or sensitive user data
  - Admin-level actions affecting financial data
  - Audit log requirements
- The Trust Agent was not in the original task packet but the task has grown to require it

### Escalate to Data Agent when:
- Schema changes are needed to complete the task
- A new migration is required
- Data integrity constraints need to be defined
- Query performance requires indexing decisions
- The task involves relationships between entities not yet defined in the schema

### Escalate to UI Design System Agent when:
- The task requires changes to design tokens
- New reusable components are needed
- The visual direction is unclear or conflicting
- The task involves introducing a new style mode

### Escalate to QA Agent when:
- Any implementation task is ready to close (always — this is a gate, not an escalation in the negative sense)
- Accessibility concerns are discovered during implementation
- A regression is suspected but not confirmed
- Test coverage is insufficient and the agent cannot self-assess the risk

### Escalate to Ops Agent when:
- CI/CD pipeline changes are needed to support the task
- Environment variable changes are required
- Deployment configuration needs updating
- Observability instrumentation needs to be added

### Escalate to Docs Agent when:
- The task produces an architectural decision that needs to be recorded as an ADR
- A handoff document needs to be formalized for cross-session continuity
- API documentation needs to be updated for external or internal consumers

---

## Escalation Format

When an agent escalates, it must produce an escalation notice in this format:

```txt
ESCALATION NOTICE

From: [escalating agent name]
To: [PM Orchestrator / specific agent]
Task: [task ID and description]

Reason for escalation:
[Clear statement of why the agent cannot proceed without escalation]

Discovered issue:
[What was found that triggered this escalation]

Current state:
[What has been done so far — so the receiving agent has context]

What is needed:
[What the escalating agent needs from the receiving agent to proceed]

Risk if not escalated:
[What could go wrong if work proceeded without escalation]

Files in current state:
[Any files that have been partially modified — so they can be reviewed]
```

---

## PM Orchestrator Escalation Response

When PM Orchestrator receives an escalation:
1. Acknowledge the escalation in the audit trail.
2. Determine whether the task packet needs to be updated (scope extension, additional agents).
3. Route the task (or a sub-task) to the appropriate specialist agent.
4. Communicate back to the escalating agent what it is authorized to do next.
5. If the escalation involves a user decision (e.g., ORM conflict, dependency approval), surface it to the user before proceeding.

---

## Hard Escalation Rules

These are non-negotiable:

| Condition | Escalation target | Action |
|---|---|---|
| Auth/payments/PII encountered | Trust Agent | STOP. Do not implement. Escalate. |
| Schema change needed | Data Agent | STOP. Do not write migrations independently. Escalate. |
| Dependency installation needed | PM Orchestrator → User | STOP. Present proposal. Wait for approval. |
| Implementation task ready to close | QA Agent | Always route. Non-negotiable gate. |
| Scope is ambiguous | PM Orchestrator | STOP. Do not assume. Escalate. |
| Blocked skill is needed | PM Orchestrator → User | STOP. Do not work around the block. Escalate. |

---

## What Escalation Is Not

- Escalation is not an excuse to hand off unfinished work without context.
- Escalation is not optional when a hard escalation rule is triggered.
- Escalation is not a sign of agent failure — it is correct and expected behavior.
- Escalation does not mean the task is abandoned — the escalating agent retains responsibility until the escalation is resolved and work resumes.
