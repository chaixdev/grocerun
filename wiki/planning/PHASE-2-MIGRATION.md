# Phase 2 Migration Checklist

**Migration Approach:** Inverted feature flags - start with all flags `true` (Prisma), migrate to `false` (API), then remove flags entirely.

**Progress Tracking:** Update `apps/web/src/core/config/migration.ts` as domains are migrated.

---

## Overall Progress: 1/37 actions migrated 🟡

**Latest:** Users domain ready for testing (1 action)

---

## Items Domain [0/3] 🔴

**File:** `apps/web/src/actions/item.ts`  
**Flag:** `migration.items`

- [ ] `updateItem()` - PATCH /items/:id
- [ ] `searchItems()` - GET /items/search?storeId=X&query=Y
- [ ] `getTopItemsForStore()` - GET /items/top?storeId=X&limit=5&threshold=1

---

## Stores Domain [0/5] 🔴

**File:** `apps/web/src/actions/store.ts`  
**Flag:** `migration.stores`

- [ ] `getStores()` - GET /stores?householdId=X
- [ ] `getStore()` - GET /stores/:id
- [ ] `createStore()` - POST /stores
- [ ] `updateStore()` - PATCH /stores/:id
- [ ] `deleteStore()` - DELETE /stores/:id

**Note:** `createDefaultHousehold()` is in this file but belongs to Households domain.

---

## Sections Domain [0/5] 🔴

**File:** `apps/web/src/actions/section.ts`  
**Flag:** `migration.sections`

- [ ] `getSections()` - GET /sections?storeId=X
- [ ] `createSection()` - POST /sections
- [ ] `updateSection()` - PATCH /sections/:id
- [ ] `deleteSection()` - DELETE /sections/:id
- [ ] `reorderSections()` - PATCH /sections/reorder

---

## Lists Domain [0/11] 🔴

**File:** `apps/web/src/actions/list.ts`  
**Flag:** `migration.lists`

- [ ] `getLists()` - GET /lists?storeId=X
- [ ] `getList()` - GET /lists/:id
- [ ] `getActiveListForStore()` - GET /lists/active?storeId=X
- [ ] `createList()` - POST /lists
- [ ] `addItemToList()` - POST /lists/:id/items
- [ ] `toggleListItem()` - PATCH /lists/:listId/items/:itemId/toggle
- [ ] `updateListItemQuantity()` - PATCH /lists/:listId/items/:itemId/quantity
- [ ] `removeItemFromList()` - DELETE /lists/:listId/items/:itemId
- [ ] `startShopping()` - PATCH /lists/:id/status (to SHOPPING)
- [ ] `cancelShopping()` - PATCH /lists/:id/status (to PLANNING)
- [ ] `completeList()` - PATCH /lists/:id/complete

---

## Households Domain [0/6] 🔴

**File:** `apps/web/src/actions/household.ts` + `store.ts::createDefaultHousehold()`  
**Flag:** `migration.households`

- [ ] `getHouseholds()` - GET /households
- [ ] `createHousehold()` - POST /households
- [ ] `createDefaultHousehold()` - POST /households/default
- [ ] `renameHousehold()` - PATCH /households/:id
- [ ] `leaveHousehold()` - DELETE /households/:id/members/me
- [ ] `deleteHousehold()` - DELETE /households/:id

---

## Users Domain [1/1] 🟢

**File:** `apps/web/src/actions/user.ts`  
**Flag:** `migration.users`

- [x] `updateProfile()` - PATCH /users/me

**Status:** Ready for testing (flag still `true`, will flip after validation)

---

## Invitations Domain [0/4] 🔴

**File:** `apps/web/src/actions/invitation.ts`  
**Flag:** `migration.invitations`

- [ ] `createInvitation()` - POST /invitations
- [ ] `joinHousehold()` - POST /invitations/:token/join
- [ ] `revokeInvitation()` - DELETE /invitations/:id
- [ ] `getInvitationDetails()` - GET /invitations/:token

---

## Dashboard/Directory [0/2] 🔴

**Files:** `apps/web/src/actions/dashboard.ts`, `store-directory.ts`  
**Flag:** `migration.dashboard`

- [ ] `getDashboardData()` - GET /dashboard
- [ ] `getStoreDirectoryData()` - GET /store-directory

**Note:** These are read-only complex queries. May need custom API design.

---

## Migration Strategy Per Domain

### 1. Build NestJS Endpoints
- Create controller in `apps/server/src/`
- Create service with Prisma logic
- Add validation DTOs
- Test with Postman/curl

### 2. Wire Up Server Actions
- Import `usePrisma` from migration config
- Add conditional logic:
  ```typescript
  export async function getItems() {
    if (usePrisma.items) {
      return prisma.item.findMany() // OLD
    }
    return apiClient.get('/items') // NEW
  }
  ```

### 3. Test with Flag OFF → ON
- Flag ON (Prisma): Verify old path still works
- Flag OFF (API): Test new API path
- Compare results for consistency

### 4. Lock It In
- Once confident, remove flag check and Prisma code
- Update migration.ts (set flag to `false` or remove key)
- Commit and move to next domain

---

## Completion Criteria

- [ ] All 37 server actions migrated
- [ ] All flags removed from `migration.ts`
- [ ] UI functionality unchanged
- [ ] Database consolidated to `apps/server/dev.db`
- [ ] PROJECT-STATUS.md updated to Phase 3

---

**Last Updated:** January 9, 2026  
**Next Domain:** Items (simplest, good starting point)
