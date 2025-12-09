# GRO-57: Add Database Indexes for Query Performance

**Phase:** 1 (Foundation)  
**Priority:** Medium  
**Audit Item:** #16  
**Depends On:** GRO-56 (batch schema changes)  
**Blocks:** Phase 2 (schema should be stable before refactor)

---

## Problem

Several frequently filtered/sorted fields lack database indexes:
- `List.status` — filtered in list views
- `ListItem.isChecked` — filtered for checked/unchecked items
- `Item.purchaseCount` — sorted for suggestions

As data grows, queries on these fields will degrade performance.

---

## Solution

Add `@@index` directives to the Prisma schema for frequently queried fields.

---

## Implementation Steps

### 1. Update Prisma Schema

Add indexes to relevant models in `prisma/schema.prisma`:

```prisma
model List {
  id        String     @id @default(cuid())
  status    ListStatus @default(PLANNING)
  // ... other fields
  
  @@index([status])
  @@index([storeId, status])  // Composite for store list views
}

model ListItem {
  id        String  @id @default(cuid())
  isChecked Boolean @default(false)
  // ... other fields
  
  @@index([isChecked])
  @@index([listId, isChecked])  // Composite for list filtering
}

model Item {
  id            String @id @default(cuid())
  purchaseCount Int    @default(0)
  // ... other fields
  
  @@index([purchaseCount])
  @@index([storeId, purchaseCount])  // Composite for store suggestions
}
```

### 2. Generate Migration

```bash
npx prisma migrate dev --name add_query_indexes
```

### 3. Verify Migration

Check the generated SQL includes `CREATE INDEX` statements.

---

## Acceptance Criteria

- [ ] `List` has index on `status`
- [ ] `ListItem` has index on `isChecked`
- [ ] `Item` has index on `purchaseCount`
- [ ] Composite indexes added for common query patterns
- [ ] Migration applied successfully
- [ ] `npm run build` passes

---

## Notes

- SQLite handles indexes well; these are future-proofing for scale
- Composite indexes chosen based on common query patterns in actions
- Can verify index usage with `EXPLAIN QUERY PLAN` if needed
