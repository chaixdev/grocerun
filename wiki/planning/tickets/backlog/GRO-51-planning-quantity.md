# GRO-51: Planning Mode Quantity Editing

**Type**: ✨ Feature  
**User Story**: [US-5: Mobile Quantity Editing](../user-stories/US-5-mobile-quantity-editing.md)

## 📝 problem
Currently, users can set a quantity when adding an item (via the autocomplete form), but they cannot modify it afterwards without removing and re-adding the item. The "Edit Item" dialog only modifies the global *Catalog Item* (default unit/section), not the specific quantity for the current trip.

## 💡 Solution
Introduce inline quantity controls (`[-] Qty [+]`) for each item row when the list is in **PLANNING** mode.

## ✅ Acceptance Criteria
- [ ] **UI**: Display `[-]` and `[+]` buttons next to the quantity indicator on list items.
- [ ] **Interaction**: Tapping `[-]` decrements quantity by 1 (or 0.1 if unit allows).
- [ ] **Interaction**: Tapping `[+]` increments quantity.
- [ ] **Interaction**: Tapping the quantity number itself could open a small popover for manual entry (optional, nice to have).
- [ ] **Zero Logic**: Decrementing below 1 (or 0.1) should confirm removal of the item OR stop at minimum value (preferred: stop at min, use trash icon to remove).
- [ ] **State**: Changes persist immediately to `ListItem.quantity`.

## 🎨 Design Notes
- Can reuse the "Stepper" component pattern if we have one, or simple Button/Input grouping.
- Should update the `optimistic` UI state immediately for responsiveness.
