# GRO-4: Store Section Configuration

**Phase**: 1 - Core Setup
**Priority**: Critical (Core Value Prop)
**Status**: Draft

## Context
Different stores have different layouts. To optimize the shopping run, users need to define the order of sections (aisles) for each specific store so their list is sorted correctly.

## Requirements
- Allow users to define sections (e.g., "Produce", "Dairy") for a specific store.
- Allow users to reorder these sections to match the physical store layout.

## Acceptance Criteria
- [ ] User can add a new section to a store.
- [ ] User can rename or delete a section.
- [ ] User can reorder sections (e.g., via drag-and-drop or up/down controls).
- [ ] The order of sections is saved and persists.
- [ ] Changes to section order are reflected immediately (optimistic UI is preferred but not strictly required by functional spec, just "responsive").

## Definition of Done
- **See `planning/DOD.md`**
