# Domain Model Audit

> **Source:** Oracle audit
> **Date:** June 10, 2026
> **Scope:** Prisma schema, DTOs, RxDB schemas, sync handlers, service-layer patterns

---

## 🔴 CRITICAL

### 1. Soft-delete clashes with unique constraints

`ListItem.@@unique([listId, itemId])` and `Item.@@unique([storeId, name])` don't account for the `deleted` column. A soft-deleted row permanently blocks re-creation with the same logical identity. Every mutation path works around this with upsert or P2002 catch blocks — fragile and leaky.

**Fix:** Add `deleted` to the unique tuple or use a partial unique index (`WHERE deleted = 0`).

---

## 🟠 HIGH

### 2. Duplicated cascade soft-delete

`HouseholdsService.deleteHousehold()` and `StoresService.deleteStore()` have near-identical multi-level cascade soft-delete transactions (100+ lines each). Adding a new model in the hierarchy means updating both in the correct child-first order.

**Fix:** Extract into a shared `CascadeSoftDelete` utility.

### 3. Access control duplicated across 5+ services

The same `verifyStoreAccess` / `verifyHouseholdAccess` pattern (`findFirst` → check membership → throw) is copy-pasted into `ItemsService`, `StoresService`, `ListsService`, `SectionsService`, and `SyncService`.

**Fix:** Extract into a NestJS guard or shared auth service.

### 4. Nullable `ownerId` creates "legacy household" branches

Every owner-gated operation checks `if (household.ownerId && ...)` — a null `ownerId` means any member can rename/claim/delete. This was intentional for backwards compat but it's a security footgun.

**Fix:** Backfill `ownerId` for all existing households, make it non-nullable.

### 5. RxDB `Item` missing `lastPurchased`

Prisma `Item` has `lastPurchased DateTime?` (set on list completion), but the RxDB `ItemDocType` omits it, and `item-sync.ts`'s `itemToSyncDoc()` doesn't transmit it. The client can't show "last purchased X days ago."

**Fix:** Add `lastPurchased?: string` to `ItemDocType` in RxDB schema, add to `itemToSyncDoc()`.

### 6. RxDB `ListItem.createdAt` not transmitted on push

The RxDB schema requires `createdAt` but the push handler never reads it from `newDocumentState` — it relies entirely on Prisma's `@default(now())`. After a round-trip the client converges, but this should be documented as an intentional server-authoritative design.

**Fix:** Add comment documenting intentional server-authoritative `createdAt` behavior.

---

## 🟡 MEDIUM

### 7. Default list name set at two layers

Both the Prisma schema (`@default("Shopping List")`) and `createList` service method (`dto.name || 'Shopping List'`) duplicate the default.

**Fix:** Remove the JS fallback.

### 8. Inconsistent DTO naming

`ToggleItemSchema` uses `itemId` to refer to a `ListItem` id, while `UpdateQuantitySchema` and `RemoveItemSchema` use `listItemId`. Confusing since `Item` is a different model.

**Fix:** Rename `itemId` → `listItemId` in `ToggleItemSchema`.

### 9. RxDB `ListDocType.status` is untyped string

`ListDocType.status` is `string` instead of an enum. A client could write `"ARCHIVED"` offline, pass JSON schema validation, then fail on push.

**Fix:** Add an enum constraint (`"PLANNING" | "SHOPPING" | "COMPLETED"`) to the RxDB JSON schema.

### 10. `getInvitationDetails` doesn't lazy-expire

`joinHousehold` updates expired invitations to `EXPIRED` before rejecting; `getInvitationDetails` just throws without updating. Minor but inconsistent.

**Fix:** Add lazy-expire logic to `getInvitationDetails`.

### 11. Missing standalone FK indexes

`Item`, `Section`, `List`, and `ListItem` lack dedicated indexes on their most-queried foreign keys (`storeId`, `listId`). Sqlite may create implicit ones, but explicit indexes are safer and self-documenting.

**Fix:** Add `@@index` declarations on `storeId` and `listId` where queried frequently.

### 12. `Invitation` has no `deleted` field

Unlike every other domain model, `Invitation` uses `InvitationStatus` as its lifecycle. Arguably correct, but inconsistent with the codebase convention.

**Fix:** Document the exception.

---

## 🟢 LOW

### 13. Duplicated `notifyHouseholdMembers` pattern in 5 services

Stable and simple, low-priority to extract.

### 14. Hidden `defaultUnit` side-effect in `addItemToList`

Silently updates the `Item.defaultUnit` when a different unit is passed. Intentional auto-learning, but a hidden side-effect worth commenting.

**Fix:** Add comment documenting the auto-learning behavior.
