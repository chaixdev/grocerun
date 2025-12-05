# GRO-6: Shopping Mode (Execution)

**Phase**: 1 - Rope Bridge
**Priority**: High
**Status**: Draft

## Context
Once a list is created (GRO-5), the user needs to execute it in the store. This is the "Shopping Mode".

## Requirements
1.  **Mobile-First View**: Large tap targets.
2.  **Section Ordering**: Sections appear in the order defined in GRO-4.
3.  **Check-off**: Tapping an item marks it as "Done".
4.  **Optimistic UI**: Instant feedback.
5.  **Done State**: Checked items move to bottom or dim.

## Acceptance Criteria
- [ ] User sees list grouped by section in correct order.
- [ ] Tapping an item toggles its checked state.
- [ ] Checked items are visually distinct.
- [ ] State persists on reload.
