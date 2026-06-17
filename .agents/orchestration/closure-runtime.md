# Closure Runtime

## Procedure

Evaluate task completion and determine the final status.

### Closure Blockers

A task **CANNOT** be closed if any of the following apply:
- QA required (for implementation) but missing or FAIL.
- Trust required (sensitive areas touched) but missing.
- Data required (schema touched) but missing.
- Blocking rule unresolved (e.g., pending dependency approval).
- Acceptance criteria from task packet not checked.
- Handoff from assigned agent missing.

### Possible States

Evaluate and declare the final state:

#### CLOSED
All criteria met, QA passed, no blocking rules unresolved. Task is complete.

#### CLOSED WITH RISKS
All criteria met, QA passed conditionally, non-blocking risks documented. Task is complete but risks are carried forward.

#### BLOCKED
Cannot proceed due to external dependency, unresolved blocking rule, or missing critical handoff. Task remains open.

#### ESCALATED
Task requires user intervention (e.g., dependency approval, destructive migration sign-off, ambiguous scope). Task remains open.

#### SPLIT REQUIRED
Task scope expanded beyond the original packet. Close current packet as incomplete and generate new packets to handle the remaining scope.
