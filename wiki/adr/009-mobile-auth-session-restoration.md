# ADR 009: Mobile Auth Session Restoration — oidc-spa Primary, Bounded Token Cache Fallback

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** Development Team
**Context:** Phase 5 — Vite SPA + Google-only `oidc-spa` authentication

---

## Context

Grocerun's current authentication model is a pure SPA model:

- Frontend uses `oidc-spa` against Google OIDC.
- Backend validates Google ID tokens as Bearer tokens via `oidc-spa/server` and JWKS.
- Protected routes are SPA routes, not server-rendered pages.
- RxDB sync sends the same Bearer token to REST push/pull endpoints; SSE uses query-param token auth because `EventSource` cannot set headers.

This model was intentionally selected during the Next.js/NextAuth removal. It avoids reintroducing a BFF/session layer while local-first RxDB sync is still settling.

On Android Chrome, the documented `oidc-spa` restoration path proved unreliable:

1. User logs in successfully.
2. User closes the mobile browser/app.
3. User returns to the staging URL.
4. `oidc-spa` has lost in-memory/session state and attempts full-page Google restoration.
5. Android restore sometimes fails and the app lands on the login page.

`sessionRestorationMethod: "full page redirect"` remains the primary restoration mechanism, but it is not reliable enough by itself on mobile.

---

## Decision

We keep `oidc-spa` and the SPA Bearer-token architecture as the source architecture.

We add a **bounded mobile restoration fallback**:

- When live `oidc-spa` auth is available, cache the current Google ID token and minimal decoded user fields in localStorage.
- Cache is valid only until token `exp`, with a 60-second expiry skew.
- Protected routes allow either live `oidc-spa` auth or a fresh cached token.
- API and RxDB auth go through a central app-auth facade that prefers live `oidc-spa` and falls back to the cached token only when `oidc-spa` is not logged in.
- Explicit logout clears cached token, fallback flags, and sets a short logout-in-progress marker to prevent late API responses from re-seeding the cache.

This is implemented as:

- `apps/web/src/core/auth/token-cache.ts` — bounded cache and logout guard.
- `apps/web/src/core/auth/session.ts` — central app-auth facade.
- `apps/web/src/core/auth/guard.ts` — route guard using app-auth facade.
- API/RxDB token retrieval via `session.ts`, not direct `useOidc()`.

---

## Consequences

### Benefits

- Android close/reopen works without requiring a successful Google full-page restoration redirect.
- The app stays within the documented oidc-spa SPA token model.
- The fallback is bounded by Google's token expiry and never creates a longer-lived app session.
- Future auth consumers have a single facade (`session.ts`) instead of needing to know about oidc-spa/cache split.

### Costs / risks

- A Google ID token is stored in localStorage for the remainder of its natural lifetime.
- This increases XSS impact relative to memory-only token storage.
- There are now two runtime auth states: live oidc-spa and cached app auth. Code must use the app-auth facade for protected API/session decisions.

### Risk controls

- Cache is rejected when malformed or expired.
- Cache has a 60-second skew before token expiry.
- 401 responses clear cached auth.
- Logout clears cache and blocks late re-seeding for a short period.
- Tests cover token freshness, guard behavior, and cached-token API behavior.

---

## Alternatives considered

### Backend-managed session cookie

Rejected for now.

It would likely solve mobile restoration cleanly, but it changes the accepted architecture by reintroducing a server-managed session/BFF-style auth layer. Existing planning docs explicitly keep the SPA token model and mark BFF/session auth as out of scope during the current local-first/RxDB phase.

This may be revisited if:

- mobile restoration remains unreliable after this fallback,
- CSP/XSS hardening cannot keep localStorage token risk acceptable,
- non-Google auth becomes a product requirement,
- or deployment needs server-side session revocation.

### Force `oidc-spa.withAutoLogin()`

Rejected.

It risks redirect loops and makes explicit logout harder because the app would immediately try to log in again after logout.

### Keep only the `auth-fallback` retry flag

Rejected as insufficient.

It still depends on the Android full-page Google redirect succeeding. The observed issue is precisely that this redirect can fail.

---

## Rules for future work

- Do not call `useOidc()` directly for route/API authorization decisions; use `core/auth/session.ts` or `core/auth/guard.ts`.
- Components may use `useOidc()` for live OIDC-only features, but must handle the cached-auth state if they render in protected routes.
- Any future token persistence changes must preserve the bounded expiry behavior.
- If a service worker or backend session is introduced later, this ADR must be revisited.
