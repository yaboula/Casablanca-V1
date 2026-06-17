# Tool Usage Policy

## Goal

Require each native subagent to use the right tools for its area of work instead of relying on pure prompt reasoning.

## Principles

- Models reason.
- Tools gather evidence.
- Agents should not make strong claims when the relevant evidence tool exists but was not used.
- If a required capability is unavailable in the active runtime, the agent must say so explicitly in the handoff.

## Capability classes

### 1. Local repository inspection

Examples:
- file search
- symbol search
- file open/read
- diff inspection

Use for:
- code mapping
- implementation review
- architecture review
- docs review

### 2. Web research

Examples:
- web search
- official docs lookup
- standards or browser behavior lookup

Use for:
- changing external facts
- library behavior
- browser quirks
- accessibility standards
- API and framework references

### 3. App and browser inspection

Examples:
- browser automation
- DOM inspection
- interactive navigation
- form interaction

Use for:
- frontend review
- UX review
- UI review
- end-to-end validation

### 4. Visual evidence

Examples:
- screenshots
- image inspection
- visual comparison

Use for:
- layout review
- spacing and hierarchy review
- responsive review
- clipping, overlap, and state visibility review

### 5. Runtime diagnostics

Examples:
- console logs
- network capture
- trace viewer
- request and response inspection

Use for:
- frontend debugging
- API/UI integration issues
- flaky flows
- async or loading-state analysis

### 6. Validation tools

Examples:
- test runner
- accessibility scanner
- visual regression
- fixture or mock validation

Use for:
- QA review
- release readiness
- user-facing changes

### 7. Code execution and transformation

Examples:
- shell
- code interpreter
- local scripts

Use for:
- summarizing large outputs
- transforming data
- diffing artifacts
- filtering logs before handing them to a model

## Minimum evidence rule

### Review-only tasks

At minimum use:
- local repository inspection

If the task is frontend, UX, UI, or QA related, also use:
- app and browser inspection or visual evidence when available

### Frontend, UX, and UI tasks

At minimum use:
- local repository inspection
- app and browser inspection when the target can run
- visual evidence for layout or state claims

### QA and validation tasks

At minimum use:
- local repository inspection
- validation tools

Prefer also:
- runtime diagnostics
- visual evidence

### External-fact tasks

At minimum use:
- web research

Use official or primary sources whenever possible.

## Unavailable capability rule

If a required capability is unavailable, the handoff must say:
- which capability was unavailable
- how that limits confidence
- what evidence was still gathered

## Anti-patterns

Do not:
- claim runtime behavior from static code alone when browser inspection was possible
- claim visual quality from source code alone when screenshots were possible
- claim external facts from memory when web research was required
- dump raw logs into the model when code execution can filter them first
