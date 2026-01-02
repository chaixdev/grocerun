# US-6: The Responsive Shell

> *"As a user, I want an app that feels native on my phone but also respects my screen real estate on my laptop."*

## Goal
Implement a responsive navigation structure that adapts seamlessly between mobile (bottom navigation) and desktop (sidebar), ensuring the app feels "native" on all devices.

## Acceptance Criteria
- [x] App detects screen width and switches layout automatically
- [x] **Mobile (< 768px):** Shows fixed Bottom Navigation bar
- [x] **Desktop (>= 768px):** Shows persistent Sidebar navigation
- [x] Navigation items (Lists, Stores, Settings) are consistent across views
- [x] Active state is clearly visible on the current nav item
- [x] Root URL `/` redirects to the Dashboard (`/lists`)

## Tickets
| ID | Title | Status |
|---|---|---|
| GRO-35 | Implement Responsive Navigation Shell | ✅ DONE |
| GRO-36 | Create Placeholder Screens & Routing | ✅ DONE |
