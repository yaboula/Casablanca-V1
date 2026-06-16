# Skill Loading Policy

**Severity:** required  
**Applies to:** all agents  
**Version:** 1.0

---

All skills referenced by agents must exist in `.agents/skills/manifest.json`. No agent may reference, load, or simulate the behavior of a skill not listed in the manifest.

---

## Skill Categories

### 1. Default Skills

Skills in the `default_skills` list of an agent's definition in `agents.manifest.json`.

**Rules:**
- Loaded automatically when the agent is activated by PM Orchestrator.
- Must be referenced in the task packet under "Skills to Load > Default".
- Cannot be unloaded mid-task without a scope change documented in the handoff.
- All default skills must appear in `.agents/skills/manifest.json`.

**Default skills by agent (from agents.manifest.json):**

| Agent | Default Skills |
|---|---|
| PM Orchestrator | `to-prd`, `to-issues` |
| Product | `to-prd`, `to-issues` |
| UX | `frontend-design`, `nng-heuristics` |
| UI Design System | `design-taste-frontend` |
| Frontend | `next-app-router`, `tanstack-query` |
| Backend | `openapi-contract`, `trpc` |
| Data | `drizzle-orm` |
| Trust | `authjs`, `openfga`, `owasp-cheat-sheets`, `stripe` |
| QA | `playwright-testing`, `tdd`, `review`, `axe-core` |
| Ops | `github-actions`, `vercel`, `opentelemetry` |
| Docs | `doc-coauthoring`, `docusaurus` |
| Workflow | `changesets`, `github-templates`, `full-output-enforcement` |

---

### 2. On-Demand Skills

Skills in the `on_demand_skills` list of an agent's definition.

**Rules:**
- Not loaded by default.
- Loaded only when the task explicitly requires them.
- The task packet must include a justification for loading the on-demand skill.
- Agents must verify no conflict exists before loading (see `conflict-matrix-policy.md`).
- On-demand skill loading must be declared in the handoff summary.

**Loading justification format:**
```txt
On-demand skill: [skill-name]
Reason: [why this task requires it]
Conflict check: [no conflict / conflict with X — not loading X]
```

---

### 3. Optional Style Mode Skills

A subcategory of on-demand skills specific to the UI Design System Agent.

**Visual taste skills (optional-style-mode):**
- `minimalist-ui`
- `high-end-visual-design`
- `brandkit`
- `image-to-code`
- `imagegen-frontend-web`
- `imagegen-frontend-mobile`
- `stitch-design-taste`
- `gpt-taste`
- `industrial-brutalist-ui`
- `redesign-existing-projects`
- `design-taste-frontend-v1`

**Rules:**
- Only one optional style mode skill may be active at a time.
- Loading must be explicitly requested by the user or PM Orchestrator.
- Never load multiple visual taste skills simultaneously.
- `design-taste-frontend` is the default and does not count as optional-style-mode.

---

### 4. Blocked Skills

Skills with `status: "blocked"` in the manifest.

**Currently blocked:**
- `sentry-agent-skills` — blocked by existing global wildcard rule in `agents.toml`

**Rules:**
- Blocked skills are **never loaded** regardless of task requirements.
- If a task requires a blocked skill's functionality, escalate to PM Orchestrator.
- PM Orchestrator must escalate to the user before any blocked skill can be unblocked.
- Unblocking a skill requires a documented user decision, not an agent decision.

---

### 5. Needs-Review Skills

Skills with `status: "needs-review"` in the manifest.

**Currently needs-review:**
- `open-design` — source and license not fully verified
- `ui-ux-pro-max` — origin and official documentation uncertain

**Rules:**
- Needs-review skills are **not loaded** without explicit user approval in the task packet.
- When a user requests a needs-review skill, document the approval in the task packet and handoff.
- Do not treat needs-review skills as equivalent to verified real skills or generated wrappers.
- These skills conflict with each other (`open-design` ↔ `ui-ux-pro-max`) — never load both.

---

### 6. Forbidden Skills

Skills an agent is explicitly barred from loading, defined in its `forbidden_skills` list in `agents.manifest.json`.

**Rules:**
- A forbidden skill may not be loaded by that agent under any circumstances.
- If the forbidden skill's functionality is genuinely needed, escalate to the agent that owns it.

---

## Skill Loading Order

When an agent activates, it loads skills in this order:
1. Default skills (all, simultaneously)
2. On-demand skills (one by one, with conflict check before each)
3. Optional style mode (at most one, only if explicitly instructed)

**Blocked and needs-review skills are never in this order.**

---

## Validation

Before loading any on-demand or optional-style-mode skill, the agent must:
1. Check the skill exists in `.agents/skills/manifest.json`.
2. Check its `status` is not `"blocked"` or `"needs-review"`.
3. Check no conflict with an already-loaded skill (see `conflict-matrix-policy.md`).
4. Document the loading decision in the handoff summary.
