# GRO-23: Pantry Items (Schema + Toggle UI)

**User Story**: [US-2: Easily Add Common Items](../user-stories/US-2-common-items.md)
**Status**: Backlog

## Context
Some items are "always on the list" or essential stock (milk, eggs, bread). We refer to these as **Pantry Items**.

## Requirements
1. **Schema**: Add `isPantry: Boolean @default(false)` to `Item`
2. **Toggle UI**: **Archive/Box icon** (or "Pantry" label) to toggle status
3. **Backend**: `togglePantry(itemId)` action

## Acceptance Criteria
- [ ] User can mark item as Pantry item
- [ ] Status persists
- [ ] Visual indicator shows Pantry status
- [ ] Works in list view and autocomplete

## Technical Notes
- Prisma migration needed
- Add icon next to item name
- Dutch Translation candidate: "Voorraad" or "Basics"
