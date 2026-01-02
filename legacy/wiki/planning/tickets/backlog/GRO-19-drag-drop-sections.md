# GRO-19: Drag-and-Drop Section Reordering

**User Story**: [US-4: In-Trip Store Config](../user-stories/US-4-in-trip-config.md)
**Status**: Deprecated (Superseded by GRO-45)

## Context
Store sections have an `order` field but no UI to reorder them.

## Requirements
1. **Drag-and-Drop UI**: Reorder sections in store config
2. **Persistence**: Save new order to database
3. **Feedback**: Visual feedback during drag

## Acceptance Criteria
- [ ] User can drag sections to reorder
- [ ] Order persists after refresh
- [ ] Works on mobile (touch)

## Technical Notes
- Use `@dnd-kit` (already installed)
- Update section order via server action
