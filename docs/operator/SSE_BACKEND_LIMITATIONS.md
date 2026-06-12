# SSE Backend Limitations

## Current State

- Backend SSE remains single-instance and in-memory in `SseService`.
- Customer reservation SSE is restricted to the owning `USER` only.
- Staff must use staff/operator SSE streams and cannot subscribe to the customer reservation stream.
- Operator delivery and document queue streams emit invalidation events only.

## Safe Payload Contract

- SSE payloads are limited to `type`, `resourceId`, `status` when needed, and `updatedAt`.
- SSE payloads must not include Stripe identifiers, QR or ticket values, document URLs, email, phone, or other PII/secrets.

## Known Limitation

- Multi-instance delivery is not supported yet because there is no shared broker.
- In a horizontally scaled deployment, SSE subscribers connected to different app instances will not receive each other's events until Redis Pub/Sub or equivalent fan-out is introduced.
