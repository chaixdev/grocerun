# GRO-56: Add Cascade Delete for Item→Section Relation

**Phase:** 1 (Foundation)  
**Priority:** Medium  
**Audit Item:** #15  
**Depends On:** None  
**Blocks:** Phase 2 (schema should be stable before refactor)

---

## Problem

In `prisma/schema.prisma`, the `Item.sectionId` relation to `Section` lacks `onDelete` handling:
- If a section is deleted, items pointing to it may cause constraint errors
- Items could become orphaned with invalid `sectionId` references

---

## Solution

Add `onDelete: SetNull` to the Section relation on the Item model, so items gracefully lose their section assignment when a section is deleted.

---

## Implementation Steps

### 1. Update Prisma Schema

In `prisma/schema.prisma`, locate the Item model and update the section relation:

```prisma
model Item {
  id            String    @id @default(cuid())
  name          String
  sectionId     String?
  section       Section?  @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  // ... rest of fields
}
```

### 2. Generate Migration

```bash
npx prisma migrate dev --name add_section_cascade_delete
```

### 3. Verify Migration SQL

Check the generated migration file contains:
```sql
-- Modify foreign key constraint to add ON DELETE SET NULL
```

### 4. Test the Behavior

1. Create a section
2. Create items assigned to that section
3. Delete the section
4. Verify items still exist with `sectionId: null`

---

## Acceptance Criteria

- [ ] `Item.section` relation has `onDelete: SetNull`
- [ ] Migration applied successfully
- [ ] Deleting a section sets `sectionId` to null on related items
- [ ] No constraint violation errors on section deletion
- [ ] `npm run build` passes

---

## Notes

- This is a non-breaking change for existing data
- Items without sections are already supported in the UI
