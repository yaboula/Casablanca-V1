# Operational Routing Table

This table guides PM Orchestrator in selecting workflows and agents based on the raw request type.

| Raw Request Type | Workflow | Required Agents | Optional Agents | Risk Level | QA Required |
|---|---|---|---|---|---|
| Product requirement | `feature-development` | PM, Product | UX, Docs | low | No |
| UX flow | `feature-development` | PM, UX | UI, Product | low | No |
| UI visual change | `ui-change` | PM, UI, Frontend, QA | UX | low | Yes |
| Frontend feature | `feature-development` | PM, Frontend, QA | UI, UX | medium | Yes |
| Backend API | `backend-api` | PM, Backend, QA | Data, Trust, Frontend | medium | Yes |
| Database/schema change | `data-change` | PM, Data, Backend, QA | Trust, Ops | high | Yes |
| Auth/security/payment | `trust-sensitive-change` | PM, Trust, QA | Backend, Data, Ops | critical | Yes |
| Bugfix | `bugfix-debugging` | PM, Specialist, QA | Ops, Trust, Data | medium | Yes |
| Documentation update | `documentation-update` | Docs | PM, Workflow | low | No |
| Dependency proposal | `dependency-proposal` | PM, Workflow | Trust, Ops, QA | medium | No |
| Release readiness | `release-readiness` | PM, QA, Ops, Workflow | Trust, Data, Docs | high | Yes |
| Retrospective | `workflow-retrospective` | PM, Workflow | QA, Docs | low | No |
