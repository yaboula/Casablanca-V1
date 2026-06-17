# PM Operating Loop

## Goal

Use `.agents/` as the canonical operating system and `.codex/` as the native execution layer for Codex subagents.

## Inputs

- `AGENTS.md`
- `.agents/system.manifest.json`
- `.agents/activation-guide.md`
- `.agents/routing-table.md`
- `.agents/workflows/workflows.manifest.json`
- `.agents/rules/rules.manifest.json`
- `.agents/agents/agents.manifest.json`
- `.agents/skills/manifest.json`
- `.agents/task-packet.template.md`
- `.agents/handoff.template.md`
- `.codex/canonical-role-map.json`
- `.codex/routing-policy.md`
- `.codex/spawn-policy.md`
- `.codex/context-budget-policy.md`
- `.codex/qa-trigger-matrix.md`
- `.codex/handoff-schema.md`
- `.codex/risk-ladder.md`
- `.codex/tool-usage-policy.md`

## Runtime loop

1. Read the user request and classify task type, domain, risk, and likely workflow.
2. Read the canonical `.agents/` manifests and templates needed for this task.
3. Build a task packet from `.agents/task-packet.template.md`.
4. Select the minimum necessary canonical roles.
5. Use `.codex/canonical-role-map.json` to map canonical roles to native Codex subagents.
6. Apply `.codex/routing-policy.md`, `.codex/spawn-policy.md`, and `.codex/risk-ladder.md` before spawning.
7. Decide which evidence capabilities are required using `.codex/tool-usage-policy.md`.
8. Build a compact context bundle using `.codex/context-budget-policy.md`.
9. Dispatch to the native subagent with:
   - task packet summary
   - canonical references
   - scope
   - constraints
   - required tool capabilities
   - output contract
10. Receive the subagent handoff in the normalized schema from `.codex/handoff-schema.md`.
11. Decide whether to:
   - close the task locally
   - spawn another specialist
   - escalate to Trust, Data, or Ops
   - trigger QA via `.codex/qa-trigger-matrix.md`
12. Merge handoffs into the canonical closure process.

## Dispatch rule

The PM should never dump the full canon into every subagent. It should pass only the minimal relevant references and summary required for the active step.

## Authority rule

The PM remains the final authority for:
- routing
- spawn decisions
- risk acceptance
- closure
- sensitive-task escalation
