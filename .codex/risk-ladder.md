# Risk Ladder

## Low risk

Examples:
- narrow analysis
- local review
- minor docs

Default pattern:
- PM only
- no QA by default

## Medium risk

Examples:
- bounded implementation
- frontend change
- moderate refactor

Default pattern:
- PM plus 1 specialist
- QA by trigger

## High risk

Examples:
- shared behavior change
- cross-module implementation
- release-facing fix

Default pattern:
- PM plus specialist
- QA required
- add required gate if triggered

## Critical risk

Examples:
- auth
- permissions
- payments
- secrets
- PII
- schema migrations
- deploy or release gates

Default pattern:
- PM
- required domain gate
- QA required
- human approval before closure
