# Design System and Theme

## Source

The Emergent frontend is the visual source only. It should inspire the final visual language, spacing, premium tone, and component polish. It must not carry production business logic.

## Brand Feeling

Casablanca-V1 should feel:

- premium
- precise
- calm
- airport-native
- trustworthy
- operationally real

## Visual Principles

- Use restraint over decoration.
- Make the product feel expensive through spacing, typography, clarity, and image quality.
- Marketing pages can be more atmospheric.
- Operator/admin surfaces must be quieter, denser, and work-focused.
- Every important action should have a clear visual hierarchy.

## Typography

- Use a strong display style for marketing headlines.
- Use readable sans text for forms, dashboards, and operator/admin.
- Avoid oversized type inside compact tools.
- Do not use viewport-scaled font sizes.
- Avoid negative letter spacing in production UI.

## Colors

Recommended direction:

- white/off-white base
- neutral text scale
- black or near-black for premium contrast
- restrained electric blue accent
- semantic colors for status:
  - green: approved/ready
  - amber: pending/review
  - red: rejected/error
  - blue: active/primary

Avoid:

- one-note blue/purple palette
- heavy gradients
- decorative blobs/orbs
- too many accent colors competing for attention

## Spacing

- Marketing: generous vertical rhythm.
- Forms: compact but breathable.
- Operator/admin: dense but scan-friendly.
- Use consistent section padding and max-widths.

## Radius

- Use moderate radius.
- Cards should generally stay controlled; do not make every element pill-shaped.
- Buttons may be rounded when consistent with premium visual language.
- Data tables and admin panels should use quieter radius.

## Shadows

- Prefer subtle borders and light shadows.
- Avoid heavy floating-card effects.
- Use shadows for hierarchy only where interaction depth matters.

## Motion

Motion should:

- clarify transitions
- make loading and status changes feel responsive
- stay subtle and short

Avoid:

- distracting repeated animations in operator/admin
- motion that blocks task completion
- decorative animation without functional purpose

## Buttons

Buttons should include icons where helpful and use clear states:

- default
- hover
- active
- loading
- disabled
- destructive

Primary CTAs should be obvious. Secondary actions should not compete.

## Cards

Use cards for:

- vehicle cards
- reservation summaries
- ticket pass
- operator rows
- admin table panels

Avoid nesting cards inside cards unless the inner element is a true repeated item or modal.

## Badges

Badges must map to backend statuses through adapters. Do not invent production statuses.

Examples:

- `PENDING_DEPOSIT`
- `AWAITING_CAPTURE`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

## Forms

- Labels always visible.
- Errors near fields.
- Loading state on submit.
- Prevent double-submit where needed.
- Use backend validation messages when available but normalize for UX.

## Layout Shells

| Shell | Use |
|---|---|
| Public shell | marketing/catalog/detail |
| Customer shell | dashboard/journey |
| Operator shell | airport operations |
| Admin shell | management |

Operator/admin shells should not use marketing hero patterns.

## Marketing vs Operational Surfaces

Marketing:

- image-led
- emotional clarity
- strong CTAs
- trust sections

Operational:

- dense
- fast to scan
- table/list forward
- clear status/action pairing

## UX Copywriting Rules

- Be concrete.
- Explain what happens next.
- Avoid unsupported promises.
- Avoid "demo mode" language.
- Avoid fake certainty where backend state is pending.
- Use calm language for rejection and payment failures.

## Accessibility Basics

- keyboard reachable controls
- visible focus states
- semantic headings
- alt text for real vehicle imagery
- sufficient contrast
- form labels tied to inputs
- aria-live for status updates where appropriate
- do not rely on color alone for status

## Visual Patterns to Avoid

- decorative blobs/orbs
- fake QR visuals as production truth
- overly glossy dashboards
- marketing layout inside operator/admin
- hidden labels on forms
- text that overflows buttons/cards on mobile
- unsupported visual status labels

