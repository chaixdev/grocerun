# GRO-5: List Creation & Organic Catalog

**Phase**: 1 - Rope Bridge
**Status**: Done

## Context
Instead of a dedicated "Item Manager", we will build the **List Creation** flow. Users will add items to a list directly. If an item is new, they assign a section on the fly. This builds the catalog organically.

## Requirements
1.  **Create List**: User can create a new shopping list for a specific Store.
2.  **Add Items**:
    -   User types an item name (e.g., "Milk").
    -   System checks if "Milk" exists in the global/store catalog.
    -   **If New**: User selects a Section (from GRO-4 sections) for this item. System saves "Milk" + Section to the Catalog.
    -   **If Known**: System automatically assigns the known Section.
3.  **View List**: Items are displayed grouped by their assigned Section.

## Acceptance Criteria
- [ ] User can create a list named "Weekly Run" for "Store A".
- [ ] User can type "Apples". System asks for Section. User selects "Produce".
- [ ] "Apples" is added to the list under "Produce".
- [ ] "Apples" is saved to the backend Catalog as belonging to "Produce" in "Store A".
- [ ] User types "Apples" again (in a future list). System auto-assigns "Produce".

## Technical Notes
-   Need `List`, `ListItem`, and `Item` (Catalog) models.
-   `Item` model: `name`, `storeId`, `sectionId`.
-   `ListItem` model: `listId`, `itemId`, `isChecked`.
