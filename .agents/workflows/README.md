# .agents/workflows/ — Multi-Agent Workflows v1

This directory contains the **operational workflows** of the Casablanca-V1 multi-agent system. Workflows define how agents collaborate to execute specific categories of tasks — from a raw user request through to a validated handoff.

---

## What workflows are

Workflows are **repeatable, step-by-step process scripts** that:
- Define which agents are involved and in what order
- Reference which rules are active during each step
- Define quality gates that must pass before the workflow advances
- Define the handoffs that connect agents
- Specify what "done" looks like

Workflows do not implement features. Workflows do not install dependencies. Workflows are coordination protocols — they tell agents how to work together.

---

## Difference between workflows, rules, agents, and skills

| Artifact | What it is | Where it lives |
|---|---|---|
| **Skills** | Knowledge and competency references — *how to do things* | `.agents/skills/` |
| **Agents** | Role definitions with responsibilities — *who does what* | `.agents/agents/` |
| **Rules** | Behavioral guardrails — *what must and must not happen* | `.agents/rules/` |
| **Workflows** | Coordination protocols — *how agents work together on specific tasks* | `.agents/workflows/` |

A workflow **uses** agents, **follows** rules, and activates **skills** — but it is none of these things itself.

---

## How PM Orchestrator starts workflows

1. A user request arrives.
2. PM Orchestrator runs the **task-intake-workflow** to classify the request and create a task packet.
3. PM Orchestrator selects the appropriate workflow based on the request type.
4. PM Orchestrator activates only the required agents for that workflow.
5. Each agent executes its step, produces a handoff, and routes to the next agent.
6. PM Orchestrator integrates handoffs and validates completion criteria.
7. PM Orchestrator routes to the **qa-validation-workflow** before closing any implementation task.

---

## How task packets control execution

Every workflow step is governed by the task packet created by PM Orchestrator. The task packet defines:
- What the agent is authorized to do (scope)
- What rules are active
- What skills to load
- What the acceptance criteria are
- What constitutes an escalation trigger

No agent may expand beyond the task packet without escalating. See `.agents/rules/task-packet-contract.md`.

---

## How handoffs control continuity

Each agent in a workflow must produce a handoff summary before the next agent can begin. The handoff:
- Confirms what was done
- Documents decisions made
- Lists files touched
- Identifies risks
- Specifies the next agent

Handoffs are the chain of custody across agents. Without a handoff, the workflow has an untracked gap. See `.agents/rules/handoff-contract.md`.

---

## Why QA gates are mandatory

Every implementation workflow ends with the **qa-validation-workflow**. This is a **blocking rule** (`qa-gates-policy.md`). No implementation task is closed without QA Agent sign-off.

This applies even when the implementor is confident in the result. Self-certification by implementation agents is not accepted.

---

## Why workflows do not install dependencies

Workflows are coordination protocols. They do not execute installation commands. If a workflow step discovers that a new dependency is needed, the workflow must trigger the **dependency-proposal-workflow**, which presents a formal proposal to the user and waits for explicit approval before any installation occurs.

See `.agents/rules/dependency-installation-policy.md`.

---

## Source of truth

- Skills manifest: `.agents/skills/manifest.json`
- Agents manifest: `.agents/agents/agents.manifest.json`
- Rules manifest: `.agents/rules/rules.manifest.json`
- Workflows manifest: `.agents/workflows/workflows.manifest.json`
