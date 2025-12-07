# GRO-46: Planning Mode UI & Sorting

**Story**: "US-9: The Shopping Lifecycle"
**Status**: Todo

## Context
The default state of a list. Optimized for adding and organizing items before the trip.

## Requirements
1.  **Sorting**: Items must be automatically grouped by Store Section.
2.  **Add Item**: Prominent input field (using existing Autocomplete).
3.  **Item Row**:
    -   Name
    -   Quantity/Unit
    -   *No Checkbox* (or disabled) to discourage premature checking.
4.  **Action**: "Go Shopping" button (Sticky footer or prominent header action).

## Acceptance Criteria
- [ ] Items are grouped by section headers
- [ ] "Go Shopping" button transitions list status to `SHOPPING`
- [ ] UI clearly indicates "Planning Mode"
