# GRO-2: Authentication System

**Phase**: 1 - Core Setup
**Priority**: High
**Status**: Done

## Context
Users need to log in to access their private data (stores, lists, history). The system must support common, low-friction sign-in methods.

## Requirements
- Implement a secure authentication system.
- Support Google Sign-In (OAuth) for one-click access.
- Secure all private routes; unauthenticated users should be redirected to login.

## Acceptance Criteria
- [ ] User can sign up/login using a Google account.
- [ ] User session persists across page reloads.
- [ ] User can log out.
- [ ] Accessing a protected page (e.g., `/dashboard`) without a session redirects to `/login`.
- [ ] Login page follows the application's design aesthetic.

## Definition of Done
- **See `planning/DOD.md`**
