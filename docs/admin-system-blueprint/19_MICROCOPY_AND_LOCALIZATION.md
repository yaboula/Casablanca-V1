# 19 — Microcopy, Content Design & Localization

**Type:** Content standard + internationalization spec (UX text behavior, not code/translations).
**Purpose:** Make product language consistent, trustworthy, and premium-quiet; and make the product ready for the Moroccan/MENA market it is positioned for (French/Arabic, RTL, EUR).
**Applies to:** all labels, buttons, confirmations, errors, empty states, and announcements across the blueprint.
**ID scheme:** `CP-##` content rules, `LOC-##` localization rules. Message templates are **canonical English intent**; translation is a build/content task, not specified here.

> Fixes audit weaknesses W5 (no microcopy layer) and W8 (localization/RTL ignored). Pair with `18` (where errors/states are triggered) and `16` (how they are announced).

---

## 1. Voice & tone

- **CP-01 — Voice:** Calm, competent, operational. The admin is a professional running a business at speed; copy respects that. No marketing tone inside the product, no exclamation marks, no cute mascots.
- **CP-02 — Tone shifts by stakes:**
  - Routine (filters, navigation): minimal, almost invisible.
  - Money/destructive: precise and explicit — state amounts and consequences plainly.
  - Errors: factual and helpful, never blaming the user ("That amount is above the refundable balance," not "You entered an invalid amount").
- **CP-03 — Person & tense:** Address the admin as "you"; describe system actions in plain past/present ("Refund issued," "2 vehicles need attention"). Avoid jargon and internal codes (NN/g H2).

## 2. Microcopy rules

- **CP-10 — Buttons are verbs + object where money/impact is involved:** "Issue refund," "Cancel reservation," "Change role" — not "OK/Submit." Confirm buttons restate the amount (`18 FV-022`).
- **CP-11 — One name per concept (NN/g H4, `16 A11Y-021`):** A single canonical term for each action/entity (Refund, Charge, Override, Reservation, Vehicle, Staff). Maintain the canonical glossary in `00`. Never mix synonyms ("issue refund" vs "give money back").
- **CP-12 — No dead ends:** Every empty/error message includes a next step or exit.
- **CP-13 — Numbers & money are formatted, never raw (`18 FV-020`, `LOC-03`).**
- **CP-14 — Sentence case** for UI text; reserve other casing for proper nouns. Keep labels short; put detail in helper text, not the label.

## 3. Message catalog (canonical intent)

Build teams localize these; the *intent and structure* are fixed. `{tokens}` are runtime values.

### 3.1 Confirmations (destructive/financial)
| Context | Title | Body | Primary | Secondary |
|---|---|---|---|---|
| Cancel reservation | "Cancel reservation {ref}?" | "This cancels {customer}'s reservation. {fee_clause}. Add a reason for the record." | "Cancel reservation" | "Keep reservation" |
| Issue refund | "Issue refund of {amount}?" | "Refunds {amount} to {customer} for {ref}. New balance: {balance}. This can't be undone." | "Refund {amount}" | "Back" |
| Charge customer | "Charge {amount}?" | "Charges {customer} {amount} for {ref}. New balance: {balance}." | "Charge {amount}" | "Back" |
| Override blocker | "Override {blocker_name}?" | "This proceeds despite {blocker_name}. A reason is required and will be recorded." | "Override" | "Cancel" |
| Change role | "Change {name}'s role to {role}?" | "This changes what {name} can access. Add a reason for the record." | "Change role" | "Cancel" |
| Save financial policy | "Submit financial policy change?" | "This changes {policy_area} from {effective_date}. Review the preview and add a reason for the record." | "Submit for approval" | "Keep editing" |
| Approve financial policy | "Approve financial policy change?" | "This schedules {policy_area} for {effective_date}. Existing reservations keep their current policy unless explicitly updated." | "Approve change" | "Reject" |
| Roll back policy | "Roll back to version {version}?" | "This creates a new policy version using the previous values. It does not erase history." | "Roll back policy" | "Cancel" |
| Grant sensitive capability | "Grant {capability} to {role}?" | "This changes what staff with {role} can do. Review the access diff and add a reason." | "Grant capability" | "Cancel" |
| Discard edits | "Discard changes?" | "Your unsaved changes will be lost." | "Discard" | "Keep editing" |

### 3.2 Success (announced per `16 A11Y-040`)
| Context | Message |
|---|---|
| Refund issued | "Refund of {amount} issued to {customer}. New balance: {balance}." |
| Saved settings | "Changes saved." |
| Role changed | "{name} is now {role}." |
| Vehicle status | "{vehicle} set to {status}." (offer Undo where reversible, `17 §1`) |

### 3.3 Errors (by class, from `18 §4`)
| Class | Template |
|---|---|
| ERR-01 Validation | "{Field} {specific problem}. {How to fix}." e.g. "Amount is above the refundable balance of {max}." |
| ERR-02 Permission | "You don't have access to {action}. Ask an owner/manager to do this or change your access." |
| ERR-03 Precondition | "{Action} isn't ready: {unmet_condition}. {Resolving action}." |
| ERR-04 Conflict | "{Entity} changed since you opened it. Review the latest version before saving." |
| ERR-05 Not found | "{Entity} no longer exists. It may have been removed. Back to {list}." |
| ERR-06 System | "Something interrupted that action. Your input is saved — try again. (Ref: {id})" |
| ERR-07 Network | "Connection lost. We'll reconnect automatically; changes are paused until then." |

### 3.4 Empty states (double as onboarding, `18 §9`)
| Surface | Headline | Body + action |
|---|---|---|
| No vehicles | "No vehicles yet" | "Add your first vehicle to start managing the fleet." → "Add vehicle" |
| No reservations (filtered) | "No reservations match these filters" | "Try widening the date range or clearing filters." → "Clear filters" |
| No staff | "No team members yet" | "Invite staff and set what each person can access." → "Invite staff" |
| Command Center clear | "All clear" | "Nothing needs your attention right now." (calm, not blank) |
| Reports no data | "Not enough data yet" | "Reports will populate as reservations complete." |

## 4. Accessibility of content
- **CP-20:** Announcement text (live regions) is concise and meaningful out of context ("Refund of €240.00 issued. New balance €0.00."), per `16 A11Y-040`.
- **CP-21:** Error text is the same whether read visually or by screen reader; no "see the red field" references that assume sight (`16 A11Y-031`).
- **CP-22:** Link/button text is self-describing ("Issue refund," not "Click here").

## 5. Localization (LOC)

**Context:** The product targets premium car rental in Casablanca and similar markets. Plan for **English, French, and Arabic** content. This affects layout and components now, even if only one language ships first.

- **LOC-01 — Language scope:** Design for at least FR/EN, with Arabic planned. Strings must be externalizable (no concatenated sentences that break translation; use whole-sentence templates with tokens as in §3).
- **LOC-02 — RTL (Arabic):** The entire layout must be **mirrorable** for RTL: nav flips to the right, breadcrumbs and progress reverse direction, icons with direction (back/forward, trends) mirror, while logical content (numbers, money, the rental timeline's chronological direction) follows correct bidi rules. Tables and money columns must remain readable in RTL. Treat RTL as a first-class layout mode, not an afterthought.
- **LOC-03 — Number, date, currency, time:** Use locale-aware formatting. Currency is **EUR** with locale-correct grouping/decimal separators and symbol placement. Dates/times use locale format and a stated timezone (operational clarity at the airport). Never hardcode a single format.
- **LOC-04 — Text expansion:** FR/AR expand vs EN; layouts, buttons, pills, and table headers must tolerate ~30–40% longer strings without truncation that hides meaning. Truncation with accessible full-text (title/tooltip per `16 A11Y-041`) is allowed for secondary text only.
- **LOC-05 — Names & inputs:** Accept non-Latin names and varied phone/plate formats (Postel's Law, `18 FV-014`); do not assume Latin-only.
- **LOC-06 — Pluralization & gender:** Use template forms that allow language-specific plural/gender rules ("{n} reservation(s)" handled per locale), not English-only "(s)".

## 6. Acceptance criteria (testable)
- [ ] Every confirmation/error/empty state in the product maps to a §3 template; no ad-hoc copy.
- [ ] One canonical term per concept across all screens (spot-check refund/edit/override).
- [ ] All money/dates/numbers rendered via locale-aware formatting (`LOC-03`); no raw values.
- [ ] Layout passes an RTL mirror check on Command Center, reservation case, and a settings screen (`LOC-02`).
- [ ] UI tolerates +35% string length on buttons, pills, and table headers without meaning loss (`LOC-04`).
- [ ] Announcement strings are meaningful standalone (`CP-20`); no sight-dependent error text (`CP-21`).
