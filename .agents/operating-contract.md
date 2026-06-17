# Global Operating Contract

This contract defines the absolute invariants of the multi-agent system. These rules apply universally and cannot be overridden by workflows, agent preferences, or individual task packets.

- No non-trivial work without a task packet.
- No implementation closure without a QA handoff.
- No dependency install without explicit user approval.
- No sensitive change (auth, payments, secrets, PII) without Trust Agent.
- No schema or migration change without Data Agent.
- No broad refactor inside a bugfix workflow.
- No multi-agent activation without a routing justification.
- No modifying skills, agents, rules, or workflows during normal task execution.
