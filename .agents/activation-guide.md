# Activation Guide

## When to activate the system

Activate the multi-agent system when:
- A new feature or screen is requested
- A bug requires a change to code or configuration
- A database schema change is needed
- An API contract must be defined or modified
- Documentation, ADRs, or release notes need to be produced
- Dependencies need to be added or updated
- Security, auth, or payment logic needs modification

## When not to activate the system

Do not activate the multi-agent system when:
- The user is only asking for an explanation of existing code
- The task is a trivial, single-file typo fix with zero side effects
- The user is just brainstorming and not requesting any files to be changed

## Start sequence

1. Read user request.
2. Use task-intake workflow (`.agents/workflows/task-intake-workflow.md`).
3. PM Orchestrator creates task packet using `.agents/task-packet.template.md`.
4. PM selects minimum necessary agents using `.agents/routing-table.md`.
5. Active agents load only default skills.
6. Load on-demand skills only with justification documented in the task packet.
7. Execute selected workflow from `.agents/workflows/`.
8. QA validates if implementation occurred (`.agents/workflows/qa-validation-workflow.md`).
9. PM integrates handoffs using `.agents/handoff.template.md`.
10. Close or escalate.

## Minimal activation

For simple tasks (e.g., a pure frontend bug fix):
- PM Orchestrator
- Frontend Agent
- QA Agent

## Full feature activation

For cross-cutting features (e.g., a new reservation flow):
- PM Orchestrator
- Product Agent
- UX Agent
- UI Design System Agent
- Frontend Agent
- Backend Agent
- Data Agent (if schema changes)
- Trust Agent (if payments/auth involved)
- QA Agent
- Docs Agent
- Workflow Agent

**Note:** PM Orchestrator sequences these agents. They are not all active simultaneously.

## Sensitive task activation

Any task touching auth, sessions, permissions, payments, secrets, PII, webhooks, or admin actions:
- **Trust Agent is mandatory.**
- Trust Agent must review and define requirements before Backend/Frontend/Data agents implement.

Any task touching database schema or migrations:
- **Data Agent is mandatory.**
- Data Agent must define schema and migrations before Backend Agent implements APIs.

## Closure requirements

A task cannot be closed until:
1. All acceptance criteria in the task packet are verified.
2. All assigned agents have produced a handoff summary.
3. QA Agent has produced a PASS or CONDITIONAL PASS for implementation tasks.
4. No blocking rules remain unresolved.
