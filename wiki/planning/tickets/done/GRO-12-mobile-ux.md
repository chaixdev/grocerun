# GRO-12: Mobile UX Polish

## Problem
Current "Card" lists (`StoreList`, `HouseholdList`) have small touch targets for actions (Edit/Delete) and don't fully utilize the card area for navigation.

## Goals
-   **Tappable Cards**: Make the entire card a link where applicable (e.g., Stores).
-   **Action Menus**: Move secondary actions (Edit, Delete) to a "More" (...) dropdown menu to reduce visual clutter and prevent accidental clicks.
-   **Touch Targets**: Ensure all interactive elements are at least 44x44px.

## Scope
-   `src/components/store-list.tsx`
-   `src/components/household-list.tsx`

## Proposed UX
-   **Store Card**:
    -   Tap anywhere -> Go to Store Dashboard.
    -   Top-right "..." icon -> Dropdown with "Delete Store".
-   **Household Card**:
    -   (If no detail view exists) Card remains static or opens Edit dialog.
    -   Top-right "..." icon -> Dropdown with "Edit Household", "Delete Household".
