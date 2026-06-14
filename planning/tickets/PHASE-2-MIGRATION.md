# Phase 2 Migration Checklist

**Migration Approach:** Direct replacement — no feature flags. Each action file's Prisma calls were replaced with `apiClient` calls to the NestJS backend, domain by domain.

**Status: COMPLETE ✅**

---

## Overall Progress: All actions migrated ✅

Prisma has been fully removed from `apps/web/src/actions/` and the pages layer. The only remaining Prisma usage in `apps/web` is in the auth infrastructure (`auth.ts`, `helpers.ts`, `store-access.ts`) which uses `PrismaAdapter` for NextAuth sessions — this is intentional and must stay.

---

## Items Domain ✅

**File:** `apps/web/src/actions/item.ts`

- [x] `updateItem()` - PATCH /items/:id
- [x] `searchItems()` - GET /items/search?storeId=X&query=Y
- [x] `getTopItemsForStore()` - GET /items/top?storeId=X&limit=5&threshold=1

---

## Stores Domain ✅

**File:** `apps/web/src/actions/store.ts`

- [x] `getStores()` - GET /stores?householdId=X
- [x] `getStore()` - GET /stores/:id
- [x] `createStore()` - POST /stores
- [x] `updateStore()` - PATCH /stores/:id
- [x] `deleteStore()` - DELETE /stores/:id

---

## Sections Domain ✅

**File:** `apps/web/src/actions/section.ts`

- [x] `getSections()` - GET /sections?storeId=X
- [x] `createSection()` - POST /sections
- [x] `updateSection()` - PATCH /sections/:id
- [x] `deleteSection()` - DELETE /sections/:id
- [x] `reorderSections()` - PATCH /sections/reorder

**Note:** `updateSection` and `deleteSection` require `storeId` for `revalidatePath`. Since the shared DTO must not gain web-only fields (NestJS derives its DTOs from the same Zod schemas), local extended schemas (`UpdateSectionActionSchema`, `DeleteSectionActionSchema`) are defined in the action file itself using `.extend()`.

---

## Lists Domain ✅

**File:** `apps/web/src/actions/list.ts`

- [x] `getLists()` - GET /lists?storeId=X
- [x] `getList()` - GET /lists/:id
- [x] `getActiveListForStore()` - GET /lists/active?storeId=X
- [x] `createList()` - POST /lists
- [x] `addItemToList()` - POST /lists/:id/items
- [x] `toggleListItem()` - PATCH /lists/:listId/items/:itemId/toggle
- [x] `updateListItemQuantity()` - PATCH /lists/:listId/items/:itemId/quantity
- [x] `removeItemFromList()` - DELETE /lists/:listId/items/:itemId
- [x] `startShopping()` - PATCH /lists/:id/status (to SHOPPING)
- [x] `cancelShopping()` - PATCH /lists/:id/status (to PLANNING)
- [x] `completeList()` - PATCH /lists/:id/complete

---

## Households Domain ✅

**File:** `apps/web/src/actions/household.ts`

- [x] `getHouseholds()` - GET /households
- [x] `createHousehold()` - POST /households
- [x] `createDefaultHousehold()` - POST /households (with default name)
- [x] `renameHousehold()` - PATCH /households/:id
- [x] `leaveHousehold()` - POST /households/:id/leave
- [x] `deleteHousehold()` - DELETE /households/:id

---

## Users Domain ✅

**File:** `apps/web/src/actions/user.ts`

- [x] `updateProfile()` - PATCH /users/me

---

## Invitations Domain ✅

**File:** `apps/web/src/actions/invitation.ts`

- [x] `createInvitation()` - POST /invitations
- [x] `joinHousehold()` - POST /invitations/:token/join
- [x] `revokeInvitation()` - DELETE /invitations/:id
- [x] `getInvitationDetails()` - GET /invitations/:token

---

## Dashboard/Directory ✅

**Files:** `apps/web/src/actions/dashboard.ts`, `apps/web/src/actions/store-directory.ts`

- [x] `getDashboardData()` - GET /household-overview
- [x] `getStoreDirectoryData()` - GET /household-overview (same endpoint, mapped differently)

---

## Pages Layer ✅

Direct Prisma calls in page components were also removed:

- [x] `apps/web/src/app/settings/page.tsx` — user data from `session.user`, households from GET /households
- [x] `apps/web/src/app/stores/[storeId]/page.tsx` — store data from GET /stores/:id

---

## Completion Criteria

- [x] All server actions migrated (no direct Prisma in `actions/`)
- [x] All page components migrated (no direct Prisma in `app/`)
- [x] TypeScript typecheck passes (`npx tsc --noEmit`)
- [x] E2E test suite passes (129 passing, 36 skipped — same as baseline)
- [ ] Remove Prisma client dependencies from `apps/web/package.json` (Phase 3 prerequisite — blocked by NextAuth PrismaAdapter which must stay until auth is reconsidered)

---

**Last Updated:** March 18, 2026  
**Phase 2 completed on:** `feature/evolutive-architecture`  
**Next phase:** Phase 3 — React Query / client-side data fetching
