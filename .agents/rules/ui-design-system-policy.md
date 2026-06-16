# UI Design System Policy

**Severity:** required  
**Applies to:** UI Design System Agent (primary), Frontend Agent, UX Agent  
**Version:** 1.0

---

## UI Design System Agent Is Required When the Task Involves:

- Changes to design tokens (color palette, typography scale, spacing, border radius, shadows)
- New components that will be reused across screens
- Significant restyling of existing components
- Introducing a new visual direction or style mode
- Updating the design system documentation

For isolated, clearly spec'd component styling where the token usage is straightforward and the component is already defined, Frontend Agent may implement without activating UI Design System Agent — but must not deviate from existing tokens.

---

## Visual Taste Skill Policy

### Default: `design-taste-frontend`

`design-taste-frontend` is the **default and always-loaded** visual reference for the UI Design System Agent. It is never treated as optional.

### Optional Style Mode

The following skills are `optional-style-mode` and require explicit instruction to activate:

```txt
minimalist-ui
high-end-visual-design
brandkit
image-to-code
imagegen-frontend-web
imagegen-frontend-mobile
stitch-design-taste
gpt-taste
industrial-brutalist-ui
redesign-existing-projects
design-taste-frontend-v1
```

**Rules:**
- Only **one** optional style mode skill may be active at a time.
- Loading must be explicitly requested by the user or PM Orchestrator in the task packet.
- The chosen style mode must be documented in the handoff.
- If no optional style mode is specified, use `design-taste-frontend` only.

### Needs-Review Style Skills

- `open-design` — status: `needs-review`. Do not load without explicit user approval.
- `ui-ux-pro-max` — status: `needs-review`. Do not load without explicit user approval.
- **These two conflict with each other** — never load both simultaneously.

---

## Token Usage Rules

### Required:
- All colors must use design tokens, not arbitrary hex values.
- All spacing values must use the defined spacing scale, not arbitrary pixel values.
- All border radius values must use defined tokens.
- All typography must use the defined type scale (size, weight, line-height).

### Prohibited:
- No arbitrary color values (e.g., `#ff6b6b`, `rgba(255,0,0,0.5)`) outside the token system.
- No hardcoded font sizes in pixels without mapping to the type scale.
- No `!important` overrides to bypass the design system.
- No glassmorphism, heavy decorative shadows, or noisy animations.
- No random gradients.
- No childish motion or heavy runtime animations.

---

## Component Reuse Rules

- Before creating a new component, verify no existing reusable component covers the need.
- If an existing component covers 80%+ of the need, extend it — do not duplicate.
- New components that will be reused must be documented in the component inventory.
- Components must be responsive across all defined breakpoints: 1366, 1440, 1536, 1920, 2560px.

---

## Accessibility Requirement

Accessibility is **non-negotiable** and must not be sacrificed for aesthetics.

Requirements for every component:
- Sufficient color contrast (WCAG 2.2 AA minimum)
- Focus states must be visible and styled (not removed)
- Interactive elements must be keyboard-navigable
- Screen reader labels must be present (aria-label, aria-labelledby, or semantic HTML)
- Touch targets minimum 44×44px on mobile

If a design decision conflicts with accessibility requirements, accessibility takes priority. Escalate to QA Agent for accessibility audit before closing.

---

## Anti-Patterns (Prohibited)

| Anti-pattern | Why prohibited |
|---|---|
| Generic SaaS UI | Product must feel like Nexus Mobility, not a template |
| Glassmorphism | Violates the project's visual language rules |
| Heavy decorative shadows | Adds noise without value |
| Random color palette | Breaks brand consistency |
| Multiple simultaneous taste skills | Creates conflicting visual direction |
| Duplicate components | Fragments the design system |
| Removing focus styles | Breaks keyboard accessibility |

---

## Handoff to Frontend Agent

After completing component specifications, UI Design System Agent must hand off to Frontend Agent with:
- Token references used (not hex values — token names)
- Component visual states documented (default, hover, active, focus, disabled, error)
- Responsive behavior defined
- Accessibility requirements for each component
- Any on-demand skill used and why
