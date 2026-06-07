---
trigger: always_on
---

CASABLANCA-V1 AGENT RULES

Project identity:
Casablanca-V1 is a premium airport car rental platform for travelers arriving at Casablanca Mohammed V Airport.

Quality target:
The project must feel like a serious 2026 full-stack product:

* premium UI/UX
* reliable frontend-backend integration
* secure backend
* clean code
* optimized performance
* realistic demo flow
* portfolio-ready quality

General rules:

1. Never break the stable MVP flow.
2. Never redesign unrelated screens during a focused task.
3. Never change API contracts without explaining why.
4. Never duplicate business logic between frontend and backend.
5. Never fake backend success in the UI.
6. Never hide demo mode as production behavior.
7. Never introduce real secrets into the repo.
8. Never commit generated logs, reports, PID files, or build artifacts.
9. Never use glassmorphism or heavy decorative shadows.
10. Never create generic SaaS UI.
11. Never use random gradients, noisy animations, or childish motion.
12. Never make text too small for the sake of minimalism.
13. Never optimize only for one screen size.
14. Never make a page beautiful but disconnected from the product flow.
15. Never leave dead ends in the user journey.

UI/UX rules:

* Premium, minimal, calm, product-grade.
* Strong hierarchy.
* Clear CTA logic.
* Consistent branding: Nexus Mobility.
* Consistent status language.
* Desktop scaling must work across 1366, 1440, 1536, 1920 and 2560 widths.
* Mobile/tablet must remain clean and touch-friendly.
* Use fluid sizing, clamp typography, max-width containers and controlled spacing.
* Avoid fragile absolute positioning.
* Avoid duplicated user input across screens.
* Preserve journey context from home to catalog to booking.

Backend rules:

* Security first.
* Validate inputs server-side.
* Do not trust frontend state.
* Keep auth and role checks strong.
* Keep demo bypasses explicit and guarded.
* Do not expose dev routes in production.
* Preserve transaction safety and locking correctness.
* Avoid N+1 queries and unnecessary heavy joins.
* Keep environment variables documented.

Integration rules:

* Frontend must consume backend through clear API helpers.
* No hardcoded pickup/date data when user context exists.
* Reservation state must be consistent across customer and operator screens.
* Error states must be honest and useful.
* Loading states must be polished.
* Empty states must guide the user.

Performance rules:

* Optimize images.
* Avoid layout shift.
* Use lazy loading where appropriate.
* Keep hero assets lightweight.
* Avoid heavy runtime animations.
* Do not add large dependencies without justification.

## Installed Skills Usage Rules

This project uses installed Antigravity project skills located under:

.agents/skills/

The agent must use them automatically.

The user should not need to repeat skill names in every prompt.

### Baseline Skill Rule

For every task, always apply:

* using-agent-skills
* incremental-implementation
* git-workflow-and-versioning
* verification-before-completion
* code-review-and-quality

### Automatic Area Detection

The agent must inspect the task and touched files, then activate the correct skill group:

Frontend/UI tasks:

* emil-design-eng
* impeccable
* design-taste-frontend
* high-end-visual-design
* minimalist-ui
* frontend-ui-engineering
* web-design-guidelines
* performance-optimization
* vercel-react-best-practices
* vercel-composition-patterns
* vercel-optimize

Animation/transition tasks:

* vercel-react-view-transitions

Backend/API/security tasks:

* api-and-interface-design
* security-and-hardening
* debugging-and-error-recovery
* code-review-and-quality

Database/PostgreSQL tasks:

* supabase-postgres-best-practices

Testing/QA/debugging tasks:

* webapp-testing
* verification-before-completion
* systematic-debugging
* debugging-and-error-recovery

Documentation/CI tasks:

* documentation-and-adrs
* ci-cd-and-automation
* writing-guidelines when user-facing copy is involved

### Reporting Rule

Every task report must include:

* selected skills
* why those skills were selected
* branch name
* files changed
* validation commands run
* test/build/lint results
* remaining risks

### Safety Rule

Do not blindly apply every installed skill to every task.

Use only relevant skills:

* Do not use database skills for pure UI work.
* Do not use UI taste skills to change backend logic.
* Do not use CI/CD skills unless workflow or automation files are touched.
* Do not use documentation skills unless docs, README, or user-facing explanation are touched.

The goal is better judgment, not more noise.


Validation rules:
After any meaningful change, run the smallest relevant validation set.
If core flow changes, run the smoke test.
If backend behavior changes, run backend unit and integration tests.
If UI changes, run build and lint at minimum.