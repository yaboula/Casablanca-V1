# Product and UX Specification

## Product Positioning

Casablanca-V1 should feel like a premium airport concierge experience, not a generic car rental website. It should be calm, direct, operationally credible, and reassuring before arrival.

## Core Promise

Reserve before you land, verify before pickup, and collect your exact vehicle at Casablanca Mohammed V Airport in minutes.

## Personas

| Persona | Main goal | Fears and friction | Needed information | Best UX treatment |
|---|---|---|---|---|
| Tourist arriving at Casablanca airport | Land and leave quickly | Hidden fees, scams, language friction, document problems, pickup uncertainty | Exact pickup process, documents needed, support path, payment/deposit clarity | Reassuring copy, simple timeline, visible WhatsApp/support, clear next actions |
| Business traveler | Reliability and speed | Delays, booking ambiguity, payment friction, no-show risk | Exact vehicle, timing, readiness, invoice-quality trust | Concise copy, strong dashboard, fast rebooking, minimal decorative friction |
| Moroccan resident/local renter | Trusted premium rental | Overcomplicated tourist flow, unclear deposit rules | Pricing, deposit, vehicle quality, legitimacy | Practical language, clean booking, local credibility, clear terms |
| Operator at airport | Review and hand off quickly | Ambiguous statuses, poor search, unclear doc state | Pending docs, ready pickups, customer identity, scan/check-in state | Dense console, urgent ordering, strong badges, fast actions |
| Admin/fleet manager | Manage users, vehicles, and operations | Accidental destructive actions, poor fleet data, unclear metrics | Stats, roles, license plates, vehicle status, availability | Compact tables/forms, clear destructive flows, low-noise dashboard |

## Customer Journey

| Step | UX objective | Backend source of truth | Route | Trust signals | Primary CTA | Friction to reduce | Must not show |
|---|---|---|---|---|---|---|---|
| Home | Explain the airport-first promise quickly | none required | `/` | exact airport, process timeline, support | Search/reserve | skepticism, generic rental feel | fake urgency, unsupported locations |
| Catalog | Let users compare real vehicles | `GET /vehicles` | `/catalog` | real specs, price/day, availability | View vehicle | unclear filters | mock ratings as truth |
| Detail | Convert vehicle interest to booking intent | `GET /vehicles/:id` | `/catalog/[vehicleId]` | gallery, specs, cancellation, pickup clarity | Reserve this vehicle | fear of wrong vehicle | fake stock claims |
| Booking | Collect trip/customer info with confidence | `GET /vehicles/:id`, `POST /reservations` | `/book/[vehicleId]` | backend price summary, secure flow | Continue/create reservation | too many fields, duplicate submit | fake totals, fake refs |
| Payment | Make payment secure and bounded | Stripe client secret from reservation create | booking payment step | Stripe Elements, deposit copy | Pay securely | payment anxiety | simulated payment |
| Confirmation | Show success and next step | `GET /reservations/:id` | `/reservations/[reservationId]/confirmed` | reservation summary, timeline | Begin check-in | "what now?" uncertainty | fake booking code as identity |
| Check-in | Complete document verification | reservation + document endpoints | `/reservations/[reservationId]/check-in` | two-doc checklist, privacy copy | Upload documents | upload/rejection anxiety | selfie requirement |
| Waiting | Keep user calm during review | reservation + documents + SSE | `/reservations/[reservationId]/waiting` | live status, review progress, support | View ticket or re-upload | stuck/no update feeling | fake live status |
| Smart ticket | Prove pickup is ready | `GET /reservations/:id` | `/reservations/[reservationId]/ticket` | QR, vehicle, pickup place/time | Use at pickup/dashboard | "is this real?" doubt | frontend-generated QR |
| Pickup | Complete real-world handoff | operator scan/check-in endpoints | operator delivery route | scan/check-in status | Operator check-in/complete | physical/digital mismatch | customer-side clutter |
| Dashboard | Give one clear next action | `GET /reservations/my` | `/dashboard` | active trip, document status, support | Continue next step | multiple competing actions | local fake history |

## Conversion Strategy

- Make the first viewport concrete: Casablanca airport, exact vehicle, fast pickup.
- Explain the process before asking for payment.
- Show document verification as convenience, not bureaucracy.
- Show price and deposit information in plain language.
- Use premium restraint instead of discount-led pressure.
- Keep one primary CTA per step.
- Let support be visible without making the product feel manual.

## Marketing and Copywriting Rules

- Be concrete, calm, and operational.
- Prefer "what happens next" over lifestyle adjectives.
- Use "reserve before you land" and "pickup in minutes" as anchor language.
- Avoid vague luxury claims unless tied to real service quality.
- Avoid copy that implies unsupported backend features.
- Keep operator/admin copy utilitarian and low-noise.

## Psychological Frictions to Handle

- Arrival uncertainty.
- Hidden-fee anxiety.
- Payment/deposit confusion.
- Document rejection fear.
- "Will someone actually be there?" doubt.
- "Is this ticket accepted by staff?" doubt.

## What Must Not Be Shown

- Fake refs as production identity.
- Fake card/payment success.
- Mock review actions.
- Unsupported document types.
- Unsupported airport/city locations as active options.
- A separate `/tickets` product assumption.
- Forgot-password as a working feature before backend support.

