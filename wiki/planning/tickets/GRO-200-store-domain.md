# GRO-200: Store & Section Domain

**User Story**: [US-200: Store Management](../user-stories/US-200-store-management.md)
**Status**: TODO

## Context
Define the data models for Stores and Sections.

## Requirements
1.  **Prisma Schema**:
    -   `Store`: id, name, householdId (FK).
    -   `Section`: id, name, order (int), storeId (FK).
2.  **RxDB Schema**:
    -   Replicate schemas.
    -   `Section` needs a compound index on `[storeId, order]` for sorting.
3.  **Sync Rules**:
    -   Sync based on `householdId`.

## Acceptance Criteria
- [ ] Models defined in Prisma & RxDB.
- [ ] Sync working for Stores and Sections.
- [ ] Can query sections sorted by `order`.
