# GRO-300: Catalog & List Domain

**User Story**: [US-300: List Planning](../user-stories/US-300-list-planning.md)
**Status**: TODO

## Context
The most complex part of the domain. We distinguish between "Catalog Items" (Knowledge) and "List Items" (Transaction).

## Requirements
1.  **Prisma/RxDB Schema**:
    -   `CatalogItem`: id, name, category/sectionId, defaultUnit, householdId.
    -   `ShoppingList`: id, storeId, status (PLANNING, SHOPPING, COMPLETED), date.
    -   `ListItem`: id, listId, catalogItemId, quantity, unit, isChecked.
2.  **Relationships**:
    -   `ListItem` -> `CatalogItem` (for name/defaults).
    -   `ShoppingList` -> `Store`.

## Acceptance Criteria
- [ ] All 3 models defined and syncing.
- [ ] Relationships established.
