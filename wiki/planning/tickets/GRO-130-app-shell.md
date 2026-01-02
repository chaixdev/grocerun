# GRO-130: App Shell & Navigation

**User Story**: [US-101: Responsive Shell](../user-stories/US-101-responsive-shell.md)
**Status**: TODO

## Context
The main container for the application. It needs to adapt to the device size.

## Requirements
1.  **Layout Component**:
    -   Wraps all authenticated routes.
    -   Manages the "Main Content Area".
2.  **Sidebar (Desktop)**:
    -   Visible on `md` screens and up.
    -   Links: Dashboard, Stores, Settings.
    -   Collapsible (optional).
3.  **Bottom Nav (Mobile)**:
    -   Visible on `sm` screens and down.
    -   Fixed at bottom.
    -   Icons: Dashboard, Stores, Settings.
4.  **Routing**:
    -   Setup `react-router-dom`.
    -   Define routes for `/`, `/stores`, `/settings`.

## Acceptance Criteria
- [ ] App displays Sidebar on Desktop.
- [ ] App displays Bottom Nav on Mobile.
- [ ] Navigation links change the URL and View.
- [ ] Active link is highlighted.
