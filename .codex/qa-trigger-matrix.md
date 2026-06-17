# QA Trigger Matrix

## QA required

QA is required when:
- source code changed
- a bug fix is ready for closure
- user-facing behavior changed
- regression risk is non-trivial
- accessibility impact is likely
- release readiness is being evaluated
- a sensitive or high-risk logic path changed

## QA optional

QA is optional when:
- planning artifacts changed
- documentation changed materially
- implementation plans are being reviewed
- design-system guidance changed without source edits

## QA usually not required

QA is usually not required when:
- the task is brainstorming only
- the task is codebase mapping only
- the task is exploratory analysis only
- the task is pure triage

## Statuses

- QA PASS
- QA PASS WITH RISKS
- QA BLOCKED
- QA FAIL
