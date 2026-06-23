# Auth Conventions

**Status:** Established  
**Category:** Security / Auth  
**Context:** Grocerun supports any OIDC provider via `oidc-spa`. Google is the default (backward compat) but is the exception, not the model — it requires a client secret in the browser and uses the ID token as the access token. Standard OIDC providers (Authentik, Keycloak, etc.) use PKCE without secrets. Tokens validated via provider JWKS on the server and stored in memory on the client (with localStorage fallback for session restoration).

## 1. Identity Provider

- Any OIDC-compliant provider via `oidc-spa`. Google is the default for
  backward compatibility; set `OIDC_ISSUER_URI` to use another provider.
- Recommended self-hosted provider: [Authentik](https://goauthentik.io) —
  privacy-conscious, full OIDC discovery, PKCE without secrets.
- No username/password or email/password flows. OIDC is the sole auth
  mechanism.
- **Google is the exception:** it requires `__unsafe_clientSecret` (even
  with PKCE) and `__unsafe_useIdTokenAsAccessToken` (opaque access tokens).
  These options are only injected when `issuerUri` includes
  `accounts.google.com`. Standard providers omit both.

## 2. Backend (NestJS)

### Token Flow
```
Google OIDC → ID Token → /api/token → JWT Access Token → Bearer header
```

### Authentication
- JWT tokens in `Authorization: Bearer <token>` header.
- `AuthGuard` on all controllers by default. `@UseGuards(AuthGuard)` at
  the class level; method-level `@Public()` for unauthenticated endpoints.
- `@CurrentUser()` decorator extracts the authenticated user from the
  request context.
- JWKS validation: the server validates the token signature against
  the provider's public keys (discovered via `OIDC_ISSUER_URI`'s
  `.well-known/openid-configuration`).
- Token generation: `/api/token` endpoint exchanges OIDC ID token for
  a JWT access token.

### Authorization
- Household-level access: every data query must scope by `householdId`.
- Store-level access: every store query must scope by `store.householdId`
  (indirect household access check).
- `verifyHouseholdAccess()` / `verifyStoreAccess()` server-side before
  any mutation.
- Cross-household access MUST return 403 (Forbidden), not 404 (Not Found).
  Returning 404 leaks the existence of resources in other households.

### Shopping Lock Identity
- `list.assignedTo` stores the Google OIDC `sub` (not the database
  `userId`) because the frontend only has access to
  `oidc.decodedIdToken.sub`.
- `checkShoppingLock()` must compare `oidc.decodedIdToken.sub` against
  `list.assignedTo`, not `userId`.

## 3. Frontend (React)

- `oidc-spa` singleton at `@/core/auth/oidc.ts` — one OIDC client
  instance for the entire app.
- Token stored in memory (never localStorage for the primary token).
  Bearer header on all API calls via a centralized API client.
- SSE connections pass the token as `?token=` query parameter (EventSource
  limitation).
- Session restoration: `oidc-spa` `sessionRestorationMethod: "full page redirect"`
  + localStorage token-cache fallback with 60s freshness skew and 30s
  logout re-seed block.
- `OIDC_CLIENT_SECRET` in browser bundle — Google-only trade-off (H7).
  Only included when issuer is Google; standard OIDC providers use PKCE
  without secrets.

## 4. Route Guards

- `enforceAppLogin` guard at `@/core/auth/guard.ts` wraps all authenticated
  routes in TanStack Router.
- Routes that don't require auth should be explicitly marked (e.g., login
  page, public landing pages).

## 5. Testing

- Use `makeTestToken()` from server test helpers — never mock the auth
  guard or bypass auth in tests. See [Testing Standards](./testing-standards.md).

## 6. Anti-Patterns

### Mocking Auth Guard in Tests
Do not mock `AuthGuard` or use `overrideGuard()` in NestJS test modules.
The `auth.guard.ts` has a built-in test-mode bypass (lines 47-61) that
recognizes test tokens signed with a known secret — this avoids breaking
controller DI bindings that `overrideGuard` corrupts in vitest.

Similarly on the frontend, mocking `session` or `hasAppAuth` in unit tests
(e.g., `guard.test.ts` line 5-7) should be avoided in favour of
integration-level tests that exercise the full auth path.

**Always use `makeTestToken()` from the server test helpers instead.**

### Returning 404 for Cross-Household Access
Returning 404 when a user accesses a resource in a household they don't
belong to leaks the existence of that resource. The `AccessService`
correctly throws `ForbiddenException` for cross-household access
(`access.service.ts` line 33, 57). Never user `NotFoundException` for
authorization failures.

### Comparing `list.assignedTo` Against DB `userId` Instead of OIDC `sub`
The shopping lock field `list.assignedTo` stores the Google OIDC `sub`,
not the internal database `userId`. Passing the wrong ID to
`checkShoppingLock()` or `assertShoppingLock()` results in stale or
impossible-to-release locks.

The `ListsService` correctly accepts both IDs as separate parameters
(e.g., `startShopping(listId, userId, assignedToId)` at
`lists.service.ts` line 391), passing `userId` for store access checks
and `assignedToId` (i.e., `user.sub`) for the shopping lock. Always
keep these two concepts distinct.

### Storing JWT in localStorage
The primary JWT access token is held in memory only. The
`token-cache.ts` localStorage cache is strictly a *session restoration
fallback* with a 60-second freshness skew (`AUTH_CACHE_EXPIRY_SKEW_MS`,
`token-cache.ts` line 17) and a 30-second logout re-seed block
(`AUTH_LOGOUT_RESEED_BLOCK_MS`, `token-cache.ts` line 18). Do not
extend TTLs, remove the skew, or promote the cache to primary storage.

### Hardcoding OIDC Secrets
The `OIDC_CLIENT_SECRET` is only included in the browser config when the
issuer is Google (`accounts.google.com`). This is an accepted trade-off
(H7) because Google requires a client secret at the token endpoint even
with PKCE. For standard OIDC providers (Authentik, Keycloak, etc.) the
secret is never sent to the browser — PKCE alone is used. Do not add
additional secrets or API keys that would also leak; route all privileged
operations through the NestJS backend, which holds server-side secrets.

## 7. Reference Implementation

### Frontend OIDC Bootstrap
*   **OIDC Singleton:** `apps/web/src/core/auth/oidc.ts`
    *   Bootstrap utilities: Lines 20-26 (`bootstrapOidc`, `useOidc`, `getOidc`, `enforceLogin`, `OidcInitializationGate`)
    *   ID token shape schema: Lines 27-34 (`decodedIdTokenSchema`)

### Frontend Session Management
*   **Session Facade:** `apps/web/src/core/auth/session.ts`
    *   `hasAppAuth()`: Lines 22-25
    *   `getAppAccessToken()`: Lines 27-34
    *   `refreshAppAccessToken()`: Lines 36-44
    *   `clearAppAuth()`: Lines 54-56
    *   `persistLiveOidcSession()`: Lines 46-52

### Frontend Token Cache
*   **Token Cache:** `apps/web/src/core/auth/token-cache.ts`
    *   `writeCachedAuth()`: Lines 89-105
    *   `readCachedAuth()`: Lines 107-130
    *   `clearCachedAuth()`: Lines 40-42
    *   `beginAuthLogout()`: Lines 77-83
    *   `getCachedAccessToken()`: Lines 132-134
    *   Cache expiry skew: Line 17 (`AUTH_CACHE_EXPIRY_SKEW_MS = 60_000`)
    *   Logout re-seed block: Line 18 (`AUTH_LOGOUT_RESEED_BLOCK_MS = 30_000`)

### Frontend Route Guard
*   **Route Guard:** `apps/web/src/core/auth/guard.ts`
    *   `enforceAppLogin()`: Lines 4-7

### Server AuthGuard
*   **AuthGuard:** `apps/server/src/auth/auth.guard.ts`
    *   `canActivate()`: Lines 38-89
    *   Test-mode bypass: Lines 47-61
    *   Token extraction from header: Lines 91-94
    *   SSE query-token fallback: Lines 95-118
    *   `JwtPayload` interface: Lines 21-28

### Server Auth Service
*   **AuthService:** `apps/server/src/auth/auth.service.ts`
    *   `resolveOidcUser()`: Lines 24-75
    *   `OidcUserPayload` interface: Lines 4-10

### Server Decorators
*   **@CurrentUser():** `apps/server/src/auth/current-user.decorator.ts`
    *   Decorator factory: Lines 13-17

### Example Controller
*   **Lists Controller:** `apps/server/src/lists/lists.controller.ts`
    *   `@UseGuards(AuthGuard)` class-level: Line 10
    *   `@CurrentUser()` usage pattern: Lines 17, 25, 33, 41, etc.

### Server Access Control
*   **AccessService:** `apps/server/src/shared/access.service.ts`
    *   `verifyStoreAccess()`: Lines 13-35
    *   `verifyHouseholdAccess()`: Lines 41-59
    *   `assertShoppingLock()`: Lines 65-81
*   **Shopping Lock Check:** `apps/server/src/shared/shopping-lock.ts`
    *   `checkShoppingLock()`: Lines 9-26

### Sync Access (Opaque 403)
*   **Sync Service:** `apps/server/src/sync/sync.service.ts`
    *   Opaque 403 strategy documentation: Lines 212-218
    *   `verifyHouseholdAccess()`: Lines 220-233

See [Auth Restoration](../technical-design/auth-restoration.md) for the
full session restoration lifecycle.
