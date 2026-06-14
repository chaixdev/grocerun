# GRO-18: Real-Time Sync (Polling)

**User Story**: [US-3: Household Collaboration](../user-stories/US-3-household-collaboration.md)
**Status**: Backlog
**Depends On**: GRO-17

## Context
When two household members are shopping together, check-offs should sync in near real-time.

## Requirements
1. **Polling**: Every 5 seconds, fetch latest list state
2. **Diff**: Only update changed items (avoid flickering)
3. **Indicator**: Show "last synced" timestamp or live indicator

## Acceptance Criteria
- [ ] Member A checks off → Member B sees it within 5 seconds
- [ ] No full page refresh required
- [ ] Works on mobile

## Technical Notes
- Start with polling (simple)
- Future: Consider WebSockets or Server-Sent Events
- Use `useEffect` with interval or SWR `refreshInterval`
