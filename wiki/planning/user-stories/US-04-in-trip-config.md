# US-4: In-Trip Store Configuration

> *"As a user, I want to update store configuration while shopping."*

## Status
🔲 **DEFERRED**

## Goal
Allow users to correct item placement and section order during a shopping trip, teaching the system for future runs.

## Acceptance Criteria
- While shopping, user can move an item to a different section
- User can reorder sections via drag-and-drop or similar mechanism
- Changes persist for future lists at the same store
- System learns from corrections to improve auto-categorization

## Implementation Notes

**Why Deferred:**
This feature requires the core section management system to be implemented first (see US-8). Additionally, the UX for in-trip editing needs careful design to avoid disrupting the shopping flow.

**Future Considerations:**
- Consider showing "Did you find this item in the right section?" prompt after checking off items
- Batch corrections rather than individual confirmations to reduce friction
- Track correction patterns to improve ML-based auto-categorization

## Related Stories
- [US-8: Store Management](./US-08-store-management.md) - Core section management (prerequisite)
- [US-9: Shopping Lifecycle](./US-09-shopping-lifecycle.md) - Shopping mode context

---

**Last Updated:** January 11, 2026
