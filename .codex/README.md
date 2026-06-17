# Codex Complete Native Subagent System v2

Codex native subagents are project-scoped agent definitions under `.codex/agents/` that the root Codex session can spawn for focused work.

The canonical multi-agent operating system remains `.agents/`. The root Codex session is the PM Orchestrator, uses GPT/OpenAI through Codex, and keeps final authority for routing, task packet approval, sensitive closure, final synthesis, and spawn decisions.

Backend work uses GPT/OpenAI through the dedicated Backend Agent. Kimi K2.7 Code and DeepSeek V4-Pro are used for worker subagents according to the routing policy.

Subagents are explicitly spawned. Not all agents should be spawned at once. PM activates only the minimum necessary agents for a task.

Permissions are controlled through `sandbox_mode` plus agent-specific developer instructions. `read-only` does not mean cheaper tokens; it means the agent must not write files. `workspace-write` agents must still respect their scoped write permissions and PM approval rules.

Provider setup is user-level only. Do not put providers, API keys, or secrets in this repository. Configure providers in `~/.codex/config.toml`.

Operationally, `.codex/` is the native execution layer for Codex:
- `.agents/` remains canonical for roles, workflows, skills, rules, task packets, and handoff requirements
- `.codex/pm-operating-loop.md` defines how the PM uses the canonical layer at runtime
- `.codex/canonical-role-map.json` maps canonical roles to native Codex subagents
- `.codex/routing-policy.md`, `.codex/spawn-policy.md`, `.codex/context-budget-policy.md`, `.codex/qa-trigger-matrix.md`, `.codex/handoff-schema.md`, `.codex/risk-ladder.md`, and `.codex/tool-usage-policy.md` define the runtime efficiency policy

This means the PM can route from canonical intent to native execution without modifying `.agents/`.
