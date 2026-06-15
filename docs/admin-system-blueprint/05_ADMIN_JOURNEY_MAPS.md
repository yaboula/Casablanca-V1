# 05 — Admin Journey Maps

**Scope:** How real admins move through the product across a day and by default role template or custom role.
**Read after:** `04_USE_CASE_CATALOG.md`. References screens (`08`) and use cases (`04`).

---

## 1. Why journeys, not just screens

Screens describe surfaces; journeys describe **intent over time**. These maps ensure the IA (`03`) and screens (`08`) actually support real workflows, and they anchor the demo (`13`). Each journey lists the emotional/decision goal at each step, not just the click.

## 2. Primary journey — Operations Manager's morning (RP-2)

This is the canonical "first 30 seconds + first 30 minutes" journey. It is the product's core promise.

```mermaid
flowchart TD
    A["Open Admin"] --> B["Command Center SCR-010"]
    B --> C{"Any critical blockers?"}
    C -->|Yes| D["Open blocked case SCR-021"]
    C -->|No| E["Review today pickups and returns"]
    D --> D1["Resolve: payment, document, vehicle, or contact"]
    D1 --> E
    E --> F["Check fleet readiness SCR-030"]
    F --> G["Confirm vehicles for today are available"]
    G --> H["Review money at risk SCR-050"]
    H --> I["Chase or gate unsecured balances"]
    I --> J["Monitor active rentals and returns"]
    J --> K["End-of-day: pending actions and reports"]
```

| Step | Goal | Screen | Use case | Success signal |
|---|---|---|---|---|
| Open | "What is my day?" | `SCR-010` | UC-001 | Day shape understood in seconds |
| Blockers | "What will break?" | `SCR-010`→`SCR-021` | UC-002 | Each blocker has a next action |
| Resolve | "Fix it now" | `SCR-021`+sub | UC-002, UC-013, UC-014 | Blocker clears from Command Center |
| Today's flow | "Who arrives/returns?" | `SCR-010`/`SCR-020` | UC-010 | Pickups/returns visible by state |
| Fleet readiness | "Are the cars ready?" | `SCR-030` | UC-020 | No surprise unavailable vehicle |
| Money | "Is money secured?" | `SCR-050` | UC-040 | Unsecured money flagged before release |
| Monitor | "Anything new?" | `SCR-010` | UC-003 | Alerts triaged |
| Close | "What is left?" | `SCR-130`/`SCR-010` | UC-120 | Outstanding items known |

## 3. Owner / CEO weekly review (RP-1)

```mermaid
flowchart TD
    A["Open Admin"] --> B["Command Center quick health"]
    B --> C["Reports SCR-130"]
    C --> D["Revenue and utilization"]
    D --> E["Cancellations and no-shows"]
    E --> F["Vehicle profitability"]
    F --> G{"Problem area?"}
    G -->|Yes| H["Drill into list or vehicle"]
    G -->|No| I["Review pricing and rules"]
    H --> I
    I --> J["Adjust pricing rules SCR-110 or settings SCR-080"]
    J --> K["Check audit of critical actions SCR-140"]
```

Owner cares about strategy: is the business healthy, where is money made/lost, are controls respected. Owner rarely touches individual cases but must be able to drill from any metric to its source (UC-120) and confirm accountability (UC-130).

## 4. Finance Admin daily close (RP-4)

```mermaid
flowchart TD
    A["Open Payments SCR-050"] --> B["Filter by today and status"]
    B --> C["Review transactions and deposits"]
    C --> D["See operator-recorded desk collections"]
    D --> E{"Discrepancy or missing receipt?"}
    E -->|Yes| F["Flag and note, link to case SCR-051"]
    E -->|No| G["Mark reconciled"]
    F --> H["Handle refunds if needed SCR-051"]
    G --> H
    H --> I["Review invoices SCR-052"]
    I --> J["Export financial summary"]
```

Finance cares about traceability: every euro links to a reservation, desk collections are visible, refunds and charges are controlled and audited (UC-041..UC-044).

## 5. Fleet Manager journey (RP-5)

```mermaid
flowchart TD
    A["Open Fleet SCR-030"] --> B["Filter by status"]
    B --> C{"Maintenance or incidents open?"}
    C -->|Yes| D["Open incident SCR-091"]
    C -->|No| E["Check document expiry"]
    D --> D1["Update or resolve, block vehicle if unfit"]
    E --> F{"Expiring documents?"}
    F -->|Yes| G["Update vehicle documents SCR-031"]
    F -->|No| H["Review calendar occupancy SCR-100"]
    D1 --> H
    G --> H
    H --> I["Ensure no conflicts before reservations"]
```

Fleet cares about physical state and availability: which cars are fit, which are blocked and why, what is coming due (UC-020..UC-024, UC-080, UC-081, UC-090).

## 6. Branch / Airport Manager journey (RP-3)

```mermaid
flowchart TD
    A["Open Command Center scoped to location"] --> B["Today pickups and returns"]
    B --> C["Verify handover readiness per case SCR-061"]
    C --> D{"Case ready?"}
    D -->|No| E["Identify missing step and resolve or escalate"]
    D -->|Yes| F["Confirm readiness, operator executes handoff"]
    E --> F
    F --> G["Monitor conflicts and incidents"]
```

Branch/Airport manager cares about local execution oversight: today's cases ready, conflicts caught, operators supported — without doing the operator's desk job (UC-050, boundary in `02`).

## 7. Supervisor journey (RP-6)

```mermaid
flowchart TD
    A["Open Audit SCR-140"] --> B["Filter by critical actions"]
    B --> C["Who cancelled, refunded, overrode, changed price"]
    C --> D{"Concern?"}
    D -->|Yes| E["Open the case or staff member"]
    D -->|No| F["Review roles and permissions SCR-072"]
    E --> F
    F --> G["Adjust access if needed SCR-071"]
```

Supervisor cares about accountability and access hygiene (UC-061, UC-130).

## 8. Critical intervention journey (cross-role)

The exceptional, audited path that must feel deliberate, not casual.

```mermaid
flowchart TD
    A["Trigger: blocker, dispute, error"] --> B["Open reservation case SCR-021"]
    B --> C{"Which intervention?"}
    C -->|Cancel| D["Confirm with financial impact and reason UC-012"]
    C -->|Reassign vehicle| E["Pick available vehicle, confirm UC-013"]
    C -->|Force unblock| F["Accept risk, mandatory reason UC-014"]
    C -->|Refund| G["Amount, reason, confirm UC-042"]
    D --> H["Action recorded, auditable SCR-140"]
    E --> H
    F --> H
    G --> H
```

Every branch ends in an auditable record. None of these are one-click.

## 9. Configuration journey (cross-role, low frequency, high stakes)

```mermaid
flowchart TD
    A["Open Settings SCR-080"] --> B["Pick section SCR-081"]
    B --> C["Edit values"]
    C --> D["Preview effect"]
    D --> E{"Valid?"}
    E -->|No| F["Validation explains the problem"]
    E -->|Yes| G["Save, applies going forward"]
    F --> C
    G --> H["Change is auditable"]
```

Configuration is rare but consequential; always previewable and validated (UC-070, UC-071, UC-052, UC-100, UC-110).

## 10. Journey-derived requirements (feed into screens)

These requirements are extracted from the journeys above and must hold in `06`/`08`:

1. Command Center must surface blockers, today's flow, money-at-risk, and alerts on one screen (RP-2 morning).
2. Every metric in Reports must drill to its source list (RP-1 review).
3. Payments must show operator-recorded desk collections and link every transaction to a reservation (RP-4 close).
4. Fleet must distinguish physical vs commercial status and surface document expiry and maintenance (RP-5).
5. Handover readiness must reflect, not replace, operator execution (RP-3, boundary).
6. Audit must be reachable both globally and in-context (RP-6, interventions).
7. Every critical intervention must be confirmed, reasoned, and audited (intervention journey).
8. Configuration must be sectioned, previewable, validated (configuration journey).

## 11. Emotional design notes

- Morning open should feel **reassuring** when nothing is wrong (calm all-clear), and **clear** when something is (one obvious next action).
- Interventions should feel **deliberate and safe** — the user should feel the system is protecting them from mistakes, not slowing them down arbitrarily.
- Configuration should feel **confident** — preview before commit removes fear.
- Money screens should feel **trustworthy** — explicit breakdowns, no ambiguity.
