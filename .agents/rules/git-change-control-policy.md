# Git Change Control Policy

**Severity:** required  
**Applies to:** Workflow Agent (primary), all agents  
**Version:** 1.0

---

Every agent that touches files is responsible for the cleanliness and traceability of those changes in git. The Workflow Agent enforces this policy at the PR and release level, but all agents must follow it during their work.

---

## Scope Confinement

### Changes must be in scope:
- An agent may only modify files explicitly listed in the task packet's "In scope" section.
- If a file not in scope must be touched to complete the task, the agent must escalate to PM Orchestrator before modifying it.
- Discovering that additional files are needed is normal — proceeding without escalation is a violation.

### No mixing of concerns in a single commit:
- A feature addition must not include an unrelated refactor.
- A bug fix must not include a new feature.
- A dependency update must not include business logic changes.
- If multiple logical changes are needed, they belong in separate commits.

---

## Commit Message Convention

All commits must follow this format:

```txt
<type>(<scope>): <short description>

[optional body — more detail if needed]

[optional footer — breaking changes, issue references]
```

### Allowed types:

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Build, tooling, config, or infrastructure changes |
| `docs` | Documentation only changes |
| `style` | Formatting, tokens, visual changes with no logic change |
| `refactor` | Code restructuring with no feature or bug change |
| `test` | Adding or updating tests |
| `ci` | CI/CD workflow changes |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |

### Examples:

```txt
feat(reservations): add status badge component with 4 states
fix(auth): correct session expiry handling on token refresh
chore(skills): initialize multi-agent skills library
docs(adr): record ORM selection decision — Drizzle over Prisma
ci(github-actions): add playwright E2E job to PR pipeline
```

---

## Before Any Commit

The agent (or Workflow Agent on behalf of the task) must:

1. **Report files changed** — list every file that was created, modified, or deleted.
2. **Verify no out-of-scope files are staged** — `git status` must be reviewed.
3. **Confirm no temporary or generated files are staged:**
   - Python scripts (`*.py`) used for one-time generation → move to `.agents/skills/_archive/tools/`
   - Log files (`*.log`, `*.pid`, `*.log.err`) → must be in `.gitignore`
   - Build artifacts → must be in `.gitignore`
   - `__pycache__/` → must be in `.gitignore`

4. **Confirm the commit message follows the convention above.**

---

## Branch Naming Convention

```txt
<type>/<short-description>
```

Examples:
```txt
feat/reservation-status-badge
fix/auth-session-expiry
chore/skills-library-v1
docs/adr-orm-selection
ci/playwright-e2e-pipeline
```

- Use lowercase and hyphens only (no underscores, no slashes within segments).
- Keep descriptions short (3–5 words maximum).
- Branch from `main` for features and fixes unless the project has a `develop` branch.

---

## Pull Request Requirements

Before a PR may be merged, it must have:

- [ ] Title following commit convention (same `type(scope): description` format)
- [ ] Description explaining what changed and why
- [ ] Link to the issue or task it resolves
- [ ] QA Agent sign-off (for implementation PRs) — PASS or CONDITIONAL PASS
- [ ] All CI checks passing
- [ ] No files outside the stated scope staged

PRs that fail QA sign-off must not be merged, regardless of CI status.

---

## Temporary Files Policy

### Prohibited in project root:
```txt
generate_wrappers.py
audit_skills.py
reorganize_skills.py
*.tmp
*.bak
temp/
```

### Where temporary scripts go:
- One-time generation scripts → `.agents/skills/_archive/tools/`
- Scratch scripts for debugging → `.agents/skills/_archive/tools/` or delete after use

### What must be in `.gitignore`:
```txt
*.log
*.log.err
*.pid
__pycache__/
.env.local
.env.*.local
node_modules/
.next/
dist/
build/
```

---

## Changesets and Release Policy

For version bumps and changelog management, the project uses **Changesets** (default).

### Adding a changeset:

Every PR that changes user-facing behavior must include a changeset file:
```txt
.changeset/<descriptive-slug>.md
```

Changeset format:
```md
---
"casablanca-v1": patch | minor | major
---

[Description of the change for the changelog]
```

Version type guidance:
- `patch` — bug fix, no API change
- `minor` — new feature, backwards compatible
- `major` — breaking change

### Semantic Release alternative:
`semantic-release` is on-demand only. If the project migrates to it, this policy section must be updated and the migration documented in an ADR (Docs Agent).

---

## Gitignore Enforcement

The Workflow Agent must verify `.gitignore` includes all entries above before any release. If entries are missing, they must be added as part of the release task.
