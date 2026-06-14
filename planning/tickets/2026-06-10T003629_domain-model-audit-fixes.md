# Domain Model Audit — Fix Plan

> Source: Oracle audit (June 2026)
> Phase 5 cleanup items grouped by dependency and risk

---

## Group A: Unique Constraint + Soft-Delete Fix 🔴

| ID | Item | Impact |
|----|------|--------|
| A1 | `ListItem.@@unique([listId, itemId])` ignores `deleted` | P2002 catch blocks in `pushListItems` are a workaround for this |
| A2 | `Item.@@unique([storeId, name])` ignores `deleted` | P2002 catch blocks in `pushItems` are a workaround for this |

**Fix:** Add `deleted` to both unique tuples, or use partial unique index (`WHERE deleted = 0`).

**After fix:** Remove P2002 catch blocks in `item-sync.ts` and `list-item-sync.ts`.

---

## Group B: Data Model Completeness 🟠

| ID | Item | Impact |
|----|------|--------|
| B1 | RxDB `ItemDocType` missing `lastPurchased` | Client can't show "last purchased X days ago" |
| B2 | RxDB `ListDocType.status` is untyped `string` | Client could write invalid status offline; push then fails |
| B3 | `ListItem.createdAt` push relies on Prisma `@default(now())` | Converges after round-trip, but document as intentional server-authoritative design |

**Fix B1:** Add `lastPurchased?: string` to `ItemDocType` in `schema.ts`, add to `itemToSyncDoc()` in `item-sync.ts`.

**Fix B2:** Add enum constraint (`"PLANNING" | "SHOPPING" | "COMPLETED"`) to RxDB JSON schema for `ListDocType.status`.

**Fix B3:** Add comment in `list-item-sync.ts` push handler documenting the server-authoritative `createdAt` behavior.

---

## Group C: DTO & Naming Cleanup 🟡

| ID | Item | Impact |
|----|------|--------|
| C1 | `ToggleItemSchema` uses `itemId` but operates on `ListItem` | Confusing — `ListItem` is a different model from `Item`. Rename to `listItemId`. |
| C2 | `UpdateQuantitySchema` and `RemoveItemSchema` already use `listItemId` | C1 brings consistency |
| C3 | Default list name duplicated in Prisma `@default("Shopping List")` and JS service | Remove JS fallback |
| C4 | `getInvitationDetails` doesn't lazy-expire invitations | `joinHousehold` updates expired ones; GET doesn't. Inconsistent. |

---

## Group D: Duplicated Code Extraction 🟠

| ID | Item | Impact |
|----|------|--------|
| D1 | Duplicated cascade soft-delete (HouseholdsService + StoresService) | 100+ lines each, child-first order, fragile to new model additions |
| D2 | Access control duplicated across 5+ services | Same `findFirst → check membership → throw` pattern in Items, Stores, Lists, Sections, Sync |
| D3 | Duplicated `notifyHouseholdMembers` pattern in 5 services | Stable and simple; low priority to extract |

**Note:** D1–D3 are refactors with moderate blast radius. Extract D1 (cascade) and D2 (access guard) as separate PRs after Group A/B/C are landed and tested.

---

## Group E: Schema Hardening 🟠🟡🟢

| ID | Item | Priority |
|----|------|----------|
| E1 | Nullable `ownerId` — backfill and make non-nullable | 🟠 Security footgun; any member can rename/claim/delete null-owner households |
| E2 | Missing standalone FK indexes on `storeId`, `listId` | 🟡 Sqlite may create implicit ones; explicit indexes are safer and self-documenting |
| E3 | `Invitation` has no `deleted` field (uses status lifecycle) | 🟡 Document the exception; arguably correct |
| E4 | `addItemToList` silently updates `Item.defaultUnit` | 🟢 Hidden auto-learning side-effect; add comment |

---

## Implementation Order

```
Group A  →  Group B  →  Group C  →  rebase  →  Group D  →  Group E
  ↓            ↓           ↓                    (separate PRs)
 remove       data       naming
 P2002        gaps       cleanup
 blocks
```

**First slice (Groups A+B+C):** Fixes root causes, fills data gaps, cleans up naming. No architecture changes. Safe to ship together.
