# GRO-23: Favorite Items (Schema + Toggle UI)

**User Story**: [US-2: Easily Add Common Items](../user-stories/US-2-common-items.md)
**Priority**: Medium
**Status**: Backlog

## Context
Some items are "always on the list" (milk, eggs, bread). Users should be able to mark them as favorites.

## Requirements
1. **Schema**: Add `isFavorite: Boolean @default(false)` to `Item`
2. **Toggle UI**: Star/heart icon to toggle favorite status
3. **Backend**: `toggleFavorite(itemId)` action

## Acceptance Criteria
- [ ] User can mark item as favorite
- [ ] Favorite status persists
- [ ] Visual indicator (star icon) shows favorite status
- [ ] Works in list view and autocomplete

## Technical Notes
- Prisma migration needed
- Add star icon next to item name
