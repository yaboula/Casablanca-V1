# Handoff Schema

## Goal

Keep handoffs compact while preserving execution value.

## Default format

```txt
HANDOFF SUMMARY

Agent:
Task:
Decision:
Evidence:
Tools used:
Risks:
Validation:
Next step:
```

## Optional fields

Add only when necessary:
- Files inspected
- Files changed
- Blockers
- Approval needed
- Missing capabilities

## Anti-patterns

Do not include:
- long narrative recap
- repeated scope text
- generic advice without task relevance
