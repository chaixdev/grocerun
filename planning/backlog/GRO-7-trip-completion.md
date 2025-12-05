# GRO-7: Trip Completion

**Phase**: 1 - Rope Bridge
**Priority**: High
**Status**: Backlog

## Context
The user has finished shopping. They need to "Complete" the run to archive the list and keep the dashboard clean.

## Requirements
1.  **Complete List Action**:
    -   A "Finish Shopping" or "Complete List" button.
    -   **Catalog Confirmation**:
        -   For every `ListItem` where `isChecked == true`:
            -   Increment `Item.purchaseCount`.
            -   Update `Item.lastPurchased = now()`.
    -   Updates `List.status` from `PLANNING` to `COMPLETED`.
2.  **Dashboard Cleanup**:
    -   Completed lists should move to a "History" tab or be hidden from the main "Active Lists" view.
3.  **Post-Trip Summary (Optional for MVP)**:
    -   Show a summary of what was bought vs. planned.

## Acceptance Criteria
- [ ] User can mark a list as "Completed".
- [ ] Completed lists do not appear in the main "Active" view (or are visually distinct).
- [ ] User can view details of a completed list (read-only).

## Technical Notes
-   New action `completeList(listId)`.
-   Update `getLists` to filter by status (or sort Active first).
