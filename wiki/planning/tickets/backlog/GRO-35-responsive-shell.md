# GRO-35: Implement Responsive Navigation Shell

**Story**: "US-6: The Responsive Shell"
**Status**: Todo

## Context
"As a user, I want an app that feels native on my phone but also respects my screen real estate on my laptop."

## Requirements
1.  **Layout Wrapper**: Create a main layout component that wraps the app.
2.  **Responsive Logic**: Use `useMediaQuery` (or similar) to detect screen width.
    -   Mobile (< 768px): Render `BottomNav`.
    -   Desktop (>= 768px): Render `Sidebar`.
3.  **Navigation Items**:
    -   Lists (Home)
    -   Stores
    -   Settings

## Acceptance Criteria
- [ ] App renders Bottom Navigation on mobile view
- [ ] App renders Sidebar on desktop view
- [ ] Resizing the window switches between modes instantly
- [ ] Navigation items are present and clickable
