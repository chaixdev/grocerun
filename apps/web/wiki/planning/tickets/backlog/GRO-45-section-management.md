# GRO-45: Section Management UI

**Story**: "US-8: Store Catalog & Configuration"
**Status**: Todo

## Context
Store layout is critical for efficient shopping. Users need to define sections (Produce, Dairy, Aisle 1) and their order.

## Requirements
1.  **UI Component**: Embedded within the Store Config screen.
2.  **List**: Show current sections in order.
3.  **Actions**:
    -   Add Section (Input + Add button)
    -   Remove Section (X icon)
    -   Reorder Sections (Drag and Drop)
4.  **Persistence**: Save order to `StoreSection` model.

## Acceptance Criteria
- [ ] User can add a new section
- [ ] User can delete an empty section
- [ ] User can reorder sections via drag-and-drop
- [ ] Order is persisted and affects item sorting in lists
