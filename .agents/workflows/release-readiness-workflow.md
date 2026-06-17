# Release Readiness Workflow

## Purpose

Validate that the system is ready for release or deployment — checking QA status, blocking rules, migration risks, environment safety, observability, and documentation completeness before any deployment proceeds.

## When to use

- Before any production deployment
- Before tagging a release version
- Before merging a release branch
- When PM Orchestrator determines a batch of completed tasks is ready to ship

## When not to use

- For single-file hotfixes that have already passed QA and do not require a versioned release
- For preview/staging deployments that are non-production (though running this workflow for staging is recommended)

## Required agents

- PM Orchestrator
- QA Agent
- Ops Agent
- Workflow Agent

## Optional agents

- Trust Agent (if the release includes security-sensitive changes)
- Data Agent (if the release includes database migrations)
- Docs Agent (if release notes or changelog documentation is needed)

## Required rules

- `global-operating-rules.md`
- `qa-gates-policy.md`
- `git-change-control-policy.md`
- `security-trust-policy.md` (if security changes are in the release)
- `data-integrity-policy.md` (if migrations are in the release)
- `handoff-contract.md`

## Required skills

| Agent | Default Skills |
|---|---|
| QA Agent | `playwright-testing`, `tdd`, `review`, `axe-core` |
| Ops Agent | `github-actions`, `vercel`, `opentelemetry` |
| Workflow Agent | `changesets`, `github-templates`, `full-output-enforcement` |

On-demand:
- Ops Agent: `sentry-agent-skills` — **BLOCKED, do not activate**
- Workflow Agent: `semantic-release` — only if project migrated away from Changesets
- Docs Agent: `handoff` — for formal release documentation

## Inputs

- List of completed tasks included in this release
- QA sign-offs for all included tasks
- Changeset files (or semantic-release config)
- Migration status (if any migrations are included)
- Environment variable documentation (from Ops Agent)

---

## Procedure

### Step 1 — PM Orchestrator: Release Scope Definition

PM Orchestrator:
1. Defines what is included in this release (list of task IDs and handoffs).
2. Confirms QA sign-offs exist for all included implementation tasks.
3. Identifies if the release includes: migrations, auth changes, payment changes, new dependencies.
4. Creates release task packet.

**If any included task lacks a QA sign-off:** Stop. Return to QA Agent for that task before proceeding.

### Step 2 — QA Agent: Release Regression Check

QA Agent:
1. Runs the full E2E test suite against the release candidate.
2. Checks for regressions across all affected flows.
3. Runs accessibility checks for any UI changes in the release.
4. Confirms all QA sign-offs are PASS or CONDITIONAL PASS (no unresolved FAIL).
5. Returns: regression check results, overall QA status for release.

### Step 3 — Data Agent (if migrations in release): Migration Readiness

Data Agent:
1. Confirms all migration files are present and reviewed.
2. Confirms all migrations have down paths (rollback).
3. Confirms no destructive migrations run without documented user sign-off.
4. Confirms migrations are safe to run without downtime (or documents the downtime window needed).
5. Returns: migration readiness report.

### Step 4 — Trust Agent (if security changes in release): Security Readiness

Trust Agent:
1. Confirms no real secrets in committed code.
2. Confirms auth middleware is applied to all new protected routes.
3. Confirms all payment webhook handlers have signature validation.
4. Confirms PII is not logged.
5. Returns: security readiness report.

### Step 5 — Ops Agent: Environment and Deployment Readiness

Ops Agent:
1. Confirms all required environment variables are documented in `.env.example`.
2. Confirms CI pipeline is green for the release branch.
3. Confirms Vercel project configuration is correct for this deployment.
4. Confirms OpenTelemetry instrumentation is in place for new services.
5. Confirms no dev/debug routes are accessible in the production build.
6. Note: `sentry-agent-skills` is blocked — do not activate.
7. Returns: environment readiness report, CI status, deployment config status.

### Step 6 — Workflow Agent: Release Package

Workflow Agent:
1. Confirms changeset files exist for all changes with user-facing impact.
2. Confirms version bump type is correct (patch/minor/major).
3. Generates changelog entry from changesets.
4. Prepares the PR description for the release PR.
5. Confirms branch naming and commit conventions are followed.
6. Returns: changeset summary, changelog entry, release PR description.

### Step 7 — Docs Agent (if activated): Release Documentation

Docs Agent:
1. Produces or updates release notes for the version.
2. Updates relevant documentation to reflect changes in the release.
3. Returns: release notes, documentation update summary.

### Step 8 — PM Orchestrator: Release Decision

PM Orchestrator reviews all reports and makes the release decision:

#### RELEASE READY
All checks pass. No blocking issues. Proceed to deploy.

#### RELEASE READY WITH RISKS
No blocking issues but conditions exist. Document risks. Proceed with awareness.

#### RELEASE BLOCKED
One or more checks failed. Do not deploy. Return to the responsible agent for resolution.

---

## Quality gates

- [ ] All included tasks: QA sign-off PASS or CONDITIONAL PASS
- [ ] Regression check: no new failures introduced
- [ ] Migrations: rollback paths confirmed (if applicable)
- [ ] No destructive migrations without sign-off (if applicable)
- [ ] No real secrets in committed code
- [ ] CI pipeline: green
- [ ] Environment variables: documented
- [ ] No dev/debug routes in production build
- [ ] Changeset files: complete for user-facing changes
- [ ] Changelog: generated and reviewed
- [ ] sentry-agent-skills: NOT activated (blocked)

## Escalation points

- Any included task missing QA sign-off → stop, QA Agent must complete that task first
- Migration risk is high → PM Orchestrator → user approval required
- Security issue discovered during release check → Trust Agent (and potentially stop deployment)
- CI is failing → Ops Agent for diagnosis

## Required handoffs

- QA Agent: regression check results + overall QA status
- Data Agent (if applicable): migration readiness report
- Trust Agent (if applicable): security readiness report
- Ops Agent: environment + deployment readiness report
- Workflow Agent: changeset summary, changelog, PR description
- Docs Agent (if applicable): release notes
- PM Orchestrator: release decision

## Completion criteria

- All QA sign-offs: ✓ PASS or CONDITIONAL PASS
- Regression check: ✓ clean
- Migrations: ✓ reviewed and safe (if applicable)
- Security: ✓ cleared (if applicable)
- CI: ✓ green
- Environment: ✓ documented
- Changeset: ✓ complete
- PM Orchestrator decision: ✓ RELEASE READY or RELEASE READY WITH RISKS

## Output format

```txt
RELEASE READINESS RESULT

Release version: [version]
Task IDs included: [list]
Decision: [RELEASE READY / RELEASE READY WITH RISKS / RELEASE BLOCKED]

QA status: [PASS / CONDITIONAL PASS — regressions: none / list]
Migration status: [N/A / READY / BLOCKED — reason]
Security status: [N/A / CLEARED / ISSUE FOUND — description]
CI status: [GREEN / FAILING]
Environment: [documented / missing vars: list]
Changeset: [complete / incomplete]

Risks (if READY WITH RISKS):
  - [risk 1]

Blockers (if BLOCKED):
  - [blocker 1]

Next step: [proceed to deploy / resolve blockers — responsible agent: name]
```
