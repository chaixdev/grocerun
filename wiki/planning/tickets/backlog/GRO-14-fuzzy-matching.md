# GRO-14: Fuzzy Matching (FTS5 + Spellfix1)

**User Story**: [US-1: Autocomplete for Item Selection](../user-stories/US-1-autocomplete.md)
**Status**: Backlog
**Depends On**: GRO-13

## Context
Users make typos. "Banan" should still find "Banana".

## Requirements
1. **Schema**: Create FTS5 virtual table for `Item.name`
2. **Spellfix1**: Enable typo tolerance
3. **Search**: Update `searchItems` to use FTS5 with fuzzy matching

## Acceptance Criteria
- [ ] "Banan" returns "Banana"
- [ ] "Mlk" returns "Milk"
- [ ] Performance: < 100ms for 1000 items

## Technical Notes
- SQLite FTS5 + spellfix1 extension
- May require Prisma raw queries
- Test with common typo patterns
