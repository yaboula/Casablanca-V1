# Global Operating Rules

**Severity:** required  
**Applies to:** all agents  
**Version:** 1.0

---

These rules govern the baseline behavior of every agent in the Casablanca-V1 multi-agent system. No agent is exempt. No task overrides these rules without explicit user instruction documented in the task packet.

---

## Rule 1 — Minimum Agent Activation

**Never activate all agents by default.**

PM Orchestrator must select only the agents whose area of responsibility is directly touched by the task. Activating unused agents wastes context, introduces conflicting instructions, and creates uncontrolled side effects.

> Violation: Activating 10 agents for a task that only requires Frontend Agent and QA Agent.

---

## Rule 2 — Minimum Skill Loading

**Never load all skills by default.**

Each agent loads only its default skills plus any on-demand skills explicitly justified by the task. Skills listed as `blocked` or `needs-review` in the manifest are never loaded without explicit user approval.

> Reference: `skill-loading-policy.md`

---

## Rule 3 — Minimal Task Packets

**PM Orchestrator must create task packets with the minimum necessary scope.**

Every task packet must define what is in scope and explicitly what is out of scope. Agents operate strictly within the stated scope. Out-of-scope changes discovered during a task must be escalated, not silently implemented.

> Reference: `task-packet-contract.md`

---

## Rule 4 — Bounded Agent Responsibility

**Each agent must operate only within its defined responsibility.**

No agent implements work belonging to another agent's domain without a handoff. No agent makes decisions (schema, security, visual design) outside its mandate without escalating to the appropriate specialist.

> Reference: `agent-boundaries.md`

---

## Rule 5 — Mandatory Handoff Summary

**Every agent must produce a handoff summary before closing a task.**

No task is considered complete without a structured handoff summary. This applies to all agents, including PM Orchestrator. The handoff must follow the standard contract.

> Reference: `handoff-contract.md`

---

## Rule 6 — QA Gate Before Close

**Every implementation task must pass QA review before being closed.**

This is a blocking rule. Implementation agents (Frontend, Backend, Data, Trust, UI) cannot mark a task complete without a QA Agent sign-off. PM Orchestrator must enforce this gate.

> Reference: `qa-gates-policy.md`

---

## Rule 7 — Scope Confinement

**No agent may modify files outside the scope defined in the task packet.**

If an agent discovers that additional files need to be changed to complete a task, it must escalate to PM Orchestrator and request a scope extension before proceeding. Silent scope expansion is a violation.

---

## Rule 8 — No Unauthorized Dependency Installation

**No agent may install, propose to install, or imply that a dependency will be installed without explicit user approval in the current task packet.**

Wrapper skills in `.agents/skills/` are references, not installation grants. The presence of a `tool-reference` wrapper does not authorize installing that tool.

> Reference: `dependency-installation-policy.md`

---

## Rule 9 — No Unauthorized App Code Changes

**No agent may modify application source code unless the task packet explicitly authorizes it for the stated scope.**

This protects the stable MVP flow. Configuration files, environment files, and infrastructure code follow the same constraint.

---

## Rule 10 — No Real Secrets in the Repository

**No agent may write, suggest writing, or leave real secrets (API keys, passwords, tokens, private keys) in any file committed to the repository.**

All secret references must use environment variable placeholders. Real values belong in `.env.local` or a secrets manager, never in committed files.

---

## Rule 11 — No Demo Mode Disguised as Production

**No agent may implement a demo bypass that is not clearly labeled, guarded behind a flag, and impossible to activate in a production build.**

Demo mode must be explicit. Production behavior must be honest.

---

## Rule 12 — No Dead Ends in the User Journey

**No implementation task may close with a user flow that has no recovery path from an error state.**

Every error state, empty state, and loading state must have a defined behavior. This applies to Frontend, UX, and Backend agents equally.

---

## Rule 13 — Conflict Matrix Enforcement

**No agent may load conflicting tools or skills simultaneously.**

The conflict matrix is a hard constraint, not a soft recommendation.

> Reference: `conflict-matrix-policy.md`

---

## Rule 14 — Trust Agent Is Mandatory for Sensitive Areas

**Any task that touches auth, permissions, payments, secrets, PII, webhooks, or admin-level actions must involve the Trust Agent.**

No other agent may implement these features independently.

> Reference: `security-trust-policy.md`

---

## Rule 15 — Data Agent Is Mandatory for Schema Changes

**Any task that requires schema changes, new migrations, or data model decisions must involve the Data Agent.**

No backend or frontend agent may define schema independently.

> Reference: `data-integrity-policy.md`
