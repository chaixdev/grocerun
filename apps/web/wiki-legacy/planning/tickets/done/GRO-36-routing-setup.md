# GRO-36: Create Placeholder Screens & Routing

**Story**: "US-6: The Responsive Shell"
**Status**: Todo

## Context
Set up the skeleton of the application to support the new navigation structure.

## Requirements
1.  **Routes**:
    -   `/lists` (Dashboard/Home)
    -   `/stores` (Catalog)
    -   `/settings` (Account)
2.  **Redirect**: Root `/` should redirect to `/lists`.
3.  **Placeholders**: Create simple components for each route to verify navigation.

## Acceptance Criteria
- [ ] Clicking "Lists" in nav goes to `/lists`
- [ ] Clicking "Stores" in nav goes to `/stores`
- [ ] Clicking "Settings" in nav goes to `/settings`
- [ ] Root URL redirects to `/lists`
