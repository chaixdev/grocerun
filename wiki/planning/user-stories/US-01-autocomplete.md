# US-1: Autocomplete for Item Selection

> *"As a user, I want autocomplete to help selecting an item for my list."*

## Status
🔲 **PLANNED**

## Goal
Reduce friction when adding items to a shopping list by suggesting relevant items based on the store's catalog and purchase history.

## Acceptance Criteria
- When typing in the "Add Item" field, suggestions appear
- Suggestions are sorted by purchase frequency (most bought first)
- Empty state shows top 5 frequent items for the store
- Typos are tolerated (fuzzy matching)

## Implementation Notes

**Smart Suggestions:**
- Prioritize items previously purchased at this store
- Fall back to global catalog if no store-specific history
- Consider implementing fuzzy matching (FTS5 + Spellfix1) for typo tolerance

**UX Considerations:**
- Autocomplete should appear quickly (< 100ms perceived delay)
- Keyboard navigation support (arrow keys, enter to select)
- Touch-friendly hit targets on mobile (min 44x44px)

## Related Stories
- [US-2: Common Items](./US-02-common-items.md) - Complements autocomplete with "My Usuals" workflow
- [US-8: Store Management](./US-08-store-management.md) - Store-specific item catalogs

---

**Last Updated:** January 11, 2026
