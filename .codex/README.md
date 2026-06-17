# Codex Native Subagents v1

These are project-scoped Codex native custom subagents.

The canonical multi-agent operating system remains `.agents/`. The root Codex session acts as the PM Orchestrator and is responsible for reading the canonical manifests, selecting the minimum necessary workflow, preparing the Task Packet, and coordinating handoffs.

Subagents are spawned only when explicitly requested. In v1, all custom subagents are read-only and intended for analysis, mapping, review, QA validation, and closure recommendations.

Use these subagents first for analysis and review tasks. Do not use them for write-heavy parallel implementation yet.

All v1 subagents must:
- stay read-only
- avoid dependency installation
- avoid modifying `package.json` or lockfiles
- avoid modifying `.agents/`
- return concise handoff summaries
- cite inspected files and symbols when possible
