# AGENTS.md

## Purpose

This repository uses `.agents/` as its canonical multi-agent operating system.

## Canonical entrypoints

- `.agents/system.manifest.json`
- `.agents/activation-guide.md`
- `.agents/operating-contract.md`
- `.agents/routing-table.md`
- `.agents/task-packet.template.md`
- `.agents/handoff.template.md`

## Required startup behavior

For every non-trivial task:

1. Read `.agents/system.manifest.json`.
2. Read `.agents/activation-guide.md`.
3. Use PM Orchestrator.
4. Create a Task Packet.
5. Select the minimum necessary workflow.
6. Activate only the minimum necessary agents.
7. Load only default skills for active agents.
8. Load on-demand skills only with justification.
9. Apply blocking rules from `.agents/rules/`.
10. Require QA before closing implementation tasks.
11. Produce a Handoff Summary before closure.

## Hard rules

- Do not activate all agents by default.
- Do not load all skills by default.
- Do not install dependencies without explicit user approval.
- Do not modify package.json without explicit user approval.
- Do not touch auth, security, permissions, payments, secrets, PII or sensitive admin logic without Trust Agent.
- Do not touch schema, migrations or data integrity without Data Agent.
- Do not close implementation work without QA.
- Do not modify `.agents/skills/`, `.agents/agents/`, `.agents/rules/` or `.agents/workflows/` during normal task execution.

## When uncertain

Escalate to PM Orchestrator and create or update the Task Packet.
