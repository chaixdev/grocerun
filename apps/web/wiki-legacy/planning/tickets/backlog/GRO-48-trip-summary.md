# GRO-48: Trip Summary & Completion Flow

**Story**: "US-9: The Shopping Lifecycle"
**Status**: Todo

## Context
Closing the loop on a shopping trip.

## Requirements
1.  **Trigger**: "Finish Shopping" button clicked.
2.  **Summary Modal**:
    -   "You bought X items."
    -   Show any unchecked items (ask to keep on list or remove).
3.  **Action**: Confirm Finish.
4.  **Result**:
    -   List status -> `COMPLETED` (or `ARCHIVED`).
    -   Redirect to Dashboard.

## Acceptance Criteria
- [ ] Summary dialog appears on finish
- [ ] User can choose fate of unbought items (carry over vs delete)
- [ ] List is archived and disappears from "Active" dashboard view
