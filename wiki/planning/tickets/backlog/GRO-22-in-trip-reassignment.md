# GRO-22: In-Trip Section Reassignment

**User Story**: [US-4: In-Trip Store Config](../user-stories/US-4-in-trip-config.md)
**Priority**: Low
**Status**: Backlog (Deferred)
**Depends On**: GRO-19

## Context
While shopping, user realizes an item is in the wrong section. They should be able to move it.

## Requirements
1. **Move Item UI**: Context menu or swipe action to move item
2. **Section Picker**: Select new section from dropdown
3. **Persistence**: Update item's section in catalog (not just list)

## Acceptance Criteria
- [ ] User can move item to different section during trip
- [ ] Change persists for future lists
- [ ] Visual feedback on move

## Technical Notes
- Update `Item.sectionId`
- Consider confirmation: "Move X to Y permanently?"
