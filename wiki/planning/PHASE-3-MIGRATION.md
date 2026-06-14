# Phase 3: Client Fetch Migration Plan

> **Status:** Planning  
> **Branch:** TBD (e.g. `feature/phase-3-client-fetch`)  
> **Created:** March 22, 2026  
> **Estimated effort:** 3–4 working days (~24h)

---

## Scope

- **38 server action functions** → 13 React Query queries + 25 mutations
- **9 async page components** → client-rendered shells with loading states
- **~12 feature components** that call server actions directly → call React Query hooks instead
- **1 root layout** that reads auth server-side → client-side session provider

---

## Task Breakdown

> **Strategy: route-by-route migration.** Each route is migrated end-to-end (page + all
> child components) before moving to the next. The app compiles and is testable after every
> step. This avoids the long unstable window of a layer-by-layer approach, and lets us
> establish the pattern on a medium-complexity route before scaling to simpler/harder ones.

| # | Task | Stable after? | Effort |
|---|------|:---:|--------|
| 1 | Foundation: React Query, client API client, token endpoint, auth provider | Yes | ~3h |
| 2 | `/stores/:id` — store detail page + SectionForm, SectionList, StoreLists | Yes | ~3h |
| 3 | `/stores/:id/settings` — store settings + StoreSettingsForm, StoreDeleteSection | Yes | ~1.5h |
| 4 | `/stores` — store directory + StoreCard | Yes | ~1h |
| 5 | `/households` — households page + HouseholdForm, HouseholdList, CreateFirstHousehold | Yes | ~1.5h |
| 6 | `/settings` — settings page + InvitationManager | Yes | ~2h |
| 7 | `/lists` — dashboard page + HouseholdListGroup | Yes | ~1h |
| 8 | `/lists/:id` — list detail + ListEditor, ItemAutocomplete, EditItemDialog | Yes | ~3h |
| 9 | Auth guard: middleware replaces per-page `auth()` checks | Yes | ~1.5h |
| 10 | Delete dead code: `actions/`, `getAuthJwt`, `jose` dep, `revalidatePath` | Yes | ~1h |
| 11 | Smoke test + fix regressions | Yes | ~3h |

**Total: ~21.5h (~3 working days)**

Hooks (queries + mutations) are created on demand as each route needs them, not up front.
This avoids writing hooks that might need to change once we learn from the first route.

---

## Decision Gates

### Decision 1: How does the browser authenticate API requests?

Currently, server actions sign a JWT with `AUTH_SECRET` using `jose` and pass it as a Bearer
token to NestJS. The browser can't do this (it doesn't have `AUTH_SECRET`).

| Option | How it works | Pros | Cons |
|--------|-------------|------|------|
| **A. Session cookie passthrough** | Browser sends requests to `/api/v1/*`, Next.js rewrite proxies to NestJS. NestJS validates the NextAuth session cookie directly. | No token management on client. Simple. | NestJS needs new auth logic to understand NextAuth cookies. |
| **B. Token endpoint** | Add a `/api/token` Next.js API route that calls `getAuthJwt()` server-side and returns the JWT. Client stores it in memory, passes as Bearer token. | NestJS auth stays unchanged. Clean separation. | Extra round-trip on app load. Token refresh logic needed. |
| **C. Inject token via session** | Use NextAuth's `SessionProvider` + `useSession()` to get the raw access token, sign it client-side. | Available immediately via `useSession()`. | Requires `AUTH_SECRET` in browser — **unacceptable**. |
| **D. Server-side proxy signs JWT** | Change Next.js rewrite to an API route handler that calls `getAuthJwt()` and forwards the request to NestJS with the signed JWT attached. Browser sends unauthenticated requests to `/api/v1/*`. | NestJS auth unchanged. Browser needs zero token logic. | Every request goes through a Next.js API route (slight overhead). Need to write the proxy route. |

**Recommendation:** Option B (token endpoint). One small API route, client fetches the token
once on app load, stores in memory, attaches to all requests. NestJS auth stays exactly as-is.
React Query can handle token refresh on 401.

**Decision:** Option B — Token endpoint. See [ADR 006](../adr/006-phase3-auth-strategy.md).

---

### Decision 2: Optimistic updates — where and how much?

`ListEditor` currently uses React 19's `useOptimistic()` for instant toggle/quantity/remove
feedback. With React Query we have two approaches:

| Option | How it works | Effort |
|--------|-------------|--------|
| **A. Optimistic mutations (match current UX)** | `onMutate` sets cache optimistically, `onError` rolls back. Preserves instant-feel for toggle/quantity/remove. | Higher — cache manipulation logic for each mutation. |
| **B. Simple invalidation first** | Mutations just `invalidateQueries` on success. Slight delay before UI updates. Add optimistic for specific hot paths later. | Lower — much less code. |

**Recommendation:** Option B first, then add optimistic for toggle/quantity only. The only
place where delay is noticeable is checking off items during active shopping. We can add
optimistic updates for those 2–3 mutations specifically after the initial migration.

**Decision:** Option B — Simple invalidation first. Optimistic cache manipulation code is
throwaway (replaced by RxDB local-first in Phase 4), so not worth the effort in a
transitional phase. Add optimistic for toggle/quantity only if delay is annoying in practice.

---

### Decision 3: Loading states — skeletons or spinners?

When pages are client-rendered, the user sees something while data loads.

| Option | Effort | UX |
|--------|--------|-----|
| **A. Simple spinner** | Minimal — one shared `<Loading />` component | Functional but feels bare |
| **B. Content skeletons** | Moderate — skeleton version per page/component | Feels polished, content doesn't jump |
| **C. Spinner now, skeletons later** | Minimal now | Good enough for homelab, iterate later |

**Recommendation:** Option C. One `<PageLoading />` component with a centered spinner.
Skeletons are a polish concern — not worth the effort before the app is even deployed.

**Decision:** Option C — Spinner. One shared `<PageLoading />` component. Skeletons are
unlikely to ever be worth the effort given Phase 4 makes loading near-instant.

---

### Decision 4: Where do components get their data?

Currently, pages fetch data server-side and pass it down as props. With React Query:

| Option | Pattern | Pros | Cons |
|--------|---------|------|------|
| **A. Components fetch their own data** | `<StoreLists storeId={id} />` calls `useLists(storeId)` internally. | Self-contained components. No prop drilling. Easier refactoring. Sets up well for Phase 4 (RxDB). | Multiple components may trigger parallel fetches (React Query deduplicates, so fine in practice). |
| **B. Pages fetch, pass as props** | Page calls `useLists()`, passes `lists` to `<StoreLists />`. | Clear data flow. Easy to see what a page loads. | Pages become fetch orchestrators — the pattern we're trying to get rid of. |

**Recommendation:** Option A. Components own their data. This is the idiomatic React Query
pattern and aligns with Phase 4 where each component queries a local database directly.

**Decision:** Option A — Components fetch their own data. Pages pass IDs, components call
hooks internally. Aligns with Phase 4 (RxDB) and keeps pages as thin routing shells.

---

## Detailed Task Notes

### Task 1: Foundation (~3h)

**Install React Query:**
- `@tanstack/react-query` + `@tanstack/react-query-devtools`
- `QueryClientProvider` in root layout (must be a client component wrapper)

**Token endpoint (ADR 006):**
- `app/api/token/route.ts` — calls `getAuthJwt()`, returns `{ token }` JSON
- ~10 lines

**Client-side API client:**
- New file `core/lib/api.ts` — browser-side `fetch` wrapper
- Calls `/api/v1/*` (hits Next.js rewrite proxy → NestJS)
- Reuses `ApiError` class and Zod validation pattern from current server-side `apiClient`
- Token manager (`core/lib/auth-token.ts`) — in-memory token, 401 retry logic

**Session provider:**
- NextAuth's `SessionProvider` wrapping the app
- Exposes `useSession()` for client components needing user info

**PageLoading component:**
- One shared spinner component for loading states

---

### Task 2: `/stores/:id` — first route migration (~3h)

This is the pattern-setting route. Medium complexity, exercises auth flow + queries + mutations.

**Page:** `stores/[storeId]/page.tsx`
- Currently has inline `getAuthJwt()` + `apiClient` calls, plus `getSections` and `getLists`
- Convert to client-rendered shell, pass `storeId` to child components

**Components to migrate (3):**
- `SectionForm` — 1 mutation (createSection). Low complexity.
- `StoreLists` — 1 mutation (createList). Low complexity.
- `SectionList` — 4 mutations (reorder, delete, update, create) + DnD. Medium complexity.

**Hooks to create:**
- `useSections(storeId)` — query
- `useLists(storeId)` — query (or `useListsForStore`)
- Section mutations: `useCreateSection`, `useUpdateSection`, `useDeleteSection`, `useReorderSections`
- List mutation: `useCreateList`

---

### Task 3: `/stores/:id/settings` (~1.5h)

**Page:** `stores/[storeId]/settings/page.tsx`
- 2 action calls: `getStore()`, `getSections()`

**Components to migrate (3):**
- `StoreSettingsForm` — 1 mutation (updateStore)
- `StoreDeleteSection` — 1 mutation (deleteStore)
- `SectionList` — already migrated in Task 2

**Hooks to create:**
- `useStore(storeId)` — query
- `useUpdateStore`, `useDeleteStore` — mutations

---

### Task 4: `/stores` (~1h)

**Page:** `stores/page.tsx` (store directory)
- 1 action call: `getStoreDirectoryData()`

**Components to migrate (1):**
- `StoreCard` — 1 mutation (createList)

**Hooks to create:**
- `useStoreDirectory()` — query
- `useCreateList` — already created in Task 2

---

### Task 5: `/households` (~1.5h)

**Page:** `households/page.tsx`
- 1 action call: `getHouseholds()`

**Components to migrate (3):**
- `CreateFirstHousehold` — 1 mutation (createDefaultHousehold)
- `HouseholdForm` — 2 mutations (createHousehold, renameHousehold)
- `HouseholdList` — 1 mutation (deleteHousehold)

**Hooks to create:**
- `useHouseholds()` — query
- Household mutations: `useCreateDefaultHousehold`, `useCreateHousehold`,
  `useRenameHousehold`, `useDeleteHousehold`

---

### Task 6: `/settings` (~2h)

**Page:** `settings/page.tsx`
- Has inline `getAuthJwt()` + `apiClient` call, reads session user data

**Components to migrate (1, but high complexity):**
- `InvitationManager` — 8 action calls across invitations + households domains, multi-dialog

**Hooks to create:**
- `useInvitationDetails(code)` — query
- Invitation mutations: `useCreateInvitation`, `useJoinHousehold`, `useRevokeInvitation`
- `useLeaveHousehold` — mutation
- `useUpdateProfile` — mutation

---

### Task 7: `/lists` (~1h)

**Page:** `lists/page.tsx` (dashboard)
- 1 action call: `getDashboardData()`

**Components to migrate (0):**
- `HouseholdListGroup` — display-only, receives data as props from the dashboard query

**Hooks to create:**
- `useDashboard()` — query

---

### Task 8: `/lists/:id` (~3h)

**Page:** `lists/[listId]/page.tsx`
- 1 action call: `getList()`

**Components to migrate (3, highest complexity route):**
- `ListEditor` — 7 mutations (toggle, add, remove, quantity, start/cancel/complete shopping).
  Currently uses `useOptimistic()` — replace with simple invalidation per Decision 2.
- `ItemAutocomplete` — 2 queries (searchItems, getTopItemsForStore). Debounced search.
- `EditItemDialog` — 1 mutation (updateItem)

**Hooks to create:**
- `useList(listId)` — query
- `useSearchItems(query, storeId)` — query with debounce
- `useTopItems(storeId)` — query
- List mutations: `useToggleListItem`, `useAddItemToList`, `useRemoveItemFromList`,
  `useUpdateListItemQuantity`, `useCompleteList`, `useStartShopping`, `useCancelShopping`
- `useUpdateItem` — mutation

---

### Task 9: Auth guard (~1.5h)

Replace per-page `auth()` + `redirect("/login")` with centralized route protection.

**Approach:** Next.js middleware (`middleware.ts`).
- `apps/web/src/proxy.ts` already has a matcher config that looks like it was intended
  to be middleware. Rename it, configure protected routes, done.
- Middleware checks the NextAuth session cookie and redirects unauthenticated users.
- One file, all routes covered.

---

### Task 10: Delete dead code (~1h)

After all routes are migrated:
- Delete all files in `actions/`
- Remove `getAuthJwt()` from `api-client.ts` (or delete the file if fully replaced)
- Remove `jose` from `apps/web` dependencies
- Remove `auth` imports from page components
- Remove unused `revalidatePath` imports
- Clean up any `"use server"` directives

---

### Task 11: Smoke test (~3h)

- Manual walkthrough of all flows: login, dashboard, store CRUD, list CRUD, shopping mode,
  settings, invitations, households
- Fix regressions
- Run existing E2E tests (they test via the UI, so should still pass if behavior is unchanged)

---

## Codebase Inventory Reference

### Server Action Functions (38 total)

| Domain | File | Queries | Mutations | Total |
|--------|------|---------|-----------|-------|
| Sections | `section.ts` | 1 | 4 | 5 |
| Lists | `list.ts` | 3 | 8 | 11 |
| Dashboard | `dashboard.ts` | 1 | 0 | 1 |
| Store Directory | `store-directory.ts` | 1 | 0 | 1 |
| User | `user.ts` | 0 | 1 | 1 |
| Invitations | `invitation.ts` | 1 | 3 | 4 |
| Items | `item.ts` | 2 | 1 | 3 |
| Households | `household.ts` | 1 | 5 | 6 |
| Stores | `store.ts` | 2 | 3 | 5 |
| Test | `test-api.ts` | 1 | 0 | 1 |
| **Total** | | **13** | **25** | **38** |

### Pages (9 data-fetching + 2 static)

| Page | Route | Auth | Data source | Key children |
|------|-------|------|-------------|--------------|
| Root | `/` | — | — | Redirects to `/lists` |
| Login | `/login` | — | — | Static login form |
| Lists | `/lists` | `auth()` | `getDashboardData()` | HouseholdListGroup |
| List detail | `/lists/:id` | `auth()` | `getList()` | ListEditor |
| Stores | `/stores` | `auth()` | `getStoreDirectoryData()` | HouseholdStoreGroup |
| Store detail | `/stores/:id` | `auth()` + `getAuthJwt()` | `apiClient` direct + `getSections` + `getLists` | SectionForm, SectionList, StoreLists |
| Store settings | `/stores/:id/settings` | `auth()` | `getStore()` + `getSections()` | StoreSettingsForm, SectionList, StoreDeleteSection |
| Settings | `/settings` | `auth()` + `getAuthJwt()` | `apiClient` direct | SettingsForm (→ InvitationManager) |
| Households | `/households` | None | `getHouseholds()` | HouseholdForm, HouseholdList |

### Feature Components That Call Server Actions Directly

| Component | Domain | Action calls | Complexity |
|-----------|--------|-------------|------------|
| ListEditor | Lists | 7 (toggle, add, remove, quantity, start/cancel/complete) | High — optimistic UI |
| InvitationManager | Invitations + Households | 8 | High — multi-dialog |
| SectionList | Sections | 4 (reorder, delete, update, create) | Medium — DnD |
| ItemAutocomplete | Items | 2 (search, topItems) | Medium — debounced |
| SectionForm | Sections | 1 (create) | Low |
| StoreLists | Lists | 1 (create) | Low |
| StoreCard | Lists | 1 (create) | Low |
| StoreForm | Stores | 1 (create) | Low |
| StoreList | Stores | 1 (delete) | Low |
| StoreSettingsForm | Stores | 1 (update) | Low |
| StoreDeleteSection | Stores | 1 (delete) | Low |
| CreateFirstHousehold | Households | 1 (createDefault) | Low |
| HouseholdForm | Households | 2 (create, rename) | Low |
| HouseholdList | Households | 1 (delete) | Low |
| EditItemDialog | Items | 1 (update) | Low |

---

## Open Questions

- Whether to keep the old `apps/web/Dockerfile` or remove it (it's now superseded by root Dockerfile)
- E2E tests may need minor updates if loading states change visible DOM timing
