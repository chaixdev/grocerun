# US-6: The Responsive Shell

> *"As a user, I want an app that feels native on my phone but also respects my screen real estate on my laptop."*

## Status
✅ **IMPLEMENTED**

## Goal
Implement a responsive navigation structure that adapts seamlessly between mobile (bottom navigation) and desktop (sidebar), ensuring the app feels "native" on all devices.

## Acceptance Criteria
- ✅ App detects screen width and switches layout automatically
- ✅ **Mobile (< 768px):** Shows fixed bottom navigation bar
- ✅ **Desktop (>= 768px):** Shows persistent sidebar navigation
- ✅ Navigation items (Lists, Stores, Settings) are consistent across views
- ✅ Active state is clearly visible on the current nav item
- ✅ Root URL `/` redirects to primary view

## Implementation Status

**Completed:**
- Responsive navigation shell with breakpoint detection
- Mobile bottom navigation with icons and labels
- Desktop sidebar with expanded navigation items
- Active route highlighting
- Routing structure for core pages

## Technical Implementation

**Breakpoint Logic:**
- Uses Tailwind CSS responsive utilities
- Breakpoint: 768px (md: in Tailwind)
- CSS-based adaptation (no JavaScript required for basic responsiveness)

**Navigation Structure:**
```
Mobile (< 768px):       Desktop (>= 768px):
┌─────────────────┐    ┌──────┬──────────────┐
│                 │    │      │              │
│                 │    │  S   │              │
│   Content       │    │  i   │   Content    │
│                 │    │  d   │              │
│                 │    │  e   │              │
├─────────────────┤    │  b   │              │
│ [Lists] [Stores]│    │  a   │              │
│ [Settings]      │    │  r   │              │
└─────────────────┘    └──────┴──────────────┘
```

## Related Documentation
- [Design System](../../design/) - Navigation component specs (if available)

---

**Last Updated:** January 11, 2026
