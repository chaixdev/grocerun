# Dependency Cleanup Audit → Refactor Plan

## Goal

Remove Next.js and all migration-path cruft. Replace with a clean React SPA
(Vite + TanStack Router) that talks to the NestJS backend through a single
standard API proxy.

Core question: **if we were building from the ground up with currently
understood requirements, would we end up with the same project shape?**

**Answer from audit: No.** The app is a client-side SPA. Next.js is dead weight.

---

## Audit Findings

### Next.js features actively used

| Feature | Used by | Replacement |
|---------|---------|-------------|
| App Router (file-based routes) | 9 pages, 1 layout, 4 error boundaries | TanStack Router |
| `next/navigation` (usePathname, useParams, useRouter, redirect) | 13 files | TanStack Router equivalents |
| `next/link` | 8 files | TanStack Router `<Link>` |
| `next/image` | 2 files (header.tsx, sidebar.tsx) | Standard `<img>` |
| `next/font/google` | layout.tsx (Inter font) | `@fontsource/inter` |
| Rewrites (API proxy) | `/api/v1` → NestJS `:3001` | Vite proxy |
| API routes | 3 routes (health, token, SSE stream) | Vite proxy or NestJS |
| Metadata API | title, description, icons | `<head>` / react-helmet-async |
| NextAuth middleware | proxy.ts | oidc-spa route guards |

### Next.js features NOT used (dead weight)

SSR, RSC, ISR, SSG, Server Actions, Suspense, streaming, image optimization,
middleware.ts. **59/65 components are `"use client"`.**

### Migration-path cruft

| File | Lines | Why dead |
|------|-------|----------|
| `core/lib/api-client.ts` | 192 | Phase 2 client — unused, `api.ts` is active |
| `core/auth/auth.ts` | 9 | NextAuth wrapper — replaced by oidc-spa |
| `core/auth/auth.config.ts` | — | NextAuth config — replaced by oidc-spa |
| `proxy.ts` | 10 | NextAuth middleware — replaced by route guards |
| `types/next-auth.d.ts` | — | NextAuth types — gone |
| `/api/v1/sync/stream/route.ts` | — | SSE workaround (raw http.get) — Vite proxy handles SSE natively |
| `/api/token/route.ts` | — | JWT exchange — OIDC access token IS the Bearer token |

### SSE workaround (the worst hack)

Next.js's internal `fetch()` buffers streaming responses, so a dedicated
API route was written using raw `http.get()` to pipe SSE from NestJS.
The client also bypasses the proxy and connects EventSource to localhost:3001
directly. With Vite's `http-proxy`, SSE passthrough works natively. This
entire file disappears.

### Server stale deps

| Dep | Status |
|-----|--------|
| `rxjs` | Never imported — dead |
| `dotenv` | Not imported (NestJS ConfigModule handles env) — dead |
| `jsonwebtoken` | Wrapped by `@nestjs/jwt` — dead |
| `class-validator` | Appears in imports but validation is ZodValidationPipe — dead imports |
| `class-transformer` | Unused (Zod replaces it) — dead |

---

## Architecture Decisions

### 1. Auth: oidc-spa

Multi-provider OIDC (Google, Microsoft, Facebook, Apple, Keycloak, Authelia,
Authentik — any OIDC provider).

**Why over react-oidc-context:**
- Explicit provider quirks handling (Google PKCE, Keycloak iframe, Entra ID tokens)
- Zod schema validation for token claims (type-safe, catches mismatches at startup)
- Memory-only token storage (no XSS token theft via localStorage)
- Refresh token flow for silent renew (no iframe, no third-party cookie issues)
- Built-in multi-tab sync (BroadcastChannel)
- `beforeLoad` guards for authenticated routes
- Has `oidc-spa/server` for backend token validation

**Risk:** Single maintainer (garronej, Keycloakify). Mitigation: API surface is
small — swapping auth providers later is a bounded ~1-day refactor.

**NestJS integration:** `passport-jwt` + `jwks-rsa` validates OIDC access
tokens against provider's JWKS endpoint. No `/api/token` endpoint needed.

### 2. Router: TanStack Router

File-based type-safe routing with Zod search param validation.

**Why over React Router v7:**
- End-to-end type inference (params, search, loader data) — no `as any` casts
- `validateSearch` with Zod schemas — compile-time safe search params
- `beforeLoad` hook for auth guards (clean integration with oidc-spa)
- Smaller bundle (~40 KB vs ~58-67 KB)
- File-based routing built-in via Vite plugin (no extra packages)
- Maintained by TanStack LLC with proven sustainability model

### 3. Production serving: NestJS serves the SPA

Vite builds static files to `dist/`. NestJS `ServeStaticModule` serves them.
Single process, single deployable. Simple for self-host audience.

Dev: Vite dev server on :3000 proxies `/api/v1` → NestJS :3001.
Prod: NestJS serves `dist/` + handles API on single port.

### 4. No `/api/token` endpoint

OIDC access token from oidc-spa IS the Bearer token for NestJS API calls.
NestJS validates against provider JWKS. No token exchange layer needed.

---

## Net Dependency Change

| Category | Removed | Added | Net |
|----------|---------|-------|-----|
| **Bundle size** | ~880 KB+ (Next.js + next-auth + ecosystem) | ~76 KB (oidc-spa + TanStack Router) | **~90% reduction** |
| **Top-level deps** | next, next-auth, @auth/prisma-adapter, next-themes, eslint-config-next, @prisma/client, prisma, better-sqlite3 | oidc-spa, @tanstack/react-router, @tanstack/router-plugin, @tanstack/zod-adapter, vite, @fontsource/inter, @nestjs/serve-static | Cleaner |
| **Server deps** | rxjs, dotenv, jsonwebtoken, class-validator, class-transformer | passport-jwt, jwks-rsa (or oidc-spa/server) | Cleaner |

---

## Roadmap

### Staged vs. oneshot

**Oneshot** (add all deps, rewrite all files, remove Next.js in one pass):
- Faster total elapsed time
- No way to validate intermediate states
- Auth broken → can't test anything
- Full app is the debugging surface

**Staged** (sequential milestones, each validated before next):
- Slower but safer — each stage has a clear validation checkpoint
- Matches project's established evolutive migration pattern
- Auth validated before pages depend on it
- Build toolchain validated before auth depends on it

**Decision: Staged.** Done on a feature branch. The app is broken during
the refactor window but each milestone boundary has crisp validation.

### Milestones

#### M1: Vite + TanStack Router scaffold

- Add `vite.config.ts` with React plugin, TanStack Router plugin, API proxy
- Add `index.html` entry point
- Create TanStack Router root layout (replaces `layout.tsx`)
- Create route stubs for all 9 pages
- Set up `@fontsource/inter` (replaces `next/font/google`)
- Replace `next/image` with standard `<img>` in header/sidebar

**Validation:** `npm run dev` boots Vite on :3000, routes navigate, placeholder
pages render. RxDB not wired yet — just the shell.

#### M2: Auth migration

- Add oidc-spa with Google OIDC provider config
- Create auth context and `withLoginEnforced` / `beforeLoad` guards
- Create login page with oidc-spa sign-in flow
- Update NestJS auth guard to validate OIDC access tokens (JWKS)
- Remove NextAuth (proxy.ts, core/auth/, types/next-auth.d.ts)
- Remove `/api/token` route

**Validation:** Google OAuth login works through oidc-spa, NestJS accepts
the OIDC Bearer token on a test endpoint, protected routes redirect to login.

#### M3: Page migration

- Migrate each page from Next.js App Router to TanStack Router:
  - Replace `"use client"` directive usage per TanStack conventions
  - Replace `useParams()`, `useRouter()`, `usePathname()` with TanStack equivalents
  - Replace `next/link` `<Link>` with TanStack `<Link>`
  - Wire RxDB hooks into each page
  - Implement error boundaries per route
- Migrate `api.ts` → use Vite proxy (same `/api/v1` paths)
- Remove `api-client.ts` (Phase 2 dead code)

**Validation:** All 9 pages at feature parity with current Next.js version.
All mutations work. RxDB subscriptions initialize correctly per route.

#### M4: Production + cleanup

- Add `@nestjs/serve-static`, configure NestJS to serve `web/dist/`
- Update build scripts: `npm run build` → Vite build + NestJS build
- Update `npm run dev` → Vite dev server + NestJS
- Remove Next.js: uninstall packages, delete `next.config.mjs`, remove
  Next.js plugin from tsconfig
- Remove server stale deps: `rxjs`, `dotenv`, `jsonwebtoken`, `class-validator`,
  `class-transformer`
- Remove `class-validator` imports from `items.controller.ts` and
  `lists.controller.ts`
- Run e2e tests, fix any regressions

**Validation:** `npm run build` produces production artifacts, `npm run dev`
works, all e2e tests pass, no Next.js trace in `node_modules` or source.

### Dependencies

```
M1 (scaffold) ──► M2 (auth) ──► M3 (pages) ──► M4 (prod + cleanup)
```

Sequential — each milestone depends on the previous. Within M3, pages
can be migrated in parallel (they're independent once M2 auth is working).

---

## Status

- [x] Audit complete
- [x] Architecture decisions locked (oidc-spa, TanStack Router, NestJS serves SPA)
- [ ] M1: Vite + TanStack Router scaffold
- [ ] M2: Auth migration
- [ ] M3: Page migration
- [ ] M4: Production + cleanup
