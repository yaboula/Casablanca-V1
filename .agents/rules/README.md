# .agents/rules/ — Global Rules v1

This directory contains the **behavioral guardrails** for the entire Casablanca-V1 multi-agent system.

---

## What rules are

Rules are **mandatory constraints** that govern how every agent must behave. Unlike skills (which are competency references) or agents (which are role definitions), rules are **non-negotiable operating policies**.

Rules are not suggestions. Rules are **enforced by the PM Orchestrator** before any task is routed, and by each specialist agent before any action is taken.

---

## Difference between rules, skills, agents, and workflows

| Artifact | What it is | Where it lives |
|---|---|---|
| **Skills** | Knowledge and competency references (how to do things) | `.agents/skills/` |
| **Agents** | Role definitions with responsibilities and skill assignments | `.agents/agents/` |
| **Rules** | Behavioral guardrails and operating policies (what must/must not happen) | `.agents/rules/` |
| **Workflows** | Step-by-step orchestration scripts for recurring multi-agent processes | `.agents/workflows/` |

---

## Blocking vs. advisory rules

| Severity | Meaning |
|---|---|
| **blocking** | The task **cannot proceed** until this rule is satisfied. No exceptions without explicit user override. |
| **required** | The rule **must be followed** in all normal operations. Deviation must be documented in the handoff. |
| **advisory** | Best practice. Deviation is allowed with documented justification. |

### Blocking rules (summary)

- `qa-gates-policy`: QA must sign off before any implementation task is closed. **Blocking.**
- `security-trust-policy`: Trust Agent is mandatory when auth, payments, or PII are touched. **Blocking.**
- `dependency-installation-policy`: No dependency installation without explicit approval. **Blocking.**
- `data-integrity-policy`: Data Agent mandatory for schema and migration changes. **Blocking.**
- `conflict-matrix-policy`: Conflicting skills/tools cannot be loaded simultaneously. **Blocking.**

---

## How PM Orchestrator must use rules

1. Before creating any task packet, PM Orchestrator reads the applicable rules.
2. PM Orchestrator applies the escalation policy (`escalation-policy.md`) to determine which agents must be involved.
3. PM Orchestrator includes relevant rule references in each task packet under `Constraints`.
4. PM Orchestrator validates handoff summaries against `handoff-contract.md` before closing.
5. PM Orchestrator cannot waive a **blocking** rule without explicit user instruction.

---

## How rules apply to task packets

Every task packet must reference the applicable rules under `Constraints`. The agent receiving the packet is expected to read those rules and operate within them. See `task-packet-contract.md` for the full task packet structure.

---

## How rules apply to handoffs

Every handoff summary must confirm:
- Which rules were active during the task
- Whether any rule was at risk of violation (and how it was resolved)
- Whether QA sign-off was obtained (for implementation tasks)

See `handoff-contract.md` for the full handoff structure.

---

## Source of truth

- Skills manifest: `.agents/skills/manifest.json`
- Agents manifest: `.agents/agents/agents.manifest.json`
- Rules manifest: `.agents/rules/rules.manifest.json`
