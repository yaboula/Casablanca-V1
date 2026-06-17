# Context Budget Policy

## Goal

Keep context informative, small, and task-shaped.

## Default context bundle

Every subagent should receive only:
- objective
- scope
- constraints
- acceptance target
- compact prior summary
- relevant files
- output contract

## File budget

Default target:
- 5 to 15 directly relevant files

Expand only when task complexity requires it.

## Never include by default

- full repo summaries
- full policy libraries
- all manifests
- all workflows
- all rules
- long chat history
- large raw logs
- repetitive prior handoffs

## Retrieval rule

Use progressive disclosure:
1. pass a small starter bundle
2. let the subagent search
3. load more only when needed
