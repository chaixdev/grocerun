# US-5: Mobile-Friendly List Item Editing

> *"As a user, I want to quickly adjust item quantities while shopping without fiddly inputs."*

## Status
🔲 **PLANNED**

## Goal
Provide touch-friendly controls for adjusting item quantities on mobile devices, with clear visual feedback.

## Acceptance Criteria
- List items display quantity and unit (e.g., "2 kg", "1 bottle")
- +/- buttons allow quick quantity adjustment with one tap
- Tapping the quantity value opens an inline input for manual entry
- Changes persist immediately (optimistic UI with background sync)
- Large touch targets (min 44x44px) for accessibility

## Implementation Notes

**Component Design:**
```
[Item Name                    ]
[ - ] [ 2 kg ] [ + ]  [✓]
```

**Interaction Patterns:**
- **+/- Buttons:** Increment/decrement by 1 (or smallest unit)
- **Tap Quantity:** Focus input, select all text for quick replacement
- **Mobile Keyboard:** Show numeric keyboard with decimal support for quantities
- **Unit Persistence:** Remember last used unit per item (e.g., "milk" defaults to "L")

**State Management:**
- Optimistic updates: UI reflects changes immediately
- Queue mutations for background sync
- Show subtle loading indicator if sync is slow
- Revert on error with user notification

## Related Stories
- [US-9: Shopping Lifecycle](./US-09-shopping-lifecycle.md) - Shopping mode context for this interaction
- [US-2: Common Items](./US-02-common-items.md) - Pre-populate with typical quantities

---

**Last Updated:** January 11, 2026
