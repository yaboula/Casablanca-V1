# Routing Policy

## Goal

Route tasks with the minimum native agent count required to complete the work well.

## Default

Use the root PM only unless delegation has clear return on:
- specialist domain value
- parallelism
- isolated write scope
- risk containment

## Classification axes

Every task is classified on:
- domain
- task type
- risk
- parallelism

## Default routes

- low-risk sequential task:
  - PM only
- medium-risk single-domain task:
  - PM plus 1 specialist
- parallelizable review:
  - PM plus up to 2 specialists
- high-risk or closure-ready task:
  - add QA by trigger
- trust/data/ops concerns:
  - add the required gate only when triggered

## Mapping rule

PM selects canonical roles first.

PM selects native subagents second using `.codex/canonical-role-map.json`.
