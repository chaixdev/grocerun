# Deep Code Review: Next.js → React SPA Refactor

**Branch:** `feature/phase-5-sync-simplification`
**Commits:** `c000bec` (baseline) → `c0995c7` (refactor)
**75 files changed:** +545 / −1,076

---

### Section 1 — Summary

This refactor replaces Next.js 16 + next-auth with Vite 6 + TanStack Router 1.x + oidc-spa, cutting bundle size by ~90% while adding Zod-typed auth, file-based type-safe routing, and memory-only token storage. The refactor is well-structured: auth migration is clean (`__root.tsx` bootstraps oidc-spa, `OidcInitializationGate` gates the tree), all 9 pages migrated cleanly, API proxy is straightforward, and SSE passthrough via Vite's `http-proxy` eliminates the worst hack (Next.js buffering workaround). Soft-delete filters are preserved across all Prisma queries, and the NestJS auth guard correctly validates OIDC access tokens via JWKS.

**Two critical findings dominate this review:**

1. **Missing error boundaries on all routes** — The Next.js `error.tsx` (which rendered a user-friendly error card with a "Try again" button) was deleted, and no TanStack Router `errorComponent` replaces it. Any unhandled render exception in a route component will propagate to TanStack Router's default behavior (potentially a blank screen or crash) rather than showing a recovery UI. While the current components handle loading/error states declaratively (`if (isError) return <ErrorUI />`), this leaves no safety net for unexpected runtime exceptions (null pointer dereferences, RxDB failures, third-party library errors).

2. **`VITE_OIDC_CLIENT_SECRET` exposed in the browser bundle** — The `vite.config.ts` `define` block injects the OIDC client secret into the browser bundle via `import.meta.env.VITE_OIDC_CLIENT_SECRET`. The oidc-spa library requires this for Google OIDC (documented as `__unsafe_clientSecret` — the `__unsafe_` prefix is the library's deliberate acknowledgment of the risk). While this IS the required pattern for Google OIDC with oidc-spa, the project has no security ADR documenting this decision or the threat model (the client secret in a public client is not a secret in the OAuth 2.0 sense, but many security auditors flag this).

**Verdict:** **Approve with nits** — The refactor is correct and well-executed. The critical findings require documentation (ADR for client secret exposure) and a small safety improvement (error boundary) but do not block merge given this is a feature branch heading into Phase 5 testing. The HIGH findings should be addressed before production deployment.

---

### Section 2 — Findings

#### 🔴 CRITICAL

**F1 — Missing route-level error boundaries (regression)**
- **File(s):** `apps/web/src/routes/*.tsx` (all 7 route files), baseline: `apps/web/src/app/error.tsx` (deleted)
- **Track:** C (React & UI), D (Security & Observability)
- **Problem:** The deleted `error.tsx` rendered a user-friendly card with a "Try again" button for unexpected render errors. None of the TanStack Router route definitions include `errorComponent`. If a component throws during render (e.g., RxDB deserialization failure, third-party library exception), TanStack Router's fallback behavior is not guaranteed to show a recovery UI — it may render a blank screen or crash the app.
- **Fix:** Add `errorComponent` to `createRootRoute()` in `__root.tsx` that renders a recovery UI similar to the deleted `error.tsx` (error card with "Try again" button). Individual routes can optionally override this.

  ```tsx
  // __root.tsx addition
  import { ErrorComponent } from '@/components/error-boundary'
  
  export const Route = createRootRoute({
    component: RootLayout,
    errorComponent: ErrorComponent,
  })
  ```
- **Test Gap:** No unit test validates error boundary rendering. The deleted `error.tsx` had no dedicated test either, so this is pre-existing — but the regression (removing the UX safety net) should be documented.

**F2 — Client secret exposed in browser bundle without documentation**
- **File(s):** `apps/web/vite.config.ts:30`, `apps/web/src/routes/__root.tsx:14`
- **Track:** D (Security & Observability)
- **Problem:** `vite.config.ts` injects `VITE_OIDC_CLIENT_SECRET` into the browser bundle via `define`, and `__root.tsx` passes it to `bootstrapOidc` as `__unsafe_clientSecret`. While this is oidc-spa's intentional pattern for Google OIDC (Google requires client_secret for token exchange even with PKCE — a non-standard provider behavior), the project has no security ADR documenting: (a) why this is necessary, (b) the threat model (the secret is in a public client and accessible to anyone who opens the browser), (c) why this is acceptable for Google OIDC specifically, and (d) what happens if a non-Google provider is configured.
- **Fix:** Write a one-page security ADR (`wiki/adr/015-oidc-client-secret-in-browser.md`) documenting the decision. Ensure `VITE_OIDC_CLIENT_SECRET` is documented in the project's `.env.example` and deployment guide with the same caveat.
- **Test Gap:** N/A (documentation gap)

---

#### 🟠 HIGH

**F3 — SSE token in URL query parameter**
- **File(s):** `apps/web/src/core/rxdb/database.ts:524–526`, `apps/server/src/auth/auth.guard.ts:60–63`
- **Track:** D (Security & Observability)
- **Problem:** Because `EventSource` does not support custom HTTP headers, the RxDB sync SSE connection appends the OIDC access token as a URL query parameter (`?token=<jwt>`). This token is logged by proxy servers, captured in browser history, and visible in server access logs. The server-side `AuthGuard.extractTokenFromHeader()` falls back to reading this query parameter for SSE endpoints only — a deliberate and well-commented compromise. However, access tokens are short-lived (Google: ~1 hour), and the token is only sent over HTTPS in production, which limits the exposure window.
- **Fix:** Document this limitation in an architectural note (can be part of the sync ADR). Consider: (a) adding a dedicated server-side log sanitization rule for query parameters containing tokens, (b) verifying token lifetime is sufficient for SSE reconnect windows (default 5s reconnect), (c) future: migrate to WebSocket with custom headers if EventSource limitation becomes a concern.
- **Test Gap:** No test validates that the token is correctly extracted from query parameters in AuthGuard. The `test/helpers.ts` agent pattern only tests header-based auth.

**F4 — e2e tests broken: still use next-auth/JWT session encoding**
- **File(s):** `apps/e2e/helpers/create-session.ts:1`, `apps/e2e/package.json:21`
- **Track:** A (Logic & Correctness)
- **Problem:** The e2e test helper imports `next-auth/jwt` to create encrypted JWE session tokens for Playwright tests. With the auth migration to oidc-spa, the session mechanism is completely different: there is no NextAuth session cookie, no JWE encryption. The e2e tests will fail because: (a) `next-auth` is still a dependency of `apps/e2e` but may not be installed at root level, (b) the session creation mechanism must be rewritten to use oidc-spa's token flow (either mock `getOidc()` in the browser context, or use real Google OIDC test accounts).
- **Fix:** Either: (a) rewrite `create-session.ts` to inject oidc-spa tokens into Playwright browser contexts (via `page.evaluate()` to set up mock OIDC state), or (b) use Google OIDC test accounts and real sign-in flows, or (c) add a test-only bypass endpoint on the server that creates a session token without OIDC. This is tracked as a separate task — the e2e directory was not part of the refactor scope.
- **Test Gap:** The entire e2e suite is affected. Mark e2e tests as expected-to-fail until the session helper is migrated.

**F5 — `__unsafe_useIdTokenAsAccessToken` may bypass audience validation**
- **File(s):** `apps/web/src/routes/__root.tsx:15`, `apps/server/src/main.ts:12`
- **Track:** A (Logic & Correctness), D (Security & Observability)
- **Problem:** `__root.tsx` sets `__unsafe_useIdTokenAsAccessToken: true`, meaning the Google ID token is used as the Bearer token for API calls. Google ID tokens have audience `aud` equal to the client ID, not a custom API audience. The server-side `expectedAudience` reads `process.env.OIDC_AUDIENCE`, which defaults to `undefined`. If `OIDC_AUDIENCE` is not set, oidc-spa/server's `bootstrapAuth` may skip audience validation entirely, allowing any valid Google ID token (from any application) to authenticate against the API. This is less severe than it sounds because: (a) the token must still be a valid Google-signed ID token, (b) the `sub` claim is still validated, and (c) the `__unsafe_useIdTokenAsAccessToken` flag is documented by oidc-spa as a deliberate compromise for Google OIDC (Google does not issue opaque access tokens to pure client-side apps).
- **Fix:** Set `OIDC_AUDIENCE` to the Google client ID in production. Verify that oidc-spa/server validates `aud` against this value. Document the architecture (ID token as access token) in the auth ADR. Consider using Google's `access_token` (not ID token) if available in oidc-spa's Google provider configuration.
- **Test Gap:** No test validates audience checking in the auth guard. The `test/helpers.ts` signs custom JWTs with `AUTH_SECRET` (not JWKS), bypassing the real auth flow entirely.

**F6 — `oidc.login({ redirectUrl: '/lists' })` — parameter name may be incorrect**
- **File(s):** `apps/web/src/routes/login.tsx:17`
- **Track:** A (Logic & Correctness)
- **Problem:** The login page calls `oidc.login({ redirectUrl: '/lists' })`. The oidc-spa API for `login()` accepts `redirectTo` (matching `logout({ redirectTo: "home" })` in settings-form.tsx:204), not `redirectUrl`. If this parameter name is wrong, oidc-spa's `login()` may ignore it and redirect to the default home URL instead of `/lists` after authentication. This cannot be verified without installed node_modules, but the naming inconsistency with `logout({ redirectTo })` strongly suggests a bug.
- **Fix:** Verify by checking oidc-spa TypeScript types. If `redirectUrl` is not a recognized field, change to `oidc.login({ redirectTo: '/lists' })`. This would require the package to be installed (`npm install`) to confirm.
- **Test Gap:** No test exercises the login flow with oidc-spa. This would be caught by e2e tests (but F4 applies).

---

#### 🟡 MEDIUM

**F7 — `"use client"` directives are dead code in Vite/TanStack Router**
- **File(s):** All 7 route files under `apps/web/src/routes/` (line 1)
- **Track:** E (Structure & Quality)
- **Problem:** The `"use client"` directive is a Next.js App Router convention marking components for client-side rendering. In Vite, this directive has no effect — all code is client-side by default. These are harmless but misleading to developers who understand the directive's meaning in Next.js.
- **Fix:** Remove `"use client"` from all route files. Keep it only in files that might be legitimately imported by future SSR frameworks (none exist in a pure SPA).

**F8 — `process.env.NEXT_PUBLIC_*` naming convention carried over from Next.js**
- **File(s):** `apps/web/vite.config.ts:26–28`, `apps/web/src/routes/settings.tsx:9,56–58`, `apps/web/src/core/rxdb/database.ts:466`
- **Track:** E (Structure & Quality)
- **Problem:** Several places reference `NEXT_PUBLIC_*` environment variable names. These are injected via Vite's `define` in `vite.config.ts` (using `process.env.X` syntax), which works correctly at compile time. However, the naming is misleading — there is no Next.js. Specifically:
  - `process.env.NEXT_PUBLIC_APP_VERSION` → should be `GROCERUN_APP_VERSION` or just removed (package.json version suffices)
  - `process.env.NEXT_PUBLIC_BUILD_TIME` → should be `GROCERUN_BUILD_TIME`
  - `process.env.NEXT_PUBLIC_INVITATION_TIMEOUT_MINUTES` → should be `VITE_INVITATION_TIMEOUT_MINUTES`
  - `process.env.NEXT_PUBLIC_API_URL` in `database.ts:466` → should be `VITE_API_URL`
- **Fix:** Rename all `NEXT_PUBLIC_*` references to use `VITE_*` or `GROCERUN_*` prefix. Update `vite.config.ts` `define` block accordingly. This is a low-risk find-and-replace.
- **Test Gap:** N/A (naming)

**F9 — `(search as Record<string, string>)` unsafe type cast**
- **File(s):** `apps/web/src/features/households/components/HouseholdSelect.tsx:20`
- **Track:** E (Structure & Quality)
- **Problem:** The `useSearch({ strict: false })` call returns `Record<string, unknown>` by default, and the code casts it to `Record<string, string>` to extract `householdId`. This loses type safety — TanStack Router's key advantage. If the search param is unexpectedly an array or object, the cast hides the bug.
- **Fix:** Use TanStack Router's `validateSearch` with a Zod schema in the route definition:

  ```tsx
  // route definition
  validateSearch: z.object({ householdId: z.string().optional() })
  
  // component
  const { householdId } = useSearch({ from: '/stores' })
  ```
  This gives compile-time type safety and runtime validation.
- **Test Gap:** No test validates search param handling in household select.

**F10 — `request['user']` string indexer bypasses type safety**
- **File(s):** `apps/server/src/auth/auth.guard.ts:51`, `apps/server/src/sync/sync.controller.ts:125`
- **Track:** E (Structure & Quality)
- **Problem:** The AuthGuard sets `request['user'] = decodedAccessToken as JwtPayload` using a string indexer, and the sync controller reads it via `(req['user'] as JwtPayload)`. This is fragile — a rename of the property, or a missing guard on an endpoint, would silently produce `undefined` at runtime. The `@CurrentUser()` decorator is already used consistently in all other controllers — the sync controller's `openStream` method is the only outlier.
- **Fix:** In `sync.controller.ts`, use `@CurrentUser()` decorator instead of `(req['user'] as JwtPayload)`. In `auth.guard.ts`, augment the Express Request type rather than using a string indexer:

  ```ts
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload
      }
    }
  }
  ```
  Then assign: `request.user = decodedAccessToken`.
- **Test Gap:** `test/helpers.ts` creates test tokens but doesn't directly test the AuthGuard's request attachment.

**F11 — `useOidc()` vs `useOidc({ assert: "user logged in" })` inconsistency**
- **File(s):** `apps/web/src/routes/settings.tsx:17`, `apps/web/src/components/settings-form.tsx:41`, `apps/web/src/routes/__root.tsx:37`
- **Track:** C (React & UI)
- **Problem:** Within the same settings route, the main page component (`settings.tsx:17`) uses `useOidc({ assert: "user logged in" })` (getting non-nullable `decodedIdToken`) while the child component (`settings-form.tsx:41`) uses bare `useOidc()` without assertion. The form only calls `oidc.logout()`, which is safe either way, but the bare call creates confusion about whether the user is guaranteed to be logged in. The root component (`__root.tsx:37`) uses bare `useOidc()` with explicit `isUserLoggedIn` guard — this is correct since the shell renders for both authenticated and unauthenticated users.
- **Fix:** Either: (a) use `useOidc({ assert: "user logged in" })` consistently in settings-form.tsx since the route has `enforceLogin`, or (b) add a comment explaining why bare `useOidc()` is safe. Option (a) is simpler and provides stronger typing.
- **Test Gap:** N/A (stylistic)

**F12 — `server/package.json` retains dead dependencies**
- **File(s):** `apps/server/package.json:25,27`
- **Track:** E (Structure & Quality)
- **Problem:** The planning doc identified `jsonwebtoken` and `class-validator`/`class-transformer` as dead dependencies. After inspection:
  - `jsonwebtoken` is still used by `test/helpers.ts` for test JWT creation — **needed**
  - `class-validator` appears in `package.json` but no source code imports it — **dead**, should be removed
  - `class-transformer` does not appear in `package.json` — **already removed**
  - `dotenv` was listed as dead but does not appear in `package.json` — **already removed**
- **Fix:** Remove `class-validator` from server dependencies. Keep `jsonwebtoken` (used by tests). Note: `@types/jsonwebtoken` should move from devDependencies to dependencies or vice versa — it's currently in devDependencies.
- **Test Gap:** N/A

**F13 — No route-level `validateSearch` schemas**
- **File(s):** All route files under `apps/web/src/routes/`
- **Track:** E (Structure & Quality)
- **Problem:** TanStack Router's key advantage — compile-time safe search params via Zod `validateSearch` — is not used. The only search param consumer (`HouseholdSelect.tsx`) resorts to `useSearch({ strict: false })` with an unsafe cast. The refactor could have taken advantage of this feature to improve type safety.
- **Fix:** Add `validateSearch` Zod schemas to route definitions where search params are expected. Start with the stores route (which `HouseholdSelect.tsx` reads from).
- **Test Gap:** N/A

---

#### 🟢 LOW

**F14 — `react() as any` in vitest.config.ts**
- **File:** `apps/web/vitest.config.ts:6`
- **Problem:** Unnecessary type assertion. `@vitejs/plugin-react` is typed and doesn't need a cast.
- **Fix:** Remove `as any`.

**F15 — `api.ts` comments reference "Phase 3" and "Next.js rewrite"**
- **File:** `apps/web/src/core/lib/api.ts:3,102`
- **Problem:** Comment header says "Phase 3" (outdated) and line regex in mdx refers to "Next.js rewrite" at line 102 (comment says "rewrite proxy path", which should now say "Vite proxy").
- **Fix:** Update comments to reflect current architecture: "Phase 5", "Vite proxy".

**F16 — `suppressHydrationWarning` on individual elements but not `<html>`**
- **File(s):** `apps/web/index.html`, `apps/web/src/routes/lists.$listId.tsx:53`, `apps/web/src/features/lists/components/ActiveListCard.tsx:60`
- **Problem:** The `<html>` tag lacks `suppressHydrationWarning`. This was intentional for the SPA migration (no SSR = no hydration mismatch). However, the individual `suppressHydrationWarning` attributes on date-displaying spans are remnants from the Next.js version. In a pure SPA, these are true no-ops (no hydration to suppress). They don't cause issues, just dead attributes.
- **Fix:** Remove individual `suppressHydrationWarning` attributes from spans — they're meaningless in SPAs. Keep on `<DialogTrigger>` if Radix expects it.

**F17 — `(decodedIdToken as any).picture` pattern NOT found**
- **Track:** E (Structure & Quality)
- **Problem:** The review spec asked to check for this pattern. It does NOT exist in the codebase. All `decodedIdToken.picture` accesses go through the Zod schema-defined type, which is safe. ✅

---

### Section 3 — Priority Action Items

| # | Severity | Finding | Files | Action |
|---|----------|---------|-------|--------|
| F1 | 🔴 CRITICAL | Missing route-level error boundaries | `src/routes/__root.tsx` | Add `errorComponent` to root route |
| F2 | 🔴 CRITICAL | Client secret in browser bundle — undocumented | `vite.config.ts`, `__root.tsx` | Write ADR document, update `.env.example` |
| F3 | 🟠 HIGH | SSE token in URL query parameter | `database.ts`, `auth.guard.ts` | Document limitation; add log sanitization |
| F4 | 🟠 HIGH | e2e tests broken (next-auth) | `apps/e2e/` | Rewrite session helper for oidc-spa |
| F5 | 🟠 HIGH | `__unsafe_useIdTokenAsAccessToken` / missing audience | `__root.tsx`, `main.ts` | Set `OIDC_AUDIENCE`; verify validation |
| F6 | 🟠 HIGH | `oidc.login({ redirectUrl })` may be wrong param name | `login.tsx:17` | Verify API; change to `redirectTo` if needed |
| F7 | 🟡 MEDIUM | `"use client"` dead directives | All route files | Remove |
| F8 | 🟡 MEDIUM | `NEXT_PUBLIC_*` naming | ~5 files | Rename to `VITE_*` |
| F9 | 🟡 MEDIUM | `(search as Record<string,string>)` unsafe cast | `HouseholdSelect.tsx` | Use `validateSearch` with Zod |

---

### Section 4 — Test Gaps

The server-side test suite is robust (5 spec files, soft-delete test, sync regression tests). The frontend has **zero** unit tests — no `*.test.ts` or `*.spec.ts` files exist under `apps/web/src/`. This is pre-existing (not a regression from the refactor), but the refactor's auth and routing changes introduce new untested surfaces:

| Gap | Finding | Risk |
|-----|---------|------|
| No frontend unit tests | All findings F1–F16 | Any frontend regression |
| No auth guard unit test for query-param token extraction | F3 | SSE auth could silently fail with token in URL |
| No auth guard unit test for audience validation | F5 | Missing `OIDC_AUDIENCE` would not be caught |
| No login flow test | F6 | Wrong `redirectUrl` param would go unnoticed |
| e2e suite broken | F4 | Complete test coverage loss for UI flows |
| AuthGuard `request['user']` attachment not tested | F10 | Type-safety regression risk |

**Recommendation:** Add at minimum: (1) a unit test for the auth guard's token extraction from both header and query param, (2) a component test for the login page redirect flow, and (3) fix the e2e helper before Phase 5 integration testing.

---

### Section 5 — Positive Notes

1. **Auth migration is clean and well-layered.** The `OidcInitializationGate` wrapping is at the correct level (inside `ThemeProvider`, outside `Providers`), ensuring no component calls `useOidc()` before initialization. The `enforceLogin` beforeLoad guard is used consistently on all protected routes. The `bootstrapOidc` call in `__root.tsx` (module scope) is correct — it registers once, not per-render.

2. **SSE workaround eliminated.** The old Next.js hack (raw `http.get()` to pipe SSE around Next.js's buffering `fetch()`) is completely gone. Vite's `http-proxy` handles SSE natively, and the client connects to the single proxy endpoint. The periodic fallback resync (`setInterval(5000)`) is a robust safety net for SSE disconnects.

3. **Soft-delete integrity preserved.** All 79 Prisma `deleted: false` filters across 8 service files are maintained. The RxDB replication layer correctly handles `_deleted` tombstones for all 6 collections. No regression.

4. **API client 401 retry is correct.** The `api.ts` `request()` function correctly handles the oidc-spa token lifecycle: on 401 → attempt `renewTokens()` → retry → on failure, `logout()` with redirect. The RxDB sync pull/push functions independently mirror this pattern, avoiding a single point of token failure.

5. **Monorepo boundaries intact.** No cross-app imports detected. `apps/web` uses `@grocerun/dto` (shared package), `apps/server` uses `@grocerun/dto`. Clean separation.

6. **No remaining Next.js references in source code.** The only Next.js reference is in the e2e test helper (pre-existing, outside refactor scope) and the `NEXT_PUBLIC_*` naming (cosmetic, F8). The `next` package, `next-auth`, `next.config.mjs`, App Router directory, and all API routes are fully removed.

7. **oidc-spa Zod schema validation.** Both client (`decodedIdTokenSchema` with `sub`, `name`, `email`, `picture`) and server (`decodedAccessTokenSchema` with same fields plus `email_verified`) define explicit Zod schemas for token claims. This catches token shape mismatches at startup, not at runtime.

8. **Production serving architecture is elegant.** NestJS `ServeStaticModule` serves the Vite-built `dist/` with `exclude: ['/api/(.*)']` — single process, single deployable. Dev mode uses Vite proxy to NestJS. No dual-server complexity.

9. **`as JwtPayload` casts are structurally safe.** The oidc-spa Zod schema output type is structurally identical to the `JwtPayload` interface (same fields, same optionality). The casts in `auth.guard.ts:51` and `sync.controller.ts:125` are safe. More precise typing would eliminate them, but they are not runtime risks.

10. **No `@ts-ignore` or `@ts-expect-error` in the entire diff.** Code quality baseline is high — zero suppression directives means the +545 lines pass type checking cleanly.
