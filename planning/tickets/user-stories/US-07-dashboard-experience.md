# US-7: The Dashboard (Active Lists)

> *"As a user, I want to see all my active shopping tasks at a glance, grouped by household."*

## Status
⚠️ **PARTIALLY IMPLEMENTED**

## Goal
Create a central dashboard that organizes active shopping lists by household, providing immediate access to ongoing tasks and a history of past trips.

## Acceptance Criteria
- ✅ **Grouping:** Lists are visually grouped by household
- ✅ **List Cards:** Display store name and item count/status
- ✅ **Empty State:** Clear call-to-action if a household has no active lists
- 🔲 **Archived Section:** Collapsible accordion at the bottom showing completed trips
- ✅ **Interactions:** Tapping a card opens the list in planning mode

## Implementation Status

**Completed:**
- Lists page with household grouping
- List cards showing store and item information
- Empty states for households without lists
- Navigation to individual lists

**Pending:**
- Archived/completed lists view
- Filtering/sorting options
- List status indicators (planning vs shopping vs completed)

## Implementation Notes

**Dashboard Layout:**
```
┌─────────────────────────────┐
│ My Household                │
├─────────────────────────────┤
│ 🏪 Trader Joe's      [12]   │
│ 🏪 Costco            [8]    │
├─────────────────────────────┤
│ Roommate Household          │
├─────────────────────────────┤
│ 🏪 Whole Foods       [5]    │
└─────────────────────────────┘
```

**List Card Information:**
- Store name and icon/image
- Item count (or percentage completed if in shopping mode)
- Last updated timestamp
- Visual status indicator (planning/shopping/completed)

**Archived Lists:**
- Show last 10-20 completed trips
- Collapsible section to reduce clutter
- Searchable for finding old lists
- Option to "Shop Again" (copy to new list)

## Related Stories
- [US-3: Household Collaboration](./US-03-household-collaboration.md) - Multi-household context
- [US-9: Shopping Lifecycle](./US-09-shopping-lifecycle.md) - List states and transitions
- [US-2: Common Items](./US-02-common-items.md) - "Shop Again" from archived lists

---

**Last Updated:** January 11, 2026
