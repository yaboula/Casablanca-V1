# Spawn Policy

## Goal

Spawn subagents only when delegation creates net value.

## Spawn when

- a distinct specialist domain is involved
- the work is parallelizable
- the subtask has a disjoint write scope
- the subtask is a sidecar task that does not block the PM's next step
- independent validation can run in parallel

## Do not spawn when

- the task is sequential and the PM is blocked on the result
- the subagent would need almost all of the PM context
- the handoff cost exceeds the likely gain
- the PM can complete the task directly with equal or better reliability

## Fan-out

- default: 0 specialists
- common: 1 specialist
- upper bound without explicit justification: 2 specialists

## Dispatch packet

Every subagent dispatch should include:
- objective
- in-scope items
- out-of-scope items
- relevant files
- risk level
- constraints
- output format
- escalation conditions
