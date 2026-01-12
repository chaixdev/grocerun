# Bug Report: Add Item Functionality Broken

## Issue
**Cannot add items to a shopping list when store has no sections defined**

## Discovered By
E2E test `ITEM-001: Add Item to List` exposing real application bug

## Severity
**HIGH** - Core functionality broken, prevents users from adding any items to lists

## Reproduction Steps
1. Create a new store (with no sections defined)
2. Create a shopping list for that store
3. Try to add an item (e.g., "Milk") to the list
4. Click the "Add" button

## Expected Behavior
- API should return `{ status: "NEEDS_SECTION" }`
- Frontend should open section selection dialog
- User selects section (or "No Section")
- Item gets added to the list

## Actual Behavior
- Click "Add" button → nothing happens
- Item name stays in the input field
- No dialog opens
- No toast/error message appears
- API call to `/lists/items/add` times out or fails silently
- Item never appears in the list

## Root Cause Analysis

### Backend Logic ([lists.service.ts#L162-164](apps/server/src/lists/lists.service.ts#L162))
```typescript
// If item is new and sectionId not provided, ask for it
if (sectionId === undefined) {
  return { status: 'NEEDS_SECTION' };
}
```

### Frontend Handler ([ListEditor.tsx#L176-179](apps/web/src/features/lists/components/ListEditor.tsx#L176))
```typescript
} else if (result.status === "NEEDS_SECTION") {
    setNewItemName(inputValue.trim())
    setSelectedSection("") // Default to uncategorized
    setIsDialogOpen(true)
}
```

## Hypothesis
- The API call to `addItemToList` is failing or timing out
- Frontend never receives the `NEEDS_SECTION` response
- Dialog never opens because the response never arrives
- Possible network error, CORS issue, or server-side exception not being caught

## Test Evidence
```
Error: expect(locator).toBeVisible() failed
Locator: locator('text="Milk 1768244191628"').first()
Expected: visible
Timeout: 5000ms
```

Error context shows:
- Item name still in input field
- "Add" button present (not disabled)
- No dialog visible
- No error messages
- "Go Shopping" button disabled (list is empty)

## Impact
- Users cannot add items to newly created stores
- Workaround: Must manually create at least one section before adding items
- Affects onboarding experience for new users
- Tests validly failing until bug is fixed

## Next Steps
1. Check browser console for JS errors when clicking "Add"
2. Check network tab for failed API calls
3. Check server logs for exceptions during item addition
4. Verify auth token is being sent correctly
5. Check if issue is specific to stores with no sections
6. Consider making section optional (allow null sectionId) or auto-create "Uncategorized" section

## Test Files Affected
- `tests/core/items/item-management.spec.ts`
- `tests/core/lists/shopping-mode.spec.ts` 
- `tests/journeys/first-shopping-experience.spec.ts`
- All tests using `withList` fixture + `addItemToList()` helper

## Status
🔴 **BLOCKING** - 24 E2E tests failing due to this bug
