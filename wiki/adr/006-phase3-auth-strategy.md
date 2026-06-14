# ADR 006: Phase 3 Auth Strategy — Token Endpoint

**Status:** Accepted  
**Date:** 2026-03-22  
**Deciders:** Development Team  
**Context:** Phase 3 — Client-Side Fetching Authentication  
**Supersedes:** ADR 003 §Rationale.1 (Phase 3 migration path — `credentials: 'include'` approach)

---

## Context

Phase 3 replaces Server Actions with client-side React Query fetching. This creates an
authentication gap: the browser needs to authenticate API requests to NestJS, but the current
auth flow is entirely server-side.

**Current flow (Phase 2):**
```
Browser → NextAuth (Google OAuth) → Session cookie (HTTP-only)
Server Action → auth() → getAuthJwt() → signs JWT with AUTH_SECRET via jose → Bearer token → NestJS
```

The browser never sees a usable API token. It has a NextAuth session cookie, but:
- The cookie is HTTP-only (not readable by JavaScript)
- NestJS validates `Authorization: Bearer <JWT>` headers, not NextAuth cookies
- The browser doesn't have `AUTH_SECRET` and cannot sign JWTs

ADR 003 hand-waved this problem (lines 115-119), suggesting `credentials: 'include'` would
send the session cookie to NestJS. That doesn't work because:
1. The Next.js rewrite proxy (`/api/v1/*` → NestJS) strips cookies
2. NestJS `AuthGuard` only reads `Authorization` headers, not cookies
3. Even if cookies were forwarded, NestJS would need new logic to decode NextAuth session
   cookies — coupling it to NextAuth internals

### Additional requirement: multi-provider auth

The user wants to support multiple OAuth providers in the future (not just Google). The auth
strategy must be provider-agnostic — NextAuth handles provider variety, and the API auth
mechanism should not care which provider was used.

---

## Decision

**Add a `/api/token` Next.js API route** that returns a signed JWT for the current session.
The client fetches this token on app load, stores it in memory, and attaches it as a Bearer
token to all API requests. NestJS auth stays completely unchanged.

### How it works

```
Browser                    Next.js                         NestJS
  │                          │                               │
  │ 1. GET /api/token        │                               │
  │ ─────────────────────>   │                               │
  │   (session cookie sent   │                               │
  │    automatically)        │                               │
  │                          │ 2. auth() → getAuthJwt()      │
  │                          │    signs JWT with AUTH_SECRET  │
  │                          │                               │
  │ 3. { token: "eyJ..." }  │                               │
  │ <─────────────────────   │                               │
  │                          │                               │
  │ 4. Store token in memory │                               │
  │                          │                               │
  │ 5. GET /api/v1/stores ──────── (rewrite) ──────────────> │
  │    Authorization: Bearer eyJ...                          │
  │                          │                 6. Validate JWT│
  │                          │                    (unchanged) │
  │ 7. { stores: [...] }    │ <───────────────────────────── │
  │ <────────────────────────│                               │
```

### Token lifecycle

- **Fetch:** On app load, before any API call. React Query's `QueryClientProvider` wrapper
  fetches the token.
- **Store:** In a module-scoped variable (not localStorage, not sessionStorage — memory only).
  This avoids XSS token theft from storage.
- **Attach:** The client-side API client reads the in-memory token and adds the
  `Authorization` header.
- **Refresh:** On 401 response, the client re-fetches `/api/token`. If that also fails
  (session expired), redirect to login.
- **Clear:** On logout, clear the in-memory token.

---

## Options Considered

### Option A: Session cookie passthrough

Browser sends requests to `/api/v1/*`, NestJS validates the NextAuth session cookie directly.

**Pros:**
- No token management on client
- Simple client code

**Cons:**
- NestJS needs new auth middleware to decode NextAuth encrypted cookies
- Couples NestJS to NextAuth internals (encryption format, cookie name)
- NextAuth cookie format is not a stable API — breaking changes across versions
- Doesn't work for Phase 4 (RxDB sync runs outside the browser cookie context)

### Option B: Token endpoint (Chosen)

Next.js API route returns a signed JWT. Client stores in memory, sends as Bearer.

**Pros:**
- NestJS auth stays exactly as-is (zero changes)
- Clean separation: NextAuth handles sessions, NestJS validates JWTs
- Provider-agnostic: token endpoint works regardless of OAuth provider
- Works for Phase 4: RxDB sync can fetch a token the same way
- In-memory storage avoids XSS token theft from localStorage

**Cons:**
- Extra HTTP round-trip on app load (~50ms on localhost, negligible)
- Need token refresh logic (but React Query makes this straightforward)

### Option C: Inject token via NextAuth session

Expose the raw JWT through `useSession()` so the client can attach it directly.

**Pros:**
- Token available immediately, no extra round-trip

**Cons:**
- NextAuth's `useSession()` returns session data, not a signed JWT — the token object
  in the session is the *unsigned payload*, not a Bearer-ready string
- Signing requires `AUTH_SECRET` in the browser — **unacceptable security risk**
- Even exposing the session token directly would require `NEXTAUTH_SECRET` client-side

### Option D: Server-side proxy signs JWT per request

Replace the Next.js rewrite with an API route handler that calls `getAuthJwt()` and forwards
each request to NestJS with the signed JWT attached. Browser sends unauthenticated requests.

**Pros:**
- Browser needs zero token logic
- NestJS auth unchanged

**Cons:**
- Every API request goes through a Next.js handler (not just a rewrite)
- Adds latency to every request, not just the initial token fetch
- More complex to implement (generic proxy route that handles all methods, bodies, headers)
- Doesn't work for Phase 4 (RxDB sync bypasses the browser request path)

### Option E: Replace NextAuth entirely

Use a custom auth solution that gives the browser a JWT directly after OAuth.

**Pros:**
- Full control over token format and delivery

**Cons:**
- Massive effort to replace working auth infrastructure
- Lose NextAuth's provider ecosystem, session management, CSRF protection
- Doesn't solve the problem, just moves it

---

## Rationale

### 1. Zero NestJS changes

The NestJS `AuthGuard` (`apps/server/src/auth/auth.guard.ts`) extracts a Bearer token from
the `Authorization` header and validates it with `AUTH_SECRET`. This works today and continues
to work unchanged. No new auth middleware, no cookie parsing, no NextAuth coupling.

### 2. Provider-agnostic

The token endpoint calls `getAuthJwt()`, which calls `auth()` → gets the session → signs a
JWT. It doesn't care whether the user signed in with Google, GitHub, or email/password.
Adding a new OAuth provider to NextAuth automatically works with the token endpoint.

### 3. Phase 4 compatible

RxDB replication runs in a service worker or background context. It can fetch `/api/token`
the same way the main app does, getting a Bearer token for sync requests. This is the same
pattern ADR 003 envisioned for Phase 4 (line 127-134).

### 4. Security: in-memory token storage

Storing the token in a JavaScript variable (not localStorage/sessionStorage) means:
- XSS attacks can't read the token from storage APIs
- Token doesn't survive page refresh (re-fetched from `/api/token` using the session cookie)
- Session cookie remains HTTP-only (XSS can't steal it either)

The attack surface is limited to active XSS execution context, which is the same for any
authenticated SPA.

### 5. Minimal code

The implementation is ~30 lines total:
- ~10 lines for the API route
- ~20 lines for the client-side token manager

---

## Implementation

### Token endpoint

```typescript
// apps/web/src/app/api/token/route.ts
import { getAuthJwt } from '@/core/lib/api-client'

export async function GET() {
  const token = await getAuthJwt()
  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return Response.json({ token })
}
```

### Client-side token manager

```typescript
// apps/web/src/core/lib/auth-token.ts
let token: string | null = null

export async function getToken(): Promise<string | null> {
  if (token) return token
  return refreshToken()
}

export async function refreshToken(): Promise<string | null> {
  const res = await fetch('/api/token')
  if (!res.ok) {
    token = null
    return null
  }
  const data = await res.json()
  token = data.token
  return token
}

export function clearToken() {
  token = null
}
```

### Client-side API client (new, browser-side)

```typescript
// apps/web/src/core/lib/api.ts
import { getToken, refreshToken } from './auth-token'

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await getToken()
  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  // On 401, try refreshing the token once
  if (res.status === 401) {
    const newToken = await refreshToken()
    if (!newToken) {
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    // Retry with new token
    return fetch(`/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    })
  }

  return res
}
```

### Request flow

```
/api/token     →  Next.js API route  →  getAuthJwt()  →  signed JWT returned
/api/v1/stores →  Next.js rewrite    →  NestJS         →  AuthGuard validates Bearer token
```

The existing Next.js rewrite in `next.config.mjs` continues to proxy `/api/v1/*` to NestJS.
The `/api/token` route is a separate Next.js API route, not proxied.

---

## Consequences

### Positive
- NestJS auth is completely unchanged
- Single small API route added to Next.js
- Provider-agnostic — supports future multi-provider auth
- Compatible with Phase 4 (RxDB sync)
- In-memory token storage is more secure than localStorage
- Token refresh on 401 is handled transparently by the API client

### Negative
- Extra round-trip on app load to fetch the token
- Token lost on page refresh (re-fetched from `/api/token`, ~50ms)
- Slightly more complex client-side API client vs. simple `credentials: 'include'`

### Risks
- **Token expiration:** NextAuth JWTs default to 30-day expiry. For a homelab grocery app,
  this is fine. The 401 retry handles expiration transparently.
- **Race condition on refresh:** If multiple requests hit 401 simultaneously, they could all
  trigger `refreshToken()`. Mitigation: deduplicate refresh calls (single in-flight promise).

---

## Relationship to Other ADRs

- **ADR 003 (JWT Authentication):** This ADR resolves the Phase 3 gap identified in ADR 003's
  migration path. ADR 003's Phase 3 section (lines 112-121) assumed `credentials: 'include'`
  would work — it doesn't. The token endpoint is the correct mechanism.
- **ADR 001 (Simple REST + Zod):** The client-side API client follows the same pattern as the
  server-side `apiClient` — simple fetch wrapper with Zod validation.
- **ADR 002 (Evolutive Architecture):** This fits the phased approach — minimal changes to
  existing infrastructure, additive rather than rewrite.

---

**Decision Date:** March 22, 2026  
**Review Date:** Before Phase 4 (validate RxDB sync compatibility)  
**Status:** Active
