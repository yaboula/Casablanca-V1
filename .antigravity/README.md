# Antigravity Adapter

This repository uses `.agents/` as its canonical multi-agent operating system.

Antigravity agents should use project artifacts in this order:

1. `AGENTS.md`
2. `.agents/system.manifest.json`
3. `.agents/activation-guide.md`
4. `.agents/routing-table.md`
5. `.agents/task-packet.template.md`
6. `.agents/handoff.template.md`

For Antigravity artifacts:
- implementation plans should map to Task Packets
- task lists should map to selected workflows
- screenshots/browser recordings should be attached to QA or validation handoffs
- comments on artifacts should be reflected in the Handoff Summary

Do not assume this file is automatically loaded by Antigravity unless the tool confirms it.
Use `AGENTS.md` as the universal entrypoint.
