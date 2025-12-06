# GRO-15: Smart List Creation ("My Usuals")

**User Story**: [US-2: Easily Add Common Items](../user-stories/US-2-common-items.md)
**Priority**: High
**Status**: Backlog

## Context
Creating a new list is tedious. Users buy the same items regularly. Let them pre-populate from history.

## Requirements
1. **New Create List Flow**:
   - Show all items previously bought at this store
   - Checkbox + quantity/unit per item
   - "Create List" copies selected items
2. **Filter Options** (see GRO-24):
   - Slider for minimum purchase count
   - Toggle for favorites only

## Acceptance Criteria
- [ ] New list form shows all store items
- [ ] User can select items with checkbox
- [ ] User can set quantity/unit per item
- [ ] "Create List" creates list with selected items
- [ ] User can then edit list normally

## Technical Notes
- New page: `/dashboard/stores/[id]/lists/new`
- Consider pagination for stores with many items
