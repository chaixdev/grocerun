# GRO-6: In-Store Execution & Catalog Confirmation

**Phase**: 1 - Rope Bridge
**Priority**: Critical
**Status**: Backlog

## Context
The user has created a list (GRO-5). Now they are at the store. They need to check off items as they pick them up.
**Crucial:** This is the moment an item is "confirmed". Only when an item is checked off should it be considered part of the store's "History/Catalog" for future quick-adds.

## Requirements
1.  **Check-off UI**:
    -   Simple, mobile-first, tap-friendly interface.
    -   Tapping an item toggles its `isChecked` status.
    -   Checked items should move to the bottom of their section or dim (Visual feedback).
2.  **Check-off Logic**:
    -   **Action**: When an item is checked off:
        -   Update `ListItem.isChecked = true`.

## Acceptance Criteria
- [ ] **UI**: User can check/uncheck items. Checked items look "done".
- [ ] **Persistence**: State survives refresh.

## Technical Notes
-   Modify `toggleListItem` action.
-   Optimistic UI is critical here for "snappy" feel.
