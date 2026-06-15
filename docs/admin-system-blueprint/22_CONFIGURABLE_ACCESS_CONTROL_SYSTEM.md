# 22 - Configurable Access Control System

**Type:** Product/UX functional specification for configurable access control.
**Scope:** Staff, roles, permissions, capability templates, custom roles, sensitive permission changes, simulation, and emergency revoke. No authentication architecture, token design, database schema, or API design.
**Authority:** This document reframes `M-07` from static role-template thinking into a configurable access-control system. `11` remains the permission catalog and default-grant matrix; this document defines the safe UX model for editing it.
**ID scheme:** Access-control configuration requirements use `ACC-###`.

---

## 1. Product position

The Admin must let the owner delegate work without losing control. Default role templates are useful starting points, but a serious rental business needs custom roles and capability-based access.

```txt
Default roles are templates.
Capabilities are the source of truth.
Custom roles are allowed inside safety guardrails.
```

This is not a developer RBAC editor. It is a business-language access-control surface for owners and supervisors.

## 2. Default role templates

The existing profiles remain and become locked default templates that can be cloned:

| Template | Purpose |
|---|---|
| Owner / CEO | Full business control, approvals, money, staff, audit. |
| Operations Manager | Daily reservation, fleet, release, and operational control. |
| Branch / Airport Manager | Local execution oversight and controlled intervention. |
| Finance Admin | Payments, deposits, refunds, invoices, reconciliation. |
| Fleet Manager | Vehicle status, documents, maintenance, availability. |
| Supervisor | Staff oversight, audit review, controlled role assignment. |

Templates cannot be deleted. Their default grants can be updated only through the governed role-template update flow. A business may clone a template into a custom role and then edit the clone.

## 3. Capability model

- **ACC-001 - Business-language capabilities:** Capabilities read as business actions, such as "Can issue refunds" or "Can approve financial policy changes."
- **ACC-002 - Domain groups:** Capabilities are grouped by domain: Command Center, Reservations, Documents, Money, Fleet, Handover, Customers, Maintenance, Pricing, Financial Policies, Notifications, Staff, Roles, Settings, Reports, Audit.
- **ACC-003 - Sensitive capabilities:** Capabilities that move money, change release readiness, expose PII, change financial policy, change access, or erase operational safety are visually marked and require stronger confirmation.
- **ACC-004 - Locked system capabilities:** Some capabilities cannot be removed from all roles if doing so would make the business unmanageable or unsafe.
- **ACC-005 - Capability dependencies:** If a capability requires another capability, the UI explains and can add the dependency with preview.
- **ACC-006 - No technical strings:** Internal scope names, route names, and permission codes are not shown as the primary label.

## 4. Screens and layout

### 4.1 Roles & permissions (`SCR-072`)

**Layout:**

- Header: Roles & permissions, save status, "Create custom role", "View as role".
- Left rail: role list with templates and custom roles.
- Main panel: selected role detail.
- Right panel: permission diff / risk / staff assigned.

**Selected role detail sections:**

- role name and description;
- template source, if cloned;
- assigned staff count;
- domain-grouped capabilities;
- sensitive capabilities section;
- locked/protected capability notices;
- change history;
- version and effective date if scheduled.

### 4.2 Staff member detail (`SCR-071`)

Adds:

- assigned role;
- direct emergency suspension state;
- capability summary;
- "compare with role" diff if temporary exceptions are ever introduced later;
- recent access changes;
- active session revoke status (UX only, no auth implementation details).

### 4.3 Permission simulator / view as role

The simulator answers:

- Which screens would this role see?
- Which actions are hidden, locked, or disabled?
- Which money, PII, audit, and financial-policy values are visible?
- Can this role complete common workflows: cancel reservation, refund, change deposit policy, invite staff, approve role change?

Simulator output is read-only and must not alter the admin's actual session.

## 5. Configurable access concepts

| Concept | Configurable | Locked/protected | Who can change | Confirmation, reason, audit, preview |
|---|---|---|---|---|
| Default role templates | Template grants may be revised through governed template-update flow. | Templates cannot be deleted; Owner template cannot lose owner-safety capabilities. | Owner with `PERM-052`; approval may be required by `23`. | Diff preview, reason, audit, version history. |
| Custom roles | Name, description, cloned template source, capabilities, assigned staff. | Cannot create a role with no viewable home; cannot remove all staff/admin management from every role. | `PERM-052`; sensitive capabilities may require `PERM-066`. | Capability diff, assigned-staff impact, reason, audit. |
| Capability grants | Toggle capabilities by domain and sensitivity. | Locked capabilities and dependencies cannot be broken silently. | Role editor with sufficient capability and no self-escalation. | Preview screens/actions/data unlocked or removed. |
| Sensitive capabilities | Grant/remove money, override, release, financial policy, staff, role, audit capabilities. | Some require separation-of-duties warning or approval. | Owner or approved role admin. | Strong confirmation, reason, approval, audit. |
| Role cloning | Clone a default template or custom role. | Clone does not inherit hidden system metadata; template remains unchanged. | `PERM-052`. | Shows source and differences before activation. |
| Role editing | Edit description and capability grants. | Cannot edit locked system role into unsafe state. | `PERM-052`; approval for sensitive changes. | Diff before save; assigned-staff impact. |
| Staff assignment | Assign staff to default or custom role. | Cannot assign a role above editor authority; cannot self-escalate. | `PERM-051`. | Diff of old vs new access; reason for sensitive upgrade/downgrade. |
| Restricted self-editing | Admin can view own role but not grant self capabilities. | No self-escalation; no self-lockout. | Another authorized admin. | Blocked with explanation. |
| Last-owner / last-admin protection | N/A. | Last owner/admin cannot be downgraded, deactivated, or stripped of critical access. | Not overrideable in P0/P1. | Blocking message explains business safety. |
| Separation of duties | Warning/approval rules for conflicting capabilities. | Refund approval + refund execution, role editing + self assignment, financial policy drafting + approval may be restricted. | Owner configures where allowed; product keeps minimum warnings. | Warning, approval, audit. |
| Permission simulation | Choose role and workflow to preview. | Cannot simulate as a way to bypass permission. | View for role managers; broader if granted. | No mutation; outputs are timestamped. |
| Version history | View prior role versions and compare. | History cannot be deleted from UX. | View gated by staff/audit capabilities. | Diff and audit entry for every version. |
| Emergency revoke / suspend | Suspend staff access immediately; optionally revoke sessions. | Cannot suspend last owner/admin; cannot suspend self into lockout. | `PERM-050`; sensitive confirmation. | Reason required, audit, visible status. |
| Locked system capabilities | Product-defined critical capabilities needed for safe operation. | Cannot remove if it would leave no one able to manage access, approve financial policies, view audit, or recover settings. | Product safety blocks removal. | Explanation and suggested alternative. |

## 6. Permission diff preview

Before saving a role or assignment change, show a diff grouped by business effect:

- Screens gained/lost.
- Actions gained/lost.
- Money visibility gained/lost.
- PII visibility gained/lost.
- Policy/configuration authority gained/lost.
- Staff/access authority gained/lost.
- Audit visibility gained/lost.
- Assigned staff affected.
- New separation-of-duties warnings.
- Locked/protected rules triggered.

The confirm button uses a business action label: "Change role", "Save role", "Assign role", not "Submit".

## 7. Business-language permission explanations

Each capability has:

- short label;
- plain-language description;
- examples of what it unlocks;
- risk note for sensitive capabilities;
- dependent capabilities;
- where it appears in the product;
- whether it is P0 or P1.

Example:

| Field | Content intent |
|---|---|
| Capability | Refund payment |
| Description | Allows this person to issue full or partial refunds from the Payments area. |
| Unlocks | Refund action on transactions and cancellation refund flow. |
| Risk note | Refunds move money and cannot be undone. |
| Requires | View financials. |
| Audit | Every refund records actor, amount, reservation, and reason. |

## 8. Permission-limited UX

- If a user lacks a screen-level capability, show `SCR-900` if they directly open the route.
- If a user has view but not edit capability, show the surface read-only with locked or hidden actions.
- If a user lacks sensitive data permission, hide or summarize values per `11 6`.
- Search and export must respect the same restrictions.
- Simulator must preview these restrictions in exactly the same language the user would see in the app.

## 9. New or refined capabilities

`11` owns the full catalog. This document requires these additions/refinements:

| ID | Capability | Plain-language description | Critical | Level |
|---|---|---|---|---|
| `PERM-062` | Manage financial policies | Create and edit financial policy drafts | Yes | P0 |
| `PERM-063` | Approve financial policies | Approve or reject sensitive financial policy changes | Yes | P0 |
| `PERM-064` | Roll back financial policies | Restore a previous financial policy as a new version | Yes | P0 |
| `PERM-065` | Simulate financial policies | Use the policy simulator and compare versions | No | P0 |
| `PERM-066` | Grant sensitive capabilities | Add high-risk capabilities to roles or staff | Yes | P0 |
| `PERM-067` | Emergency suspend access | Immediately suspend staff access | Yes | P0 |

## 10. States

Roles and access-control surfaces support:

- template role;
- custom role;
- draft role change;
- pending approval;
- approved/scheduled;
- active;
- rejected;
- archived custom role;
- assigned staff affected;
- last-owner blocked;
- self-escalation blocked;
- dependency warning;
- separation-of-duties warning;
- permission-limited read-only;
- stale role version.

## 11. Acceptance criteria

- [ ] Default role templates remain present, can be cloned, and are not deleted or treated as hardcoded limits.
- [ ] Custom roles can be created by cloning templates and editing capabilities inside safety guardrails.
- [ ] Capabilities are grouped by business domain and explained in business language.
- [ ] Sensitive capabilities are visually marked and require diff preview, reason, audit, and approval where governed.
- [ ] No self-escalation, self-lockout, or last-owner/last-admin removal is possible.
- [ ] Permission simulation shows screens, actions, data visibility, and workflow impact before save.
- [ ] Emergency suspend/revoke exists and is audited.
- [ ] Role and permission changes are versioned and comparable.
- [ ] Permission-limited UX matches `11`, `16`, `18`, and `19`.
