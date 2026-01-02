# GRO-410: Trip Completion

**User Story**: [US-400: Shopping Execution](../user-stories/US-400-shopping-execution.md)
**Status**: TODO

## Context
Finishing the trip.

## Requirements
1.  **Finish Button**:
    -   Prominent button to "Complete Trip".
2.  **Logic**:
    -   Update `ShoppingList.status` to `COMPLETED`.
    -   Update `CatalogItem` usage stats (increment count, update last purchased date).
    -   Redirect to Dashboard.

## Acceptance Criteria
- [ ] User can complete a trip.
- [ ] List moves to Archive.
- [ ] Catalog stats are updated.
