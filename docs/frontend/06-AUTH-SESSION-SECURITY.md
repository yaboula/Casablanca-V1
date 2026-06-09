# Auth, Session, and Security

## Strategy

Use a Next.js cookie/session proxy strategy. Browser JavaScript must never own raw access or refresh tokens as durable application state.

## HttpOnly Cookie Session

After backend login/register:

1. frontend receives backend tokens from auth response
2. frontend posts them to `/api/auth/session`
3. Next route handler stores tokens in cookies
4. UI reads only safe public user data

Recommended cookies:

| Cookie | HttpOnly | Purpose |
|---|---:|---|
| `nexus_token` | yes | access token |
| `nexus_refresh` | yes | refresh token |
| `nexus_user` | no | safe public user summary only |

## Access Token Handling

- Stored in HttpOnly cookie.
- Injected by Next proxy into backend Authorization header.
- Never persisted in localStorage.
- Never added to EventSource URLs.

## Refresh Token Handling

- Stored in HttpOnly cookie.
- Used only by `/api/auth/refresh`.
- Backend now rotates/revokes refresh token family through hardened auth logic.
- Reuse of an old refresh token should lead to session expiry UX.

## Logout Behavior

Logout flow:

1. call backend `POST /auth/logout` through authenticated proxy
2. clear frontend cookies through `/api/auth/session` DELETE
3. clear local UI-only stores
4. redirect to login or public home

## `/api/auth/session`

Responsibilities:

- create frontend session cookies after login/register
- store only safe user fields in readable cookie if needed
- clear all session cookies on logout

## `/api/auth/refresh`

Responsibilities:

- read refresh token from HttpOnly cookie
- call backend `/auth/refresh`
- replace access and refresh cookies
- fail cleanly when backend rejects refresh token

## `/api/v1` Proxy Behavior

The proxy must:

- forward requests to backend `/api/v1`
- inject Authorization header when access cookie exists
- preserve method, body, and content type
- return backend status and error body
- avoid swallowing backend validation errors

## Role Guards

| Route group | Guard |
|---|---|
| public | no auth |
| customer | authenticated user |
| operator | `OPERATOR` or `ADMIN` |
| admin | `ADMIN` |

Guards should run as early as possible in route rendering.

## Protected Route Strategy

- unauthenticated users redirect to `/login?redirect=<path>`
- expired sessions attempt silent refresh once
- failed refresh redirects to login with `session_expired=true`
- forbidden users see role-specific denial or redirect to their allowed area

## Operator/Admin Authorization

Frontend role checks are UX gates only. Backend remains final authority.

Frontend should:

- hide unavailable nav
- prevent obvious wrong-role navigation
- still handle backend 403 gracefully

## CSRF and Security Considerations

Because cookies are used:

- use strict or lax same-site cookies depending deployment requirements
- avoid cross-site unsafe requests
- do not expose tokens to client JS
- consider CSRF tokens for high-risk mutating actions if deployment/cross-origin setup requires it
- preserve backend validation and role checks

## What Browser JS Must Never Own

- access token as localStorage/sessionStorage value
- refresh token
- JWT secrets
- Stripe secret key
- backend signing secrets
- QR signing secrets

## Session Expiry UX

Session expiry should be clear and non-punitive:

- show "Your session expired. Please sign in again."
- preserve redirect target
- do not show broken dashboards
- do not keep stale user/reservation data visible as if current

