# GRO-25: Fix "New Item" Dialog Glitch

## Context
When adding a new item that doesn't exist in the store, the "New Item" dialog appears to allow categorization. However, upon clicking "Save & Add", the dialog flickers (disappears and reappears) or behaves inconsistently before closing.

## Current Behavior
- User enters new item name -> `NEEDS_SECTION` returned.
- Dialog opens.
- User selects section and clicks "Save & Add".
- Item is added successfully.
- Dialog flickers or has a race condition during closure.

## Attempted Fixes (Failed)
1.  **Reordering State Updates**: Tried closing the dialog before clearing state.
2.  **`type="button"`**: Added to prevent form submission (good practice, kept).
3.  **`isSubmitting` Guard**: Added to prevent double clicks (good practice, kept).
4.  **`stopPropagation`**: Added to stop event bubbling (didn't help).
5.  **Aggressive State Clearing**: Clearing `inputValue` immediately after API call (didn't help).

## Suspected Cause
- Interaction between the parent form's `onSubmit` and the dialog's button click.
- Optimistic UI updates triggering a re-render that conflicts with the dialog's open state.
- `radix-ui` Dialog component interaction with the focus management or portal when the underlying list updates.

## Next Steps
- Investigate `radix-ui` Dialog behavior with optimistic updates.
- Isolate the dialog into a separate component with its own state context.
- Debug the exact sequence of renders during the add item flow.
