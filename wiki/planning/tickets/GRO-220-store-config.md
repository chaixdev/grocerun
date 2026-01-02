# GRO-220: Store Configuration UI

**User Story**: [US-200: Store Management](../user-stories/US-200-store-management.md)
**Status**: TODO

## Context
Detail view to manage the layout of a specific store.

## Requirements
1.  **Section List**:
    -   Display sections in order.
    -   Editable names.
2.  **Reordering**:
    -   Drag and drop (or up/down arrows) to change section order.
    -   Update `order` field in DB.
3.  **Add/Delete**:
    -   Add new section.
    -   Delete section (handle orphan items warning?).

## Acceptance Criteria
- [ ] User can rename sections.
- [ ] User can reorder sections.
- [ ] Changes sync to other devices.
