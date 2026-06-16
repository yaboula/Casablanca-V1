# .agents/agents/ — Multi-Agent System v1

This directory defines the specialized agent roster for **Casablanca-V1**.
Each agent is a focused specialist. No agent handles everything.

---

## What these agents are

Each file in this directory describes a **specialized agent** with:
- A single, clear **mission**
- A bounded set of **responsibilities**
- A curated list of **default skills** (always loaded)
- A list of **on-demand skills** (loaded only when the task requires them)
- Strict **forbidden actions**
- A defined **output contract** and **handoff format**

These are **not AI models**. They are **behavioral contracts**: structured instructions that govern how an AI agent must behave when operating in a given role.

---

## How PM Orchestrator routing works

The **PM Orchestrator** (`pm-orchestrator.md`) is the single entry point.

When a task arrives:
1. PM Orchestrator reads the task and classifies which areas are affected.
2. It creates a **task packet** for each relevant specialist agent.
3. It selects the **minimum set of agents** needed — not all of them.
4. Each selected agent executes within its boundaries and produces a **handoff summary**.
5. PM Orchestrator integrates handoffs and decides if the task is complete or if escalation is needed.

**Only PM Orchestrator sees the full picture. Specialist agents only see their task packet.**

---

## Why not all agents load at once

Loading all agents simultaneously would:
- Create conflicting instructions
- Trigger unnecessary skill loading (e.g., loading Stripe when fixing a CSS bug)
- Violate the principle of minimal footprint
- Risk cross-contamination of responsibilities

The system follows a **specialist-only** load policy. Each agent is activated only when its area is touched by the task.

---

## How default skills vs on-demand skills work

| Type | When loaded | Policy |
|---|---|---|
| **Default skills** | Always loaded when the agent is active | Core competency of the agent |
| **On-demand skills** | Loaded only if the task explicitly requires them | Avoid loading unless needed |

Skills are sourced exclusively from `.agents/skills/manifest.json`.
No agent may reference a skill not listed in the manifest.

---

## How handoff summaries work

Every agent that completes a task must return a structured **handoff summary**:

```txt
HANDOFF SUMMARY

Agent:
Task:
What changed:
Files touched:
Decisions:
Risks:
Validation:
Next agent:
```

Handoffs are how agents communicate across boundaries without direct coupling.
PM Orchestrator collects handoffs and decides next steps.

---

## How QA is required before closing implementation tasks

The **QA Agent** must be activated before any implementation task is marked complete.

QA Agent responsibilities include:
- Running playwright tests
- Checking accessibility with axe-core
- Code review with the `review` skill
- Confirming acceptance criteria match

No implementation task is closed without QA sign-off.

---

## Source of truth

- Skills manifest: `.agents/skills/manifest.json`
- Agents manifest: `.agents/agents/agents.manifest.json`
- Agent files: `.agents/agents/*.md`
