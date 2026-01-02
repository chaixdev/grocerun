# GRO-11: Item Editing & Management

## Problem
Users cannot correct mistakes after adding an item. If an item is assigned to the wrong section, or if the store layout changes, the user is stuck with the incorrect categorization.

## Goals
-   Allow users to edit an item's **Section**.
-   Allow users to edit an item's **Name**.
-   Allow users to edit an item's **Default Unit**.

## Proposed UX
-   **Trigger**: Add a "More" menu (three dots) or a "Long Press" action on the list item.
    -   *Decision*: "More" menu is more discoverable and accessible.
-   **UI**: Open a dialog similar to the "New Item" dialog, pre-filled with current values.
-   **Scope**: This updates the *global* item definition for that store, not just the current list instance (since sections are store-specific item properties).

## Technical Requirements
### Backend
-   `updateItem(itemId, data)` action.
-   Validation: Ensure name uniqueness within the store (if changing name).

### Frontend
-   Update `ListEditor` to include a `DropdownMenu` on list items.
-   "Edit" option opens a `Dialog`.
-   Optimistic updates for immediate feedback.
