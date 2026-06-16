# Conflict Matrix Policy

**Severity:** blocking  
**Applies to:** all agents, PM Orchestrator  
**Version:** 1.0

---

This is a **blocking rule**. The pairs and groups listed below must never be loaded as simultaneous defaults. Loading both sides of a conflict creates ambiguous, unstable, or unsafe behavior that cannot be resolved without an explicit project-level decision.

---

## Conflict Pairs

### 1. Database ORM — `drizzle-orm` ↔ `prisma-orm`

**Rule:** Never load both as default ORM simultaneously.

| If project uses | Then |
|---|---|
| Drizzle ORM (default) | `prisma-orm` is on-demand only, for legacy/migration scenarios |
| Prisma ORM (explicit migration) | `drizzle-orm` is on-demand only; decision must be documented in ADR |

**Why:** Mixing two ORMs creates schema divergence, migration conflicts, and unpredictable query behavior. The project must commit to one ORM as the source of truth.

**Resolution:** PM Orchestrator must confirm the active ORM choice at the start of any Data Agent task packet.

---

### 2. Authentication — `authjs` ↔ `better-auth`

**Rule:** Never load both as default auth provider simultaneously.

| If project uses | Then |
|---|---|
| Auth.js (default) | `better-auth` is on-demand only, for evaluation or migration |
| Better Auth (explicit decision) | `authjs` is on-demand only; decision documented in ADR |

**Why:** Having two auth providers active simultaneously creates conflicting session handling, middleware conflicts, and security gaps (one provider may allow bypass of the other).

**Resolution:** The auth provider must be declared in the project configuration. Trust Agent confirms the active provider at the start of every auth-related task.

---

### 3. Backend API Strategy — `trpc` ↔ `fastify`

**Rule:** Never load both as the primary backend API strategy simultaneously.

| If project uses | Then |
|---|---|
| tRPC (default) | `fastify` is on-demand only, for standalone microservices |
| Fastify (explicit decision) | `trpc` is on-demand only |

**Why:** Using tRPC and Fastify as simultaneous primary backends creates duplicate route handling, conflicting middleware stacks, and contract confusion for the Frontend Agent.

**Note:** `fastify` may be used alongside tRPC for a specific, isolated microservice endpoint — but it must not be a co-equal primary strategy without an explicit architectural decision.

**Resolution:** Backend Agent confirms the transport strategy in the task packet.

---

### 4. Release Management — `changesets` ↔ `semantic-release`

**Rule:** Never load both as the default release strategy simultaneously.

| If project uses | Then |
|---|---|
| Changesets (default) | `semantic-release` is on-demand only |
| Semantic Release (explicit decision) | `changesets` is on-demand only; decision documented |

**Why:** Both tools attempt to manage versioning and changelogs. Running both simultaneously creates duplicate version bumps and conflicting changelog entries.

**Resolution:** Workflow Agent confirms the release strategy at the start of every release task.

---

### 5. UI Reference System — `open-design` ↔ `ui-ux-pro-max`

**Rule:** Never load both simultaneously.

Both skills have `status: "needs-review"` in the manifest. Neither may be loaded without explicit user approval. If one is approved, the other must remain unloaded for the duration of the task.

**Why:** Both attempt to define a visual reference framework. Loading both creates contradictory visual guidance.

**Resolution:** If the user approves one, document the choice in the task packet and exclude the other.

---

### 6. Visual Taste Skills — Multiple Simultaneous Loads

**Rule:** Never load more than one optional style mode skill simultaneously.

Visual taste skills in `optional-style-mode` category:
```txt
minimalist-ui, high-end-visual-design, brandkit, image-to-code,
imagegen-frontend-web, imagegen-frontend-mobile, stitch-design-taste,
gpt-taste, industrial-brutalist-ui, redesign-existing-projects, design-taste-frontend-v1
```

**Why:** Each taste skill defines a distinct visual philosophy. Loading multiple simultaneously produces incoherent, contradictory design output.

**Resolution:** UI Design System Agent selects exactly one optional style mode per task, based on explicit instruction. `design-taste-frontend` (the default) does not count toward this limit.

---

## Conflict Resolution Protocol

When a potential conflict is detected:

```txt
CONFLICT DETECTED

Conflict pair: [skill A] ↔ [skill B]
Current state: [which is already loaded / active]
Requested: [which is being requested]
Action: Cannot load [skill B] — conflict with active [skill A]
Resolution required: [escalate to PM Orchestrator / confirm project choice]
```

PM Orchestrator must resolve the conflict by:
1. Confirming the active project choice (which tool/strategy is in use)
2. Documenting the choice in the task packet
3. Ensuring only the chosen option is loaded

---

## Adding New Conflicts

If a new conflict is discovered during project evolution, it must be:
1. Added to this policy file
2. Added to `.agents/skills/manifest.json` under `"Conflict matrix"`
3. Added to the relevant skill's `metadata.json` under `"conflicts_with"`
4. Documented in an ADR (Docs Agent)
