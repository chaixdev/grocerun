# US-2: Easily Add Common Items

> *"As a user, I want to easily add common items from previous grocery runs."*

## Status
🔲 **PLANNED**

## Goal
Speed up list creation by pre-populating with frequently purchased items ("My Usuals"). This is the "Create List" flow triggered from the Store Card.

## Acceptance Criteria
- When creating a new list, a form shows all items bought from this store
- Items can be filtered in several ways:
  - By minimum purchase count (dynamic slider)
  - By "favorite" status (user-marked favorites)
  - Toggle between frequency-based and favorites-only filter modes
- Each item shows checkbox + quantity/unit controls
- "Create List" action copies selected items to the new list

## Implementation Notes

**Data Model:**
- Track purchase count per item per store
- Add `isFavorite` boolean field to Item schema
- Consider storing "last purchased" timestamp for recency sorting

**Filter Modes:**
- **By Frequency:** Show slider to adjust minimum purchase count threshold
- **Favorites Only:** Show only items marked as favorite, sorted by purchase count
- Display favorite star icon in both modes for quick visual identification

**UX Considerations:**
- Pre-select items above a smart threshold (e.g., bought 3+ times)
- Allow bulk quantity adjustment (e.g., "Add 1 of each" vs custom)
- Provide clear empty state if no purchase history exists

## Related Stories
- [US-1: Autocomplete](./US-01-autocomplete.md) - Autocomplete complements by showing frequent items in suggestions
- [US-8: Store Management](./US-08-store-management.md) - Store-specific item catalogs
- [US-9: Shopping Lifecycle](./US-09-shopping-lifecycle.md) - Completed trips build purchase history

---

**Last Updated:** January 11, 2026
