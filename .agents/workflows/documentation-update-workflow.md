# Documentation Update Workflow

## Purpose

Create or update documentation — including Architecture Decision Records (ADRs), READMEs, handoff documents, API references, and project knowledge — ensuring documentation reflects actual decisions and implemented reality.

## When to use

- A significant architectural or product decision has been made and needs an ADR
- A feature has been completed and needs to be documented
- An API contract needs to be documented for external or internal consumers
- A handoff document is needed for cross-session continuity
- Project knowledge base needs updating after structural changes

## When not to use

- Implementation work (documentation here never writes code)
- When the decision being documented has not yet been finalized (document decisions, not drafts)

## Required agents

- Docs Agent

## Optional agents

- PM Orchestrator (when documentation scope needs routing or approval)
- Workflow Agent (when documentation includes release notes or changelog entries)
- Product Agent (when documentation covers product decisions or requirements)

## Required rules

- `global-operating-rules.md`
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| Docs Agent | `doc-coauthoring`, `docusaurus` |

On-demand (with justification):
- `handoff` — when producing a formal cross-agent or cross-session handoff document

## Inputs

- Completed handoff summaries from implementation agents
- API contracts (from Backend Agent)
- Architectural decisions made during the task
- Acceptance criteria and validation results (from QA Agent)

---

## Procedure

### Step 1 — Docs Agent: Scope Confirmation

Docs Agent:
1. Confirms what needs to be documented (ADR, handoff, API ref, README, knowledge base).
2. Confirms sources of truth are available (handoffs, contracts, QA results).
3. Does not begin writing until sources are confirmed.

### Step 2 — Docs Agent: ADR (if required)

An ADR is required when any of the following decisions were made:
- ORM choice (Drizzle vs Prisma)
- Auth provider choice (Auth.js vs Better Auth)
- Transport layer choice (tRPC vs Fastify)
- Release management choice (Changesets vs Semantic Release)
- Major architectural change (new service, new integration, breaking API change)
- Visual design system direction decision

ADR format:
```md
# ADR-[number]: [Decision Title]

## Status
[proposed | accepted | superseded | deprecated]

## Context
[Why did this decision need to be made?]

## Decision
[What was decided and why?]

## Alternatives considered
[What was rejected and why?]

## Consequences
[What are the implications of this decision?]

## Date
[YYYY-MM-DD]
```

### Step 3 — Docs Agent: API Reference (if required)

If an API contract was produced by Backend Agent, Docs Agent:
1. Converts the contract into readable API reference documentation.
2. Documents: endpoint/procedure name, parameters, response schema, error responses, auth requirements.
3. Cross-checks against the Backend Agent handoff — does not invent behavior.

### Step 4 — Docs Agent: Handoff Document (if required)

Using `handoff` skill (on-demand):
1. Produces a formal cross-session handoff document capturing the state of the task.
2. Includes: what was built, decisions made, risks, next steps, files changed.
3. Designed for continuity — a future agent (or developer) should be able to pick up from this.

### Step 5 — Docs Agent: README or Knowledge Base Update (if required)

1. Updates relevant README files to reflect structural changes.
2. Updates project knowledge base with new patterns, tools, or conventions.
3. Does not describe aspirational or future state — only confirmed, implemented reality.

### Step 6 — Docs Agent: Accuracy Review

Before finalizing:
1. Cross-check every claim against confirmed implementation (handoffs, code, contracts).
2. Flag any claim that cannot be verified against a source → mark as `[unverified — to confirm]`.
3. Do not document unconfirmed behavior as fact.

---

## Quality gates

- [ ] Documentation reflects actual decisions (not aspirational)
- [ ] Every factual claim is sourced from a handoff or confirmed output
- [ ] ADR written for architectural decisions
- [ ] API documentation matches the actual contract
- [ ] No invented API behavior or implementation status
- [ ] Unverified claims flagged explicitly

## Escalation points

- Decision is unclear or not yet finalized → PM Orchestrator (do not document a draft as decided)
- API behavior is unclear → Backend Agent (confirm before documenting)
- Accuracy of implementation status uncertain → implementation agent (confirm before publishing)

## Required handoffs

- Docs Agent handoff: list of documents created or updated, accuracy review results, any flagged unverified claims

## Completion criteria

- All required document types: ✓ created or updated
- ADR: ✓ written for architectural decisions (if applicable)
- API reference: ✓ matches actual contract (if applicable)
- Accuracy: ✓ all claims sourced from confirmed outputs
- Unverified claims: ✓ flagged explicitly (if any)

## Output format

```txt
DOCUMENTATION UPDATE COMPLETE

Task ID: [id]
Documents created: [list]
Documents updated: [list]
ADRs written: [list or none]
Accuracy status: [all claims verified / unverified claims: list]
Next agent: [Workflow Agent if release notes needed / PM Orchestrator]
```
