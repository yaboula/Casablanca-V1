# ADR-004: Auth Cookie Session Proxy

## Status

Accepted

## Context

The backend uses JWT access and refresh tokens, with hardened refresh rotation/revocation and logout behavior. Browser JavaScript should not store long-lived auth credentials. SSE also requires proxying because EventSource cannot send Authorization headers.

## Decision

Use a Next.js cookie/session proxy model:

- HttpOnly access token cookie
- HttpOnly refresh token cookie
- Next route handlers for session creation, refresh, logout, API proxying, and SSE proxying

## Consequences

- Browser JavaScript does not own raw tokens.
- Authenticated backend calls go through Next proxy or server helpers.
- Silent refresh is centralized.
- Logout clears cookies and calls backend logout.
- SSE streams can remain authenticated without exposing tokens in URLs.

## Alternatives Considered

### Store tokens in localStorage

- Pros: simpler client implementation.
- Cons: exposes tokens to browser JS and XSS risk.
- Rejected for security.

### Direct browser calls with bearer token in memory

- Pros: avoids proxy route handlers.
- Cons: fragile refresh/session behavior and impossible for EventSource headers.
- Rejected because proxy model is safer and fits Next.

## Related Docs

- `../06-AUTH-SESSION-SECURITY.md`
- `../04-FRONTEND-TECHNICAL-ARCHITECTURE.md`

