# GRO-6: In-Store Execution & Catalog Confirmation

**Phase**: 1 - Rope Bridge
**Priority**: Critical
**Status**: Done

## Context
The user has created a list (GRO-5). Now they are at the store. They need to check off items as they pick them up.
**Crucial:** This is the moment an item is "confirmed". Only when an item is checked off should it be considered part of the store's "History/Catalog" for future quick-adds.

## Requirements
1.  **Check-off UI**:
    -   Simple, mobile-first, tap-friendly interface.
    -   Tapping an item toggles its `isChecked` status.
    -   **Behavior**: Checked items dim but stay in place.
    -   **Auto-Scroll**: Upon checking an item, the screen smoothly scrolls to center the *next* unchecked item.
    -   **Highlight**: The next unchecked item is visually highlighted.
2.  **Check-off Logic**:
    -   **Action**: When an item is checked off:
        -   Update `ListItem.isChecked = true`.
        -   *Note:* No catalog updates yet. We wait for "Trip Completion" (GRO-7) to confirm purchases. This allows users to correct mistakes (check/uncheck) without messing up stats.

## Acceptance Criteria
- [ ] **Schema**: `Item` model has `purchaseCount` and `lastPurchased`.
- [ ] **UI**: User can check/uncheck items. Checked items look "done".
- [ ] **Logic**: Checking an item increments its `purchaseCount` in the DB.
- [ ] **Logic**: Unchecking decrements (optional but good for accuracy).
- [ ] **Persistence**: State survives refresh.

## Technical Notes
-   Modify `toggleListItem` action.
-   Optimistic UI is critical here for "snappy" feel.
