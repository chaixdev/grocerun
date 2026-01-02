# US-2: Easily Add Common Items

> *"As a user, I want to easily add common items from previous grocery runs."*

## Goal
Speed up list creation by pre-populating with frequently purchased items ("My Usuals"). This is the "Create List" flow triggered from the Store Card (see [US-8](./US-8-store-catalog-management.md)).

## Acceptance Criteria
- [ ] When creating a new list, a form shows all items boughtfrom this store
- Several ways to filter items: 
    - [ ] dynamically filter by minimum purchase count
    - [ ] items can be marked as "favorite". 
    - [ ] the list creation form filter can be toggled by either purchase count or favorite
- [ ] Checkbox + quantity/unit per item
- [ ] "Create List" copies selected items to the new list

## Tickets
| ID | Title | Status |
|---|---|---|
| GRO-15 | Smart List Creation ("My Usuals") | 🔲 TODO |
| GRO-23 | Favorite Items (Schema + Toggle UI) | 🔲 TODO |
| GRO-24 | List Creation Filter Modes | 🔲 TODO |

### Ticket Details

**GRO-23: Favorite Items**
- Add `isFavorite: Boolean` field to `Item` schema
- UI: Toggle button on item card/row to mark as favorite
- Backend: `toggleFavorite(itemId)` action

**GRO-24: List Creation Filter Modes**
- Filter toggle: "By Frequency" / "Favorites Only"
- Purchase count slider (when in frequency mode)
- Show starred icon for favorites in both modes

*Note: GRO-13 (Autocomplete) also contributes via frequent items in empty state.*
