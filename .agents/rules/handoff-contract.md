# Handoff Contract

**Severity:** required  
**Applies to:** all agents  
**Version:** 1.0

---

Every agent must deliver a handoff summary before a task is considered closed. The handoff is the formal record of what happened, what changed, what risks remain, and where the work goes next.

**A task without a handoff is not closed — it is abandoned.**

---

## Handoff Summary Structure

```md
# Handoff Summary

## Agent
[Name of the agent producing this handoff]

## Task
[Task ID and one-sentence description of what the task was]

## What changed
[Concise description of what was implemented, designed, configured, or documented.
Be specific — not "updated some files" but "added reservation status badge component
with 4 states: pending, confirmed, cancelled, completed."]

## Files touched
[Explicit list of every file that was created, modified, or deleted.
Include the full path relative to the project root.]

- [path/to/file1] — [created / modified / deleted]
- [path/to/file2] — [created / modified / deleted]

## Decisions made
[Every non-trivial decision that was made during this task.
Include: what the decision was, why it was made, and what the alternative was.]

- Decision: [what]  
  Reason: [why]  
  Alternative rejected: [what else was considered]

## Risks
[Honest assessment of what could go wrong, what was left unresolved, or what
assumptions were made that might not hold.]

- [Risk 1: description]
- [Risk 2: description]
(State "None identified" only if genuinely true — do not use to skip this section)

## Validation performed
[What was actually tested or verified before producing this handoff.
List specific actions, not vague claims.]

- [e.g., Ran playwright test suite: 12/12 passing]
- [e.g., Manual smoke test: reservation flow at 1440px — passes]
- [e.g., axe-core scan: 0 violations]
- [e.g., TypeScript build: no errors]

## Tests
[What tests exist for this change, and what is still missing.]

- Existing tests: [list or "none"]
- New tests added: [list or "none added in this task"]
- Tests missing: [what should be added in a future task]

## Blockers
[Anything that prevented full task completion, or that the next agent must
resolve before proceeding.]

- [Blocker 1: description]
(State "None" if there are no blockers)

## Next recommended agent
[Which agent should receive this handoff, and why.]

- Agent: [agent name]
- Reason: [why this agent should be next]

## Notes for PM
[Anything PM Orchestrator needs to know that doesn't fit above. Scope deviations,
unexpected discoveries, decisions that need user validation, etc.]

- [Note 1]
(Omit this section if there are no notes)
```

---

## Handoff Rules

### All agents must:
1. Produce a handoff summary for every task, no exceptions.
2. List every file touched by path — not by description.
3. Document every non-trivial decision, including alternatives rejected.
4. Be honest about risks — "None identified" requires genuine confidence, not optimism.
5. Validate at least the minimum required checks before handing off.

### PM Orchestrator must:
1. Review the handoff before routing to the next agent.
2. Confirm QA sign-off is present for implementation tasks.
3. Flag any handoff where the risk section is empty but the task involved security, data, or payments.
4. Archive the handoff as part of the task audit trail.

### QA Agent specifically must:
1. Include the sign-off level (PASS / CONDITIONAL PASS / FAIL) in the "Validation performed" section.
2. Include a list of every acceptance criterion and its pass/fail status.

---

## Minimum Validation Before Handoff

| Task type | Minimum validation required |
|---|---|
| Frontend change | Manual smoke test + axe-core pass |
| Backend change | Manual API test + no TypeScript errors |
| Database change | Migration runs without error + down migration tested |
| Auth / Security | Manual auth flow test + Trust Agent review complete |
| CI/CD change | Pipeline run: at least one green build |
| Component change | All states rendered + axe-core pass |
| Docs / ADR | Content reviewed for accuracy against implementation |
| Release | Changeset valid + CI passing |
