# US-1: Autocomplete for Item Selection

> *"As a user, I want autocomplete to help selecting an item for my list."*

## Goal
Reduce friction when adding items to a shopping list by suggesting relevant items based on the store's catalog and purchase history.

## Acceptance Criteria
- [ ] When typing in the "Add Item" field, suggestions appear
- [ ] Suggestions are sorted by purchase frequency (most bought first)
- [ ] Empty state shows top 5 frequent items for the store
- [ ] Typos are tolerated (fuzzy matching)

## Tickets
| ID | Title | Status |
|---|---|---|
| GRO-13 | Intelligent Autocomplete | ✅ Done |
| GRO-14 | Fuzzy Matching (FTS5 + Spellfix1) | 🔲 TODO |
