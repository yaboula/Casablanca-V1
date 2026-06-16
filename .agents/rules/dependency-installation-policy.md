# Dependency Installation Policy

**Severity:** blocking  
**Applies to:** all agents  
**Version:** 1.0

---

This is a **blocking rule**. No agent may install, propose to install, or assume that a dependency will be installed without explicit user approval in the active task packet.

---

## Core Prohibitions

### Prohibited commands — no agent may execute these without explicit approval:

```txt
npm install [package]
npm i [package]
pnpm add [package]
pnpm install [package]
bun add [package]
yarn add [package]
npx [installer] [target]
npx create-[anything]
git clone [repo] (for dependency purposes)
```

### Prohibited file modifications without explicit approval:

```txt
package.json (dependencies, devDependencies, peerDependencies)
package-lock.json
pnpm-lock.yaml
bun.lockb
yarn.lock
```

---

## What Wrapper Skills Do NOT Grant

The presence of a skill in `.agents/skills/` — whether `real-skill`, `generated-wrapper`, or `tool-reference` — **does not authorize installing the corresponding package**.

Wrapper skills are **reference documents**. They describe how a tool works and when to use it. They are not install permissions.

> Example: The existence of `.agents/skills/database/drizzle-orm/` does NOT mean `drizzle-orm` may be added to `package.json`. It means the agent knows how to work with Drizzle if the project already has it installed.

---

## When Installation Is Allowed

A dependency may be installed **only when all of the following are true:**

1. The task packet explicitly lists the package as a required dependency.
2. The user has confirmed the installation in the current session (not a past session).
3. The agent has presented a dependency proposal (see format below) and received explicit approval.
4. No blocking conflict exists with already-installed packages.

---

## Dependency Proposal Format

Before proposing any dependency installation, the agent must present this information:

```txt
DEPENDENCY PROPOSAL

Package: [package name and version]
Registry: [npm / pnpm catalog / bun]
Reason: [why this specific package is needed for this task]
Alternative: [what alternative packages were considered and why rejected]
Impact: [what this adds to the bundle / build / runtime]
Files that would change:
  - package.json (dependencies / devDependencies)
  - [any other files]
Rollback: [how to remove this if it causes issues]
Conflicts: [any known conflicts with existing packages]
Approval required from: [user / PM Orchestrator]
```

This proposal must appear in the task packet or as an escalation to PM Orchestrator before any installation command is executed.

---

## SaaS SDK Policy

SaaS SDKs (Stripe, Resend, Novu, Cloudinary, UploadThing, etc.) have corresponding wrapper skills in `.agents/skills/`.

These wrappers:
- Describe the SDK's API and usage patterns
- Define conflict and risk notes
- Do **not** authorize installing the SDK

Installing a SaaS SDK requires the same dependency proposal process above, with the additional note that:
- The SDK's secret keys and API credentials must be documented as environment variables, never hardcoded
- The Trust Agent must be involved for SDKs that process payments or handle sensitive user data

---

## Devtools and CLI Tools

CLI tools used only in development (e.g., Playwright CLI, Lighthouse CI, Storybook CLI) require the same proposal process but may be placed in `devDependencies`. The proposal must still be approved before installation.

---

## Violation Consequence

If an agent installs or proposes installing a dependency without following this policy:
1. The task packet must be flagged as invalid.
2. PM Orchestrator must escalate to the user.
3. The installation must be reversed if it was executed.
4. The handoff must document the violation.
