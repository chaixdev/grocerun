# GRO-13: Intelligent Autocomplete

**User Story**: [US-1: Autocomplete for Item Selection](../user-stories/US-1-autocomplete.md)
**Priority**: High
**Status**: Done ✅

## Context
When adding items to a list, the user currently types into a plain text field. We have `purchaseCount` data but don't leverage it.

## Requirements
1. **Backend**: Create `searchItems(storeId, query)` action
   - Returns items matching the query
   - Sorted by `purchaseCount` (descending)
   - Limit to 10 results
2. **Frontend**: Replace text input with Combobox
   - **Empty state**: Show top 5 frequent items for the store
   - **Typing**: Filter by query
   - **Selection**: Auto-populate section and default unit

## Acceptance Criteria
- [x] Typing in the input shows matching items
- [x] Results are sorted by purchase frequency
- [x] Empty input shows frequent items
- [x] Selecting an item adds it to the list

## Technical Notes
- Use Radix UI Combobox or similar
- Debounce search input (300ms)
