# GRO-9: Archived & Immutable Lists

**Phase**: 3 - Refinement
**Status**: Done

## Context
Once a trip is completed, it should be a historical record. Users should not be able to modify it (add items, toggle checks, change quantities).

## Requirements

### 1. Backend Immutability
-   **Validation**: `addItemToList`, `toggleListItem`, and `updateListItem` (if exists) must check `List.status`.
-   **Error**: Throw "List is completed" error if attempting to modify a completed list.

### 2. Frontend Read-Only Mode
-   **ListEditor**:
    -   Check `list.status`.
    -   If `COMPLETED`:
        -   Hide "Add Item" form.
        -   Disable checkboxes (or replace with static icons).
        -   Hide "Finish Shopping" button.
        -   Show a "Trip Completed on [Date]" banner/header.
-   **Dashboard (`store-lists.tsx`)**:
    -   Separate "Active" and "Completed" lists.
    -   **Completed Lists**:
        -   Display in a **collapsible section** (default collapsed).
        -   Order: Most recent first.
        -   Label: "Archived Runs" or similar.

## Technical Changes

### Backend
-   `src/actions/list.ts`: Add check `if (list.status === "COMPLETED") throw ...` to all mutation actions.

### Frontend
-   `src/components/list-editor.tsx`: Add `readOnly` mode.
-   `src/components/store-lists.tsx`: Implement `Collapsible` for completed lists.
