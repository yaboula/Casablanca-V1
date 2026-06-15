# 23 - Configuration Governance and Safety

**Type:** Cross-cutting governance model for sensitive Admin configuration.
**Scope:** Financial Policies, Roles & Permissions, Business Rules, Pricing Rules, Notification Templates, Handover / Contract Terms. No backend workflow engine, database schema, API, auth, or infrastructure design.
**Authority:** This document defines the product/UX safety model for configuration changes. It is referenced by `21`, `22`, `M-08`, `M-11`, `M-12`, and `M-06`.
**ID scheme:** Governance requirements use `GOV-###`.

---

## 1. Why governance exists

Configuration is a commercial strength only if it is safe. A rental business owner should be able to change policy without a developer, but the system must prevent accidental financial loss, privilege mistakes, inconsistent customer terms, and silent operational changes.

Governance turns settings from "editable fields" into controlled business decisions.

## 2. Governance principles

- **GOV-001 - Preview before commitment:** Sensitive configuration changes show before/after impact before save.
- **GOV-002 - Reason for sensitive changes:** Money, access, customer terms, release gates, pricing, and notification changes require a reason.
- **GOV-003 - Approval for high-risk changes:** Changes that can materially affect money, access, customer obligations, or vehicle release require approval where configured or product-mandated.
- **GOV-004 - Version everything important:** Sensitive settings create version history. History is not editable from the product UI.
- **GOV-005 - Effective dates:** Operationally meaningful changes use explicit effective dates and never silently apply retroactively.
- **GOV-006 - Protect existing reservations:** Existing reservations retain the policy/version they were created or confirmed under unless a permitted admin explicitly applies a new policy with preview, reason, and audit.
- **GOV-007 - Prevent contradictions:** The UI detects and blocks contradictory rules before save.
- **GOV-008 - Explain risk in business language:** Warnings say what can go wrong: unpaid balance, under-secured deposit, over-refund, hidden customer message, staff privilege escalation.
- **GOV-009 - Rollback is a new action:** Rollback restores prior values as a new version; it never deletes the bad version.
- **GOV-010 - No unsafe free logic:** Governance applies only to structured configuration. It never authorizes arbitrary code, formulas, or developer rule syntax.

## 3. Change risk levels

| Risk level | Examples | Requirements |
|---|---|---|
| Low | Rename setting label, reorder non-critical extra, edit internal description. | Save confirmation, audit if persistent. |
| Medium | Business hours, pickup instruction text, notification copy, non-money extra label. | Preview, reason optional or required by tenant policy, version where customer-facing. |
| High | Deposit amount, cancellation fee, release gate, refund rule, tax display, role sensitive capability, pricing rule, contract term. | Preview, reason, simulation or diff, approval, version, effective date, audit. |
| Critical | Disable deposit requirement, loosen release gate, grant role-editing or refund authority, currency change, last-owner access change, legal contract term replacement. | Strong warning, approval by owner or configured approver, separation-of-duties check, scheduled effective date, rollback available, explicit affected-reservations review. |

## 4. Governance by area

| Area | Who can edit | Who can approve | Required preview | Reason | Effective date | Versioning | Rollback | Locked/protected |
|---|---|---|---|---|---|---|---|---|
| Financial Policies | `PERM-062` | `PERM-063` / Owner | Policy simulator and customer/admin/operator impact | Required | Required | Required | Required | No arbitrary formulas; no retroactive silent changes; secured/at-risk logic protected. |
| Roles & Permissions | `PERM-052`; sensitive grants need `PERM-066` | Owner or configured access approver | Capability diff and assigned-staff impact | Required for sensitive changes | Optional, required for bulk role template changes | Required | Required | No self-escalation; no last-owner removal; locked system capabilities. |
| Business Rules | `PERM-060`; sensitive sections `PERM-061` | Owner for sensitive rules | Section preview | Required for sensitive rules | Required when customer/operator impact changes | Required for sensitive sections | Required | Locations/hours must not create impossible pickup/return coverage without warning. |
| Pricing Rules | `PERM-090` | Owner or pricing approver | Sample price preview and precedence/conflict view | Required | Required | Required | Required | No hidden customer price changes; no opaque precedence. |
| Notification Templates | `PERM-100` | Optional except mass-customer/high-risk messages | Message preview by audience/channel | Required for enabling mass/customer-impacting messages | Optional, required for campaign-like enabling | Required | Required | No missing variables; no spammy default mass enable. |
| Handover / Contract Terms | `PERM-041` / `PERM-061` | Owner/legal approver where configured | Customer contract preview and operator checklist impact | Required | Required | Required | Required | Completed handovers/contracts are not rewritten. |

## 5. Approval model

Approval is a product workflow concept, not a backend design. The UX must support:

- draft created by editor;
- validation and preview completed;
- reason entered;
- approver sees diff, simulator/preview, reason, affected areas, and risk warnings;
- approver approves or rejects with reason;
- approved change is scheduled or made active according to its effective-date rules;
- rejected change returns to draft with comments;
- all steps appear in audit/history.

### Separation-of-duties warnings

The UI warns or blocks when the same person can both create and approve a high-risk change:

- financial policy draft + approval;
- refund execution + refund policy change;
- role editing + granting self access;
- pricing rule edit + approval;
- contract term edit + approval.

The product must always block self-escalation and last-owner removal. Other separation-of-duties rules may be warnings or approval requirements depending on tenant policy.

## 6. Existing reservation protection

Existing reservations must never silently inherit a later policy change.

When a change may affect reservations, the preview must show:

- new bookings affected from effective date;
- existing future reservations that keep old policy;
- reservations that may need manual review;
- customer-facing terms already accepted;
- operator release-gate impact;
- financial delta if applied manually.

If applying a new policy to selected existing future reservations is allowed, it requires:

- explicit selection;
- per-reservation preview;
- customer notification requirement if terms change;
- reason;
- approval for high-risk changes;
- audit entry per affected reservation.

Completed reservations, completed handovers, issued invoices, and completed contracts are not rewritten. Corrections use new, audited adjustment actions.

## 7. Contradiction prevention

The UI must block save for contradictions such as:

- cancellation window overlap or impossible ordering;
- no-show before pickup grace period starts;
- release gate requires a deposit but all deposit rules waive it;
- refund rule allows more than captured amount;
- damage charge captures more than held deposit;
- pricing precedence creates duplicate winner rules without a visible priority;
- notification template enabled with missing required variables;
- role has approval responsibility but no ability to view the policy it approves;
- all roles lose access to staff/roles/audit recovery capabilities.

## 8. Unsafe configuration warnings

Warnings must be concrete, not generic. Examples:

- "This would allow release with EUR 0 deposit on premium vehicles."
- "This role can issue refunds and approve its own refund-policy changes."
- "This cancellation rule keeps 100% of payment inside 48 hours; customer terms will change."
- "This tax change affects invoice display for new bookings from the effective date."
- "No staff role would be able to approve future financial policy changes."

Warnings are announced and keyboard reachable per `16`; copy follows `19`.

## 9. Audit requirements

Audit entries for governed changes include:

- actor;
- action;
- policy/configuration area;
- old value and new value in business language;
- reason;
- approval actor and approval reason, if applicable;
- effective date;
- affected screens/customer messages/operator instructions;
- version number;
- rollback source version, if applicable;
- related reservations if explicitly applied.

Audit logs must be readable sentences, not raw technical events.

## 10. Version history and rollback

Every governed area exposes:

- active version;
- scheduled version;
- previous versions;
- compare two versions;
- view reason and approval;
- rollback to prior version as a new draft/action;
- export history where audit permission allows.

Rollback is available when:

- prior version is valid under current product constraints;
- rollback does not silently rewrite existing reservations;
- required approver approves high-risk rollback;
- effective date is explicit.

If rollback is unsafe, the UI explains why and offers a safer corrective draft.

## 11. Accessibility, forms, and localization

- Governed change flows use modal/drawer focus behavior from `16 10.2`.
- Diff tables use accessible table semantics from `16 10.1`.
- Required reason fields follow `18 FV-001..015`.
- Money previews follow `18 5`.
- Error and warning text maps to `18` error classes and `19` message standards.
- Customer-facing previews must be localization-ready and tolerate French/Arabic expansion.

## 12. Acceptance criteria

- [ ] Sensitive configuration changes require preview, reason, audit, versioning, and effective-date handling.
- [ ] High-risk changes require approval or an explicit product-mandated safety block.
- [ ] Existing reservations are protected from silent retroactive changes.
- [ ] Contradictory rules are blocked before save with business-language explanations.
- [ ] Unsafe but technically valid configurations show concrete warnings.
- [ ] Rollback is available as a new audited version where safe.
- [ ] Financial Policies, Roles & Permissions, Business Rules, Pricing Rules, Notification Templates, and Handover/Contract Terms all reference this governance model.
- [ ] No governance flow authorizes arbitrary formulas, code, or developer rule syntax.
