# Frontend Design System Spec Patch

Date: 2026-06-09

## Purpose

The audits agree that Casablanca-V1 has a strong premium visual direction, but the design system is not yet implementable enough for multiple agents or developers to build consistently. This patch records the current candidate values found in the repo and marks missing final decisions explicitly.

No value below should be treated as final if it is marked "Decision required".

## Current Candidate Values Found In Repo

| Area | Candidate value | Source | Status |
|---|---|---|---|
| Body font | `Satoshi`, fallback `Outfit`, system UI | `src/index.css` | Candidate only; production loading strategy must change |
| Display font | `Outfit`, fallback `Satoshi` | `src/index.css` `.font-display` | Candidate only |
| Mono font | `JetBrains Mono`, fallback monospace | `src/index.css` | Candidate only; actual source not confirmed |
| Font loading | Google Fonts and Fontshare via CSS `@import` | `src/index.css` | Not acceptable for production Next build |
| Shadcn style | `new-york` | `components.json` | Keep unless a future design decision changes it |
| Shadcn RSC | `false` | `components.json` | Must be revisited for Next App Router |
| Icons | `lucide` | `components.json` | Keep |
| Base color | `neutral` | `components.json` | Candidate |
| Radius | `--radius: 1rem` | `src/index.css` | Candidate, but flagged as too soft for operational UI |
| Accent | `--nx-accent: #1e41fc` and `--accent: 230 98% 55%` | `src/index.css` | Candidate |
| Ink | `--nx-ink: #0a0a0a` | `src/index.css` | Candidate |
| Muted ink | `--nx-ink-soft: #525252` | `src/index.css` | Candidate |
| Lines | `--nx-line: #e5e5e5`, `--nx-line-soft: #f0f0f0` | `src/index.css` | Candidate |
| Background | `--nx-bg: #ffffff`, `--nx-bg-soft: #fafafa` | `src/index.css` | Candidate |
| Destructive | `--destructive: 0 72% 51%` | `src/index.css` | Candidate |
| Chart colors | `chart-1` to `chart-5` referenced | `tailwind.config.js` | Missing values; decision required |
| Dark mode | Partial `background`, `foreground`, `primary`, `border` only | `src/index.css` | Incomplete; do not ship as feature |

## Required Token Decisions

| Token group | Required decision |
|---|---|
| Neutral scale | Define full neutral scale or explicitly inherit Tailwind neutral |
| Brand/accent | Confirm whether `#1e41fc` remains the primary accent |
| Success | Define status token for approved/complete/success states |
| Warning | Define token distinct from destructive for pending/review/attention states |
| Info | Define token for neutral informational notices |
| Destructive | Confirm current red token and foreground contrast |
| Focus ring | Define color, width, offset, and contrast behavior |
| Chart colors | Define `chart-1` through `chart-5` or remove references |
| Radius scale | Define marketing, card, input, button, modal, and operational table radii |
| Shadow scale | Define whether shadows are allowed and where |
| Spacing scale | Confirm Tailwind spacing defaults or add Casablanca-specific semantic spacing |
| Container widths | Define public, catalog, detail, form, dashboard, operator, and admin max widths |

## Recommended Token Policy

| Rule | Requirement |
|---|---|
| Semantic first | Components should consume semantic tokens, not raw colors |
| Hardcoded hex | Only allowed inside token definitions |
| Status clarity | Every status must combine label, icon or shape, and color |
| Operational restraint | Operator/admin UI should be denser and quieter than marketing pages |
| Marketing restraint | Premium does not mean blur-heavy, gradient-heavy, or oversized type everywhere |
| Contrast | All foreground/background pairs must pass WCAG AA |

## Typography Patch

| Area | Decision |
|---|---|
| Font source | Decision required: keep Satoshi/Outfit via `next/font/local` or replace with available Next-compatible fonts |
| CSS imports | Must be removed from production global CSS |
| Display usage | Use display font only for hero/page headings and selected marketing moments |
| Body usage | Use body font for all long-form, forms, tables, cards, and operational UI |
| Letter spacing | Current `.font-display` uses `-0.03em`; audits flag tight tracking. Re-evaluate before reuse |
| Clamp scale | Existing clamp usage is promising, but route-specific heading sizes still need definition |

## Component Radius Guidance

Current `--radius: 1rem` can make operational UI feel soft. Use this as a patch until final values are accepted:

| Component type | Guidance |
|---|---|
| Buttons/inputs | Moderate radius; avoid pill shapes unless filtering/tags require them |
| Cards | 8px or less unless the final design system explicitly says otherwise |
| Marketing hero elements | May use softer shapes if they do not reduce clarity |
| Operator/admin tables | Tight radius and clear borders |
| Modals/sheets | Moderate radius with strong focus and escape behavior |

## Motion Patch

Current CSS contains `nx-rise`, `nx-fade`, and `nx-marquee`. These are candidates, not a full motion system.

| Rule | Requirement |
|---|---|
| Duration | Decision required for short, medium, and long transitions |
| Easing | Current `cubic-bezier(0.16, 1, 0.3, 1)` is a candidate |
| Reduced motion | Required for all non-essential motion |
| Loading | No fake delays; animation should communicate real system state |
| Marquee | Avoid for critical information |

## Responsive Patch

| Area | Requirement |
|---|---|
| Breakpoints | Decision required: keep Tailwind defaults or define project-specific breakpoints |
| Touch targets | 44x44 px minimum; 48x48 px preferred for airport mobile workflows |
| Catalog grid | Must avoid excessive choice density on mobile |
| Forms | Labels and errors must not collapse into unreadable compact states |
| Operator/admin | Responsive behavior must preserve operational scanability |

## Dark Mode Patch

Dark mode is currently incomplete. It should not be a production feature until the full semantic token set is implemented for:

| Required token group |
|---|
| Background, foreground, card, popover |
| Primary, secondary, accent |
| Muted, border, input, ring |
| Success, warning, info, destructive |
| Charts and status badges |
| Focus and selection |

Phase 1 should either ship light-only or complete dark mode as a deliberate design task.

