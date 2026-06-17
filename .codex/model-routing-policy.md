# Model Routing Policy

## Root PM

The root Codex session is the PM Orchestrator.

It uses GPT/OpenAI through Codex and is the final authority for:
- routing
- task packet approval
- sensitive closure
- final synthesis
- deciding whether to spawn subagents

## GPT/OpenAI agents

Only:
- Backend Agent

## Kimi K2.7 Code agents

Primary:
- UI Design System Agent
- Frontend Implementer Agent
- QA Agent

Secondary:
- Code Mapper
- UX
- Frontend Reviewer
- Data
- Docs
- Workflow

## DeepSeek V4-Pro agents

Primary:
- Code Mapper
- Product
- UX
- Frontend Reviewer
- Data
- Trust
- Ops
- Docs
- Workflow

Secondary:
- UI Design System
- Frontend Implementer
- QA

## Final authority

External model agents do not have final authority for:
- security
- payments
- permissions
- auth
- secrets
- PII
- database migrations
- release closure

PM Orchestrator keeps final authority.

## Fireworks model IDs in use

- DeepSeek V4-Pro: `accounts/fireworks/models/deepseek-v4-pro`
- Kimi K2.6: `accounts/fireworks/models/kimi-k2p6`
