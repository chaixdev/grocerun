# GRO-400: Shopping Mode UI

**User Story**: [US-400: Shopping Execution](../user-stories/US-400-shopping-execution.md)
**Status**: TODO

## Context
The "Run" mode.

## Requirements
1.  **UI Design**:
    -   Large tap targets for checkboxes.
    -   Strikethrough for checked items.
    -   Hide checked items (optional toggle).
2.  **Wake Lock**:
    -   Use `navigator.wakeLock` to prevent sleep.
3.  **Optimistic Updates**:
    -   Check/Uncheck must be instant.

## Acceptance Criteria
- [ ] UI is optimized for mobile.
- [ ] Screen stays on.
- [ ] Checking items is instant.
