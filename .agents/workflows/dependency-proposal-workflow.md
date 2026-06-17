# Dependency Proposal Workflow

## Purpose

Evaluate a proposed dependency installation — including package selection, conflict analysis, license review, and formal proposal — without executing any installation commands. Explicit user approval is required before any install may proceed.

## When to use

- A task requires a new npm/pnpm/bun package
- A SaaS SDK needs to be installed for a new integration
- A devtool (Playwright, Storybook, Lighthouse CI) needs to be added
- Any time `package.json` would need to be modified

## When not to use

- A skill wrapper exists for a tool → the wrapper is a reference, not an install grant (see `dependency-installation-policy.md`)
- The package is already installed and just needs to be used

## Required agents

- PM Orchestrator
- Workflow Agent (validates git hygiene impact)

## Optional agents

- Relevant specialist agent (Backend Agent for server packages, Frontend Agent for client packages, Trust Agent for auth/payment SDKs, Ops Agent for infrastructure packages)
- QA Agent (if the package affects the test suite)

## Required rules

- `dependency-installation-policy.md` (blocking — no install without approval)
- `conflict-matrix-policy.md` (check for conflicts with existing packages)
- `security-trust-policy.md` (if SaaS SDK involves auth, payments, or PII)

## Required skills

- PM Orchestrator defaults: `to-prd`, `to-issues`
- Workflow Agent defaults: `changesets`, `github-templates`, `full-output-enforcement`

## Inputs

- Name of proposed package
- Reason the package is needed
- Task context (what feature or fix triggered this need)

---

## Procedure

### Step 1 — PM Orchestrator: Trigger Assessment

PM Orchestrator:
1. Confirms why a new package is needed.
2. Confirms the package is not already installed.
3. Confirms a wrapper skill exists or does not exist in `.agents/skills/manifest.json`.
4. Confirms no existing native solution covers the need.
5. If the need can be met without a new dependency → document that and stop here.

### Step 2 — Specialist Agent: Package Research

The relevant specialist agent:
1. Identifies the exact package name and version range.
2. Researches license (MIT, Apache 2.0, ISC are preferred; GPL is a risk; commercial licenses require explicit approval).
3. Checks maintenance status (last release, open issues, GitHub stars as proxy).
4. Identifies the minimal set of files that would change.
5. Identifies conflicts with existing packages (see `conflict-matrix-policy.md`).
6. Identifies the Trust Agent's involvement need (if auth, payment, or PII SDK).

### Step 3 — Specialist Agent: Proposal Document

Produces the formal dependency proposal:

```txt
DEPENDENCY PROPOSAL

Package: [package name]@[version or range]
Registry: [npm / pnpm catalog]
Category: [dependency / devDependency / peerDependency]
License: [license type]
Maintenance: [active / inactive — last release: date]

Reason:
[Why this specific package is needed for this task]

Alternatives considered:
1. [Alternative 1] — rejected because: [reason]
2. [Alternative 2] — rejected because: [reason]
3. Native solution — rejected because: [reason or "not available"]

Conflicts:
[None / Conflict with [package] — see conflict-matrix-policy.md]

Files that would change:
- package.json ([dependencies / devDependencies])
- [any other files: config files, imports, etc.]

Impact:
- Bundle size impact: [estimate or "devDependency — no bundle impact"]
- Runtime behavior change: [yes / no — description if yes]

Rollback:
[How to remove this package if it causes issues]

Trust Agent review needed: [yes — payment/auth/PII SDK / no]

Approval required from: [user / PM Orchestrator]
```

### Step 4 — Trust Agent (if SaaS SDK): Security Review

If the proposed package is a SaaS SDK (Stripe, Resend, Cloudinary, etc.):
1. Trust Agent reviews the SDK for security implications.
2. Trust Agent confirms secret keys would exist only in environment variables.
3. Trust Agent confirms SDK does not introduce unexpected data collection.

### Step 5 — PM Orchestrator: User Approval Request

PM Orchestrator:
1. Presents the dependency proposal to the user.
2. Waits for explicit approval.
3. Does NOT proceed to installation without a clear "yes" from the user in the current session.

The approval must be in the current session. Past approvals or general permissions do not count.

### Step 6 — If Approved: Handoff to Workflow Agent

After explicit approval:
1. Workflow Agent documents the approved package in a changeset or task note.
2. The relevant specialist agent receives authorization to include the install command in the next implementation step.

### Step 7 — If Not Approved: Document and Close

If the user declines:
1. Document the decision (package X was evaluated and declined — reason).
2. Close the proposal.
3. The specialist agent must work within the constraint (no install).

---

## Quality gates

- [ ] Package is not already installed
- [ ] Alternatives were genuinely considered
- [ ] License is acceptable
- [ ] Conflicts checked against existing packages
- [ ] Files that would change are documented
- [ ] Rollback is defined
- [ ] Trust Agent involved if SaaS SDK
- [ ] User approval obtained in current session (before any install)

## Escalation points

- License is GPL or commercial → PM Orchestrator → user must explicitly approve
- SDK involves auth, payments, or PII → Trust Agent review mandatory
- Conflict with existing package → PM Orchestrator → user must choose

## Required handoffs

- Specialist Agent handoff: dependency proposal document
- Trust Agent handoff (if applicable): security review result
- PM Orchestrator: approval decision (approved / declined)
- Workflow Agent (if approved): changeset or task note

## Completion criteria

**If approved:**
- User has explicitly approved in current session
- Proposal document is complete
- Trust Agent reviewed (if applicable)
- Workflow Agent has documented the decision
- Specialist agent has authorization to proceed with install in implementation step

**If declined:**
- Decision documented
- Specialist agent confirmed: must work without the package

## Output format

```txt
DEPENDENCY PROPOSAL RESULT

Package: [name]@[version]
Proposed by: [specialist agent]
Decision: [APPROVED / DECLINED]
Approved by: [user — in current session / PM Orchestrator]
Trust Agent review: [complete / N/A]
License: [acceptable / risk: description]
Conflicts: [none / conflict: description]
Rollback: [defined]
Files that will change: [list]
Next step: [specialist agent proceeds with install / task proceeds without install]
```
