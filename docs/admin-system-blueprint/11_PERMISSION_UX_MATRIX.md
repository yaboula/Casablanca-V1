# 11 — Permission UX Matrix

**Scope:** How permissions shape the UX. Capability catalog, default role-template grants, custom-role constraints, and per-screen/action visibility rules.
**Read after:** `10_STATE_AND_EDGE_CASE_MATRIX.md`. Capabilities are configured in `M-07` / `SCR-072`.

---

## 1. Principles

1. **Business-language capabilities.** No technical scopes; capabilities read like sentences ("Can refund payment").
2. **Hide for permission, disable for state.** If you cannot do something because of who you are, the action is hidden or shown as a locked affordance. If you cannot do it because of the entity's state, it is disabled with a tooltip (see `09 §2`).
3. **One app, adaptive surfaces.** Role profiles change visibility and affordances, never spawn separate apps (`02 §5`).
4. **No silent data leaks.** Gated data (financials, PII, audit) is not rendered to roles without the capability, including in search results and exports.
5. **Critical capabilities are marked.** In `SCR-072`, capabilities that move money/state/access are visually flagged as critical.
6. **Self-protection.** No profile can self-escalate, self-lock-out, or remove the last admin.
7. **Templates, not hardcoded ceilings.** Owner, Operations Manager, Branch Manager, Finance Admin, Fleet Manager, and Supervisor are default role templates that can be cloned into custom roles under `22`.
8. **Govern sensitive configuration.** Financial policies, sensitive capabilities, pricing, contract terms, and customer-impacting templates follow the governance model in `23`.

## 2. Capability catalog (PERM)

Grouped by domain. Descriptions are the in-product plain-language text intent.

| ID | Capability | Plain-language description | Critical | Level |
|---|---|---|---|---|
| PERM-001 | View Command Center | See the operational home and alerts | — | P0 |
| PERM-002 | View reservations | See reservation cases | — | P0 |
| PERM-003 | Modify reservation | Edit reservation details | ✔ | P0 |
| PERM-004 | Cancel reservation | Cancel a reservation | ✔ | P0 |
| PERM-005 | Reassign vehicle | Change the vehicle on a reservation | ✔ | P0 |
| PERM-006 | Override / force-unblock | Release despite a blocker, accepting risk | ✔ | P0 |
| PERM-007 | Create reservation on behalf | Book for a customer | ✔ | P0 |
| PERM-010 | View fleet | See vehicles and status | — | P0 |
| PERM-011 | Edit vehicle | Add/edit/deactivate vehicles | ✔ | P0 |
| PERM-012 | Block/unblock vehicle | Take a vehicle out of/into service | ✔ | P0 |
| PERM-013 | Manage vehicle documents | Update vehicle documents | — | P0 |
| PERM-020 | View customers | See customer profiles | — | P0 |
| PERM-021 | Edit customer / notes | Edit data, add notes | — | P0 |
| PERM-022 | Manage risk flags | Set/clear risk flags | ✔ | P0 |
| PERM-023 | View customer financials | See a customer's money detail | ✔ | P0 |
| PERM-030 | View financials | See payments, deposits, balances | ✔ | P0 |
| PERM-031 | Reconcile payments | Mark reconciled / flag discrepancy | ✔ | P0 |
| PERM-032 | Refund payment | Issue refunds | ✔ | P0 |
| PERM-033 | Record charge/adjustment | Add damage/extra/fine charges | ✔ | P0 |
| PERM-034 | Manage invoices | View/export invoices | — | P0 |
| PERM-040 | View handover | See handover records/evidence | — | P0 |
| PERM-041 | Configure handover/contract | Edit process and contract terms | ✔ | P0 |
| PERM-050 | Manage staff | Create/suspend staff | ✔ | P0 |
| PERM-051 | Assign roles | Change assigned role templates or custom roles | ✔ | P0 |
| PERM-052 | Edit roles & permissions | Change capability bundles | ✔ | P0 |
| PERM-060 | Edit settings | Change business rules | ✔ | P0 |
| PERM-061 | Edit sensitive settings | Contract terms and sensitive non-financial business rules | ✔ | P0 |
| PERM-062 | Manage financial policies | Create and edit financial policy drafts | ✔ | P0 |
| PERM-063 | Approve financial policies | Approve or reject sensitive financial policy changes | ✔ | P0 |
| PERM-064 | Roll back financial policies | Restore a previous financial policy as a new version | ✔ | P0 |
| PERM-065 | Simulate financial policies | Use the policy simulator and compare policy versions | — | P0 |
| PERM-066 | Grant sensitive capabilities | Add high-risk capabilities to roles or staff | ✔ | P0 |
| PERM-067 | Emergency suspend access | Immediately suspend staff access | ✔ | P0 |
| PERM-070 | Manage maintenance | Open/close incidents, schedule maintenance | ✔ | P1 |
| PERM-071 | View maintenance cost | See repair/maintenance costs | ✔ | P1 |
| PERM-080 | View calendar | See occupancy calendar | — | P1 |
| PERM-090 | Manage pricing rules | Create/edit pricing rules | ✔ | P1 |
| PERM-100 | Manage notifications | Configure notifications/templates | ✔ | P1 |
| PERM-110 | View reports | See analytics | — | P1 |
| PERM-111 | View financial reports | See money analytics | ✔ | P1 |
| PERM-120 | View audit logs | See who did what | ✔ | P1 |

## 3. Default role-template grants

`●` granted · `○` read-only / summary only · blank = no access. These are **default templates**; businesses may clone them into custom roles in `SCR-072` (subject to `PERM-052`, `PERM-066`, and `22`). Owner has everything.

| Capability | RP-1 Owner | RP-2 Ops Mgr | RP-3 Branch Mgr | RP-4 Finance | RP-5 Fleet | RP-6 Supervisor |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| PERM-001 Command Center | ● | ● | ● | ○ | ○ | ● |
| PERM-002 View reservations | ● | ● | ● | ○ | ○ | ● |
| PERM-003 Modify reservation | ● | ● | ● | | | |
| PERM-004 Cancel reservation | ● | ● | ● | | | |
| PERM-005 Reassign vehicle | ● | ● | ● | | ● | |
| PERM-006 Override/unblock | ● | ● | | | | |
| PERM-007 Create on behalf | ● | ● | ● | | | |
| PERM-010 View fleet | ● | ● | ● | ○ | ● | ● |
| PERM-011 Edit vehicle | ● | ● | | | ● | |
| PERM-012 Block/unblock vehicle | ● | ● | ● | | ● | |
| PERM-013 Vehicle documents | ● | ● | | | ● | |
| PERM-020 View customers | ● | ● | ● | ○ | | ● |
| PERM-021 Edit customer/notes | ● | ● | ● | | | ● |
| PERM-022 Risk flags | ● | ● | ● | | | ● |
| PERM-023 Customer financials | ● | ○ | ○ | ● | | ○ |
| PERM-030 View financials | ● | ○ | ○ | ● | | ○ |
| PERM-031 Reconcile | ● | | | ● | | |
| PERM-032 Refund | ● | | | ● | | |
| PERM-033 Record charge | ● | ○ | ○ | ● | | |
| PERM-034 Invoices | ● | ○ | ○ | ● | | |
| PERM-040 View handover | ● | ● | ● | ○ | ● | ● |
| PERM-041 Configure handover | ● | ● | | | | |
| PERM-050 Manage staff | ● | | | | | ● |
| PERM-051 Assign roles | ● | | | | | ● |
| PERM-052 Edit roles | ● | | | | | ○ |
| PERM-060 Edit settings | ● | ● | | | | |
| PERM-061 Sensitive settings | ● | | | | | |
| PERM-062 Manage financial policies | ● | ○ | | ● | | |
| PERM-063 Approve financial policies | ● | | | ○ | | |
| PERM-064 Roll back financial policies | ● | | | | | |
| PERM-065 Simulate financial policies | ● | ● | ○ | ● | | ○ |
| PERM-066 Grant sensitive capabilities | ● | | | | | |
| PERM-067 Emergency suspend access | ● | | | | | ● |
| PERM-070 Manage maintenance (P1) | ● | ● | ○ | | ● | |
| PERM-071 Maintenance cost (P1) | ● | ○ | | ● | ○ | |
| PERM-080 View calendar (P1) | ● | ● | ● | | ● | ● |
| PERM-090 Pricing rules (P1) | ● | ○ | | ○ | | |
| PERM-100 Notifications (P1) | ● | ● | | | | |
| PERM-110 View reports (P1) | ● | ● | ○ | ● | ○ | ● |
| PERM-111 Financial reports (P1) | ● | ○ | | ● | | ○ |
| PERM-120 Audit logs (P1) | ● | | | ○ | | ● |

## 4. Screen-level access

| Screen | Required to view | Visible-but-limited without write capability |
|---|---|---|
| SCR-010 Command Center | PERM-001 | Money-at-risk region needs PERM-030 |
| SCR-020/021 Reservations | PERM-002 | Interventions need PERM-003/004/005/006 |
| SCR-030/031 Fleet | PERM-010 | Edit/block need PERM-011/012; profitability needs PERM-030 |
| SCR-040/041 Customers | PERM-020 | Financials need PERM-023; flags need PERM-022 |
| SCR-050/051/052 Payments | PERM-030 | Refund/charge/reconcile need PERM-031/032/033 |
| SCR-060/061 Handover | PERM-040 | Charges need PERM-033; config needs PERM-041 |
| SCR-070/071 Staff | PERM-050 | Role change needs PERM-051 |
| SCR-072 Roles | PERM-052 (view may use PERM-050) | Editing capabilities needs PERM-052; sensitive grants need PERM-066 |
| SCR-080/081 Settings | PERM-060 | Sensitive sections need PERM-061 |
| SCR-082 Financial policies | PERM-062 or PERM-065 for simulator/read-only where allowed | Approval needs PERM-063; rollback needs PERM-064 |
| SCR-090/091 Maintenance (P1) | PERM-070 | Cost needs PERM-071 |
| SCR-100 Calendar (P1) | PERM-080 | — |
| SCR-110 Pricing (P1) | PERM-090 | — |
| SCR-120 Notifications (P1) | PERM-100 | — |
| SCR-130 Reports (P1) | PERM-110 | Financial reports need PERM-111 |
| SCR-140 Audit (P1) | PERM-120 | — |
| SCR-150 Search | any view capability | Results filtered to permitted entities |
| SCR-160 Profile | self | Cannot change own role |

When a screen requires a capability the viewer lacks and it was reached via a permitted-looking route, render the forbidden shell (`SCR-900`, `ST-009`). When the viewer has view but not write, render `ST-008` (gated sections/actions).

## 5. Action-level rules (the hide-vs-disable decision)

| Action | Hidden when | Disabled-with-tooltip when |
|---|---|---|
| Cancel reservation | No PERM-004 | State not cancellable (active/completed/cancelled) |
| Reassign vehicle | No PERM-005 | Case completed; no alternative available |
| Override/unblock | No PERM-006 | Case not blocked |
| Refund | No PERM-032 | Transaction not refundable; already fully refunded |
| Record charge | No PERM-033 | Amount invalid |
| Block vehicle | No PERM-012 | Vehicle currently rented (restricted/explained) |
| Edit vehicle | No PERM-011 | Field locked by active reservation |
| Change role | No PERM-051 | Target would breach last-admin/self-lockout rule |
| Create/edit custom role | No PERM-052 | Dependency, locked-capability, self-escalation, or last-owner rule would be breached |
| Grant sensitive capability | No PERM-066 | Separation-of-duties or approval requirement not satisfied |
| Edit setting | No PERM-060 (or PERM-061 for sensitive) | Invalid value pending |
| Configure financial policy | No PERM-062 | Invalid/conflicting policy draft; missing simulator/preview; pending approval |
| Approve financial policy | No PERM-063 | Draft author cannot self-approve where separation of duties applies |
| Roll back financial policy | No PERM-064 | Prior version invalid under current constraints or would silently affect existing reservations |
| Manage maintenance (P1) | No PERM-070 | — |
| Manage pricing (P1) | No PERM-090 | Rule invalid pending |

## 6. Data-sensitivity rules

| Data | Gate | Behavior without capability |
|---|---|---|
| Payment/deposit/balance amounts | PERM-030 | Money components hidden or summarized to a non-numeric status; never a bare amount |
| Customer financials | PERM-023 | Financial tab hidden on profile |
| Customer documents (PII) | PERM-020 (+ stricter for sensitive) | Document viewer gated; existence may show, content gated |
| Maintenance cost | PERM-071 | Cost fields hidden; incident still visible |
| Audit entries | PERM-120 | Audit screen and in-context history hidden |
| Pricing/revenue analytics | PERM-111 | Financial reports hidden |

Exports (`INT-120`) never include data the exporting profile cannot view on screen.

## 7. Self-protection & integrity rules

- A profile cannot grant itself a capability it does not have (no privilege escalation via `SCR-072`).
- A profile cannot remove its own critical access in a way that locks itself out mid-task; such changes are blocked with explanation.
- The last admin/owner cannot be deactivated or downgraded (`INT-061`, `INT-060`).
- Role and permission changes are confirmed (capability diff), reasoned where sensitive, versioned, and audited (`M-14`, `22`, `23`).
- Default role templates cannot be deleted; custom roles can be archived only when no active staff depend on them or after reassignment.
- Permission revoked mid-session causes the next gated action to fail gracefully (`ST-008`/`ST-009`), never a crash.

## 8. Permission acceptance criteria

- Every gated screen renders the forbidden shell (not a crash) when accessed without capability.
- Every gated action follows the hide-vs-disable rule consistently (§5).
- No gated data appears in any view, search result, or export without the capability (§6).
- Capabilities are presented in business language with critical ones marked (`SCR-072`).
- Default roles behave as templates; custom roles are safe, diff-previewed, versioned, and governed (`22`).
- Financial policy authority is separated into manage, approve, rollback, and simulate capabilities (`21`).
- Self-escalation, self-lockout, and last-admin removal are impossible (§7).
- The same IA serves all profiles; only visibility/affordances differ.
