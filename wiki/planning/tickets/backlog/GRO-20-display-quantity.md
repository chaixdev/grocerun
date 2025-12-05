# GRO-20: Display Quantity/Unit on List Items

**User Story**: [US-5: Mobile-Friendly List Item Editing](../user-stories/US-5-mobile-quantity-editing.md)
**Priority**: High
**Status**: Backlog

## Context
List items currently only show the item name. Users need to see quantity and unit at a glance.

## Requirements
1. Show quantity and unit badge on each list item (e.g., "2 kg", "500 g")
2. Hide badge when quantity is 1 and unit is empty (default state)
3. Style should be subtle but readable

## Acceptance Criteria
- [ ] Quantity/unit displays next to item name
- [ ] Badge is hidden for "1" with no unit
- [ ] Works for both categorized and uncategorized items

## Technical Notes
- Modify `list-editor.tsx` item rendering
- Already have quantity/unit data in ListItem
