# GRO-24: List Creation Filter Modes

**User Story**: [US-2: Easily Add Common Items](../user-stories/US-2-common-items.md)
**Status**: Backlog
**Depends On**: GRO-15, GRO-23

## Context
When creating a list, users want to filter items by frequency or favorites.

## Requirements
1. **Filter Toggle**: "By Frequency" / "Favorites Only"
2. **Frequency Mode**: Slider for minimum purchase count
3. **Favorites Mode**: Show only `isFavorite = true` items
4. **Combined View**: Show star icon in both modes

## Acceptance Criteria
- [ ] Toggle between frequency and favorites filter
- [ ] Slider filters by purchase count
- [ ] Favorites filter shows only starred items
- [ ] Star icon visible in all views

## Technical Notes
- Client-side filtering (items already loaded)
- Consider combining with GRO-15 as one ticket if too granular
