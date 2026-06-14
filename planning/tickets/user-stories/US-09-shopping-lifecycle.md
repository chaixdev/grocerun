# US-9: The Shopping Lifecycle

> *"As a user, I need the app to behave differently when I'm planning versus when I'm actually shopping."*

## Status
🔲 **PLANNED**

## Goal
Implement a state machine for lists (Planning → Shopping → Archived) with distinct UI modes optimized for each context.

## Acceptance Criteria
- **State Management:** Lists have a status (`PLANNING`, `SHOPPING`, `COMPLETED`)
- **Planning Mode:** Optimized for adding/organizing items
  - Items sorted by section
  - Add/remove/edit item controls prominent
  - Quantity and note editing
- **Shopping Mode:** Optimized for execution
  - Large checkboxes for easy tapping while walking
  - Wake Lock (prevent screen sleep)
  - "Planned" vs "Bought" quantity tracking
  - Section-by-section progression
- **Transitions:** Clear actions to Start, Finish, or Cancel a shopping trip
- **History:** Finishing a trip archives it with timestamp and total

## Implementation Notes

**State Machine:**
```
PLANNING ──[Start Shopping]──> SHOPPING ──[Finish]──> COMPLETED
    ↑                              │
    └────────[Cancel Trip]─────────┘
```

**Planning Mode UI:**
- Standard list view with all CRUD operations
- Drag-and-drop reordering
- Bulk operations (select multiple, delete, move section)
- "Start Shopping" button at top

**Shopping Mode UI:**
- Full-screen, distraction-free interface
- Large checkboxes (min 60x60px touch targets)
- Current section highlighted, collapsed sections
- Progress indicator (5/12 items checked)
- Screen wake lock via Web Wake Lock API
- "Finish Shopping" button when all items checked

**Quantity Tracking:**
- Planned quantity: What user intended to buy
- Bought quantity: What user actually purchased
- Allow editing bought quantity in shopping mode
- Track delta for insights (overspent vs underspent)

**Trip Summary:**
- Show planned vs actual for review
- Option to save differences to adjust future lists
- Archive with metadata (date, duration, total cost if entered)

## Technical Considerations

**Wake Lock API:**
```javascript
// Request wake lock when entering shopping mode
const wakeLock = await navigator.wakeLock.request('screen');
// Release when finishing or backgrounding
wakeLock.release();
```

**State Persistence:**
- Store current mode in list record
- Sync state changes across all household members in real-time
- Handle edge cases (what if two users start shopping simultaneously?)

## Related Stories
- [US-5: Mobile Quantity Editing](./US-05-mobile-quantity-editing.md) - Quantity controls in shopping mode
- [US-4: In-Trip Configuration](./US-04-in-trip-config.md) - Section corrections during shopping
- [US-7: Dashboard](./US-07-dashboard-experience.md) - List status display on dashboard
- [US-2: Common Items](./US-02-common-items.md) - Purchase history from completed trips

---

**Last Updated:** January 11, 2026
