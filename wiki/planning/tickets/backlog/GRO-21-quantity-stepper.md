# GRO-21: Mobile Quantity Stepper Component

**User Story**: [US-5: Mobile-Friendly List Item Editing](../user-stories/US-5-mobile-quantity-editing.md)
**Priority**: High
**Status**: Backlog
**Depends On**: GRO-20

## Context
Users need touch-friendly controls to adjust quantities while shopping, without opening dialogs or using small number inputs.

## Requirements
1. **Stepper UI**: +/- buttons flanking the quantity value
2. **Tap-to-edit**: Tapping quantity opens inline input for manual entry
3. **Optimistic updates**: Immediate visual feedback
4. **Mobile-first**: Min 44px touch targets, works with thumbs

## Acceptance Criteria
- [ ] Tapping + increases quantity by 1 (or 0.5 for fractional units)
- [ ] Tapping - decreases quantity (min 0.1)
- [ ] Tapping value opens numeric input
- [ ] Changes save immediately with optimistic UI
- [ ] Works on mobile and desktop

## Technical Notes
- Create `QuantityStepper` component
- Add `updateListItemQuantity` server action
- Use optimistic updates like `toggleListItem`
- Consider haptic feedback for mobile (nice-to-have)
