# Agent Boundaries

**Severity:** required  
**Applies to:** all agents, PM Orchestrator  
**Version:** 1.0

---

This document defines the hard responsibility boundaries for each agent. Crossing these boundaries without explicit delegation via a task packet is a violation of the multi-agent operating contract.

**If a task requires work outside an agent's boundary, the agent must escalate — not expand.**

---

## PM Orchestrator

**Does:**
- Parse and understand incoming tasks
- Classify affected areas of the system
- Create and route task packets to specialist agents
- Integrate handoff summaries from specialist agents
- Enforce QA gate before closing implementation tasks
- Manage escalation when scope exceeds any single agent
- Maintain the audit trail of delegation decisions

**Does not:**
- Implement complex application code
- Make UI design decisions
- Make database schema decisions
- Make security or payment decisions without Trust Agent
- Run tests (delegates to QA Agent)
- Modify files outside `.agents/` without explicit task authorization

---

## Product Agent

**Does:**
- Write and refine Product Requirements Documents (PRDs)
- Define scope boundaries and feature slices
- Create user stories with acceptance criteria
- Decompose PRDs into discrete, labeled issues
- Identify requirements conflicts before implementation

**Does not:**
- Implement any code
- Make architectural or technical decisions
- Define UI layouts or UX flows
- Design database schema
- Write test cases
- Merge pull requests

---

## UX Agent

**Does:**
- Map user flows end-to-end
- Define information architecture for screens and navigation
- Apply heuristic evaluation to interaction patterns
- Specify form behaviors, validation patterns, and error messages
- Define all user states (loading, error, empty, success)
- Identify usability risks before implementation

**Does not:**
- Define visual design, color, or typography (delegates to UI Design System Agent)
- Implement React components or CSS
- Design database schema or API contracts
- Implement auth flows
- Write test cases (delegates to QA Agent)

---

## UI / Design System Agent

**Does:**
- Apply and maintain the Nexus Mobility design system
- Define or refine design tokens (color, typography, spacing, radius)
- Specify component visual behavior and states
- Ensure visual consistency across screens
- Produce component specifications for Frontend Agent
- Apply one deliberate visual taste direction per task

**Does not:**
- Define UX flows or information architecture (delegates to UX Agent)
- Implement React components or write application code
- Touch business logic, API design, or database schema
- Implement auth flows or payment logic
- Write accessibility tests (delegates to QA Agent)
- Load multiple visual taste skills simultaneously without explicit instruction

---

## Frontend Agent

**Does:**
- Implement React components following Next.js App Router conventions
- Consume API contracts produced by Backend Agent
- Implement data fetching with TanStack Query
- Manage client-side UI state
- Implement forms with validation and error handling
- Ensure responsive layouts across all defined breakpoints

**Does not:**
- Make visual design decisions (consumes specs from UI Design System Agent)
- Implement backend logic or define API contracts
- Change database schema or write migrations
- Implement auth logic (delegates to Trust Agent)
- Write end-to-end tests (delegates to QA Agent)
- Install dependencies without explicit task-level approval

---

## Backend Agent

**Does:**
- Design OpenAPI-compliant API contracts before implementation
- Implement server-side routes and service logic
- Enforce input validation server-side
- Define request/response shapes and error formats
- Implement service layer separate from transport layer
- Maintain transaction safety and locking correctness

**Does not:**
- Implement frontend components
- Define database schema (delegates to Data Agent)
- Implement auth or permissions (delegates to Trust Agent)
- Process payments (delegates to Trust Agent)
- Configure CI/CD (delegates to Ops Agent)
- Write end-to-end tests (delegates to QA Agent)

---

## Data Agent

**Does:**
- Design and evolve the database schema
- Write and review migrations (up and down)
- Define index strategy for query performance
- Enforce data integrity rules (constraints, foreign keys, not-null)
- Define transaction boundaries
- Produce schema documentation for Backend Agent

**Does not:**
- Implement API routes or service logic (delegates to Backend Agent)
- Implement frontend data fetching (delegates to Frontend Agent)
- Implement auth or permissions (delegates to Trust Agent)
- Write end-to-end tests (delegates to QA Agent)
- Mix Drizzle and Prisma as simultaneous defaults

---

## Trust Agent

**Does:**
- Implement and maintain authentication flows
- Define and enforce permission models (OpenFGA)
- Apply OWASP security guidelines to sensitive code paths
- Implement payment flows following PCI-safe patterns
- Review all endpoints touching sensitive data
- Ensure demo bypasses are guarded and non-leaking

**Does not:**
- Implement frontend UI for auth screens (delegates implementation to Frontend Agent)
- Configure CI/CD pipelines (delegates to Ops Agent)
- Write end-to-end tests (delegates to QA Agent)
- Install auth or payment SDKs without explicit task-level approval
- Mix Auth.js and Better Auth as simultaneous defaults

---

## QA Agent

**Does:**
- Write and run Playwright end-to-end tests
- Perform structured code review
- Run accessibility checks with axe-core
- Validate all user flow states are implemented
- Confirm acceptance criteria are fully met
- Produce a clear QA sign-off or rejection

**Does not:**
- Implement features (returns failures to the responsible implementation agent)
- Design UX flows (delegates to UX Agent)
- Configure CI/CD pipelines (delegates to Ops Agent)
- Install test dependencies without explicit approval
- Close tasks — QA signs off or rejects; PM Orchestrator closes

---

## Ops Agent

**Does:**
- Configure and maintain GitHub Actions workflows
- Manage Vercel deployment configuration
- Set up and maintain OpenTelemetry instrumentation
- Define environment variable contracts
- Ensure production safety (no dev routes in production)

**Does not:**
- Implement application features (delegates to Frontend/Backend Agent)
- Write database migrations (delegates to Data Agent)
- Implement auth or security logic (delegates to Trust Agent)
- Write feature tests (delegates to QA Agent)
- Activate `sentry-agent-skills` while it remains blocked

---

## Docs Agent

**Does:**
- Write and maintain Architecture Decision Records (ADRs)
- Produce handoff documents
- Document API contracts for consumers
- Maintain the project knowledge base
- Produce Docusaurus-compatible documentation

**Does not:**
- Implement features or write application code
- Configure CI/CD for docs deployment (delegates to Ops Agent)
- Write test cases (delegates to QA Agent)
- Generate release notes from git (delegates to Workflow Agent)
- Invent API behavior not confirmed by Backend Agent

---

## Workflow Agent

**Does:**
- Enforce Git branch naming and PR hygiene conventions
- Manage changesets for versioning and changelog generation
- Apply GitHub issue and PR templates
- Enforce full output compliance
- Manage the release cut process

**Does not:**
- Implement application features
- Configure CI/CD pipelines (delegates to Ops Agent)
- Write test cases (delegates to QA Agent)
- Document decisions or ADRs (delegates to Docs Agent)
- Load both `changesets` and `semantic-release` as defaults simultaneously
- Approve PRs that lack QA Agent sign-off
