# Permission Policy

## Read-only agents

- Code Mapper
- Frontend Reviewer
- Data by default
- Trust
- Ops by default

## Docs/tickets write agents

- Product
- UX
- Docs
- Workflow

## Limited write agents

- UI Design System
- QA

## Code write agents

- Frontend Implementer
- Backend Agent

## Gated write areas

The following require explicit PM approval:
- database migrations
- CI/CD
- Docker
- secrets
- auth
- permissions
- payments
- PII
- package.json
- lockfiles
- dependency installation

## Forbidden globally

- danger-full-access
- dependency installs without approval
- package.json changes without approval
- secrets in repo
- modifying `.agents/` during normal task execution
- modifying `.codex/` during normal task execution
