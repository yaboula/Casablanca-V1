---
description: main
---

GIT WORKFLOW RULES FOR CASABLANCA-V1

This project has a stable baseline tag:
v1.0-mvp-smoke-stable

Never work directly on main.

Before starting any task:

1. Run:
   git status
   git branch --show-current
2. Confirm the current branch.
3. If the current branch is main, stop and create/switch to a feature branch.
4. If there are uncommitted changes, inspect them before editing.
5. Do not overwrite or discard existing user changes unless explicitly instructed.

Branch rules:

* Main branch must remain stable.
* All new work must happen in a feature branch.
* Use clear branch names, for example:

  * uiux-backend-integration-v2
  * uiux-homepage-integration
  * catalog-premium-redesign
  * booking-flow-polish
  * backend-security-hardening
  * smoke-test-fixes

Commit rules:

* Make small, focused commits.
* One commit should represent one logical change.
* Do not mix unrelated changes in the same commit.
* Do not commit broken code unless explicitly creating a WIP checkpoint.
* Before committing, run the relevant validation commands.

Commit message format:
Use clear messages such as:

* "Add agent workflow rules"
* "Integrate premium homepage hero"
* "Refine catalog trip context UI"
* "Fix vehicle detail booking context"
* "Improve booking form readability"
* "Guard demo bypass routes"
* "Update smoke test for new UI flow"

Before every commit:

1. Run:
   git status
2. Review changed files.
3. Make sure no generated/runtime files are staged.
4. Stage only relevant files.
5. Run relevant validation commands.
6. Commit with a clear message.

Never commit these generated/runtime files:

* node_modules/
* .next/
* dist/
* backend/dist/
* playwright-report/
* test-results/
* .nexus-front.log
* .nexus-front.log.err
* .nexus-front.pid
* *.log
* *.pid
* .env
* .env.local
* backend/.env
* backend/.env.local
* real secrets or private credentials

If these files appear in git status:

* Do not commit them.
* Add them to .gitignore if needed.
* If they are already tracked, ask before using git rm --cached.

Push rules:

* Do not push until the task is complete and validated.
* After committing, push the feature branch:
  git push origin <branch-name>
* Do not force push unless explicitly instructed.
* Do not create or move tags unless explicitly instructed.

Validation before push:
At minimum, run:

* npm run build
* npm run lint

If backend changed, also run:

* cd backend
* npm run build
* npm test -- --runInBand

If API/integration changed, also run:

* cd backend
* npm run test:integration

If core flow changed, also run:

* npm run test:e2e:smoke

Final report after each task:
Always report:

* current branch
* files changed
* commits created
* commit hash
* commands executed
* passing/failing results
* whether changes were pushed
* remaining uncommitted files, if any
* next recommended step

Important:
Git is the safety system.
Do not make large uncontrolled changes without checkpoints.
Do not start a new task while the previous task has uncommitted changes unless explicitly instructed.
