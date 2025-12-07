# GRO-47: Shopping Mode UI & Wake Lock

**Story**: "US-9: The Shopping Lifecycle"
**Status**: Todo

## Context
The active shopping experience. Needs to be friction-free and keep the screen alive.

## Requirements
1.  **UI Layout**:
    -   Large, easy-to-tap checkboxes (left side).
    -   Item Name (strikethrough when checked).
    -   Quantity (large text).
2.  **Interactions**:
    -   Checking an item moves it to the bottom (or grays it out).
    -   Auto-scroll to next unchecked item (optional, but nice).
3.  **Wake Lock**: Use Screen Wake Lock API to prevent phone from sleeping.
4.  **Action**: "Finish Shopping" button.

## Acceptance Criteria
- [ ] UI switches to "Shopping Mode" layout
- [ ] Screen stays on while in this mode
- [ ] Checkboxes are large and touch-friendly
- [ ] "Finish" button is accessible
