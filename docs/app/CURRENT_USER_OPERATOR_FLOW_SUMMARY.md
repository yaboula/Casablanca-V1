# Casablanca V1

## Current App Flow Summary

This document describes the current implemented app flow for the two roles that are already active in the product today:

- `USER`
- `OPERATOR`

It focuses only on how the app works from a product and workflow point of view. It does not describe technical architecture or design decisions.

## How the App Works

Casablanca V1 is a reservation and airport pickup app for premium car rental at Casablanca Mohammed V Airport.

At a high level, the app works like this:

1. A customer browses the fleet, selects a vehicle, chooses pickup and return details, and creates a reservation.
2. The customer completes payment verification, then uploads identity documents for review.
3. The app keeps the customer informed while the documents and payment state are being processed.
4. Once the reservation is fully ready, the customer receives a smart pickup ticket.
5. At the airport, the operator uses the operator console to find the reservation, verify the case, clear payment and documents, and complete the vehicle handoff.

---

## USER Flow

### 1. Public browsing and account access

The customer can:

- browse the public catalog
- open individual vehicle detail pages
- register
- log in

The booking flow starts from the vehicle page.

### 2. Booking a vehicle

From the booking page, the customer:

- selects pickup date and time
- selects return date and time
- chooses the pickup terminal
- enters driver name and phone number

The booking page shows:

- live price estimation
- charged rental period
- extra-time pricing behavior
- current day availability for the selected vehicle

When the reservation is submitted, the system creates the reservation and moves the customer to the confirmation step.

### 3. Confirmation and payment step

After reservation creation, the customer lands on the confirmation page.

From there, depending on reservation state, the customer can see:

- payment still required
- payment processing
- payment verified
- reservation cancelled
- rental already active or completed

If payment authorization is still pending, the customer can continue the payment step from the confirmation screen. If the page is refreshed while payment is still pending, the app can recover the payment intent safely through a dedicated flow.

### 4. Customer dashboard

The dashboard is the customer control center for all reservations.

It groups reservations by their current situation and shows the next action for each one. Typical next actions are:

- complete payment
- upload documents
- wait for review
- view pickup ticket
- view active rental

The dashboard also shows:

- active or attention-needed reservations first
- reservations under review
- upcoming confirmed reservations
- cancelled reservations
- past/completed reservations

Eligible reservations can also be cancelled from the dashboard area.

### 5. Document check-in

Once payment is verified, the customer continues to document check-in.

In this step, the customer uploads the required identity documents:

- passport
- driving licence

The goal is to let the operator review them before the customer reaches the airport.

### 6. Waiting room after document submission

After the customer submits documents, the app moves to a waiting room state.

This screen is used while the app is waiting for operator review and backend state changes. It reflects situations such as:

- documents pending review
- documents rejected and needing re-upload
- reservation confirmed but not yet fully ready
- ready for ticket
- reservation cancelled
- rental in progress
- rental completed

The waiting room keeps the customer on the right next step instead of sending them back through the booking flow.

### 7. Smart ticket

When the reservation is confirmed and the required payment state is complete, the customer can access the smart ticket.

The ticket page shows:

- the pickup QR ticket
- a manual code fallback
- pickup location
- pickup time
- clear pickup instructions

If the reservation is not ready yet, cancelled, expired, or revoked, the customer sees a corresponding non-ready state instead of a usable ticket.

### 8. Trip history

The customer also has a history page that shows:

- completed trips
- cancelled reservations

This is a past-trip record, separate from the active dashboard.

### 9. Profile

The profile page currently works as a simple customer profile shell. It shows:

- name
- email
- role
- sign out

---

## OPERATOR Flow

### 1. Operator dashboard

The operator dashboard is the main operations console for airport pickup work.

It shows the full current operator case ledger and is used to find the next reservation case to act on.

The dashboard includes:

- headline metrics
- a full reservation case list
- search
- filters
- QR/ticket scanning entry

The current filters cover:

- all cases
- to review
- action required
- payment gate
- ready today
- active
- upcoming
- past
- completed
- cancelled

The operator can search by:

- reservation reference
- customer
- phone
- vehicle

### 2. Ticket scanner and case lookup

The operator can open the ticket scanner from the dashboard and:

- scan the customer ticket
- paste a signed ticket token manually if needed

This helps open the correct reservation case quickly before final pickup decisions are made.

### 3. Document review queue

The operator also has a dedicated pending-documents page.

This page shows the live queue of documents waiting for review. From there, the operator can refresh the queue and open individual review cards.

### 4. Reservation case page

The reservation case page is the main operator decision screen for a single handoff.

It brings together the information the operator needs in one place:

- customer identity context
- vehicle context
- pickup timing and location
- document status
- payment and desk collection state
- overall release readiness

This page is where the operator moves from review into release.

### 5. Document verification inside the case

Within the case, the operator can review the uploaded documents directly in reservation context.

For each document, the operator can:

- approve it
- reject it with a reason

This keeps the document decision tied to the reservation and pickup case, instead of treating documents as an isolated queue only.

### 6. Financial clearance

Before release, the operator checks financial readiness.

The operator flow currently distinguishes between:

- deposit/authorization state
- desk balance still due
- desk collection already recorded

If there is still a balance to collect at the desk, the operator can record:

- payment method
- receipt or reference

This must be cleared before vehicle release can continue.

### 7. Handoff and manual fallback

When documents and financial conditions are clear, the operator can continue the handoff flow.

The handoff panel supports:

- normal release flow
- audited manual release fallback
- completion after return

The operator must confirm physical checks before release. The manual fallback requires extra confirmation data, including a visible reservation code match and a reason.

### 8. Completing the case

After a vehicle is already with the customer, the operator can later close the case when the rental is returned and the return workflow is complete.

This lets the operator move reservations through:

- confirmed
- in progress
- completed

### 9. Live updates in operator work

The operator experience is built around staying current with real reservation changes while working through the queue.

In practice, this means the operator views are designed to stay aligned with:

- document review changes
- payment state changes
- ticket/case readiness
- handoff progress

---

## Current Functional Boundary

Today, the implemented app is already centered on two operational surfaces:

- the `USER` journey from booking through smart ticket
- the `OPERATOR` journey from queue review through vehicle handoff

The app already supports the full core loop of:

1. browse and reserve
2. verify payment
3. upload documents
4. wait for review
5. receive ticket
6. operator verifies the case
7. operator releases the vehicle
8. operator completes the rental after return

This summary reflects the current app behavior as implemented now.
