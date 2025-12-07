# GRO-44: Store Configuration Screen

**Story**: "US-8: Store Catalog & Configuration"
**Status**: Todo

## Context
Users need a way to edit store details like name, location, and image.

## Requirements
1.  **Route**: `/stores/[id]/edit`
2.  **Form**:
    -   Name (Input)
    -   Location (Input/Textarea)
    -   Image URL (Input - optional)
3.  **Actions**:
    -   Save Changes
    -   Delete Store (with confirmation)

## Acceptance Criteria
- [ ] Edit form loads with current store data
- [ ] Changes are saved to the database
- [ ] Delete action removes the store (and handles associated lists gracefully)
