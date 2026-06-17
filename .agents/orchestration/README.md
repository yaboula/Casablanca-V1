# .agents/orchestration/

This directory defines the **runtime behavior** of the PM Orchestrator. It contains the logic for how the PM Orchestrator executes its central role in the multi-agent system.

## Contents

- `pm-orchestrator-runtime.md` — The overall runtime loop for the PM Orchestrator.
- `task-intake-runtime.md` — Logic for converting a raw request into a task packet.
- `routing-runtime.md` — Logic for selecting agents and defining the execution path.
- `closure-runtime.md` — Logic for evaluating task completion, integrating handoffs, and closing or escalating.
