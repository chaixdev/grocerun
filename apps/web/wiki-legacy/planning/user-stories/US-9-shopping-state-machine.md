# US-9: The Shopping Lifecycle

> *"As a user, I need the app to behave differently when I'm planning versus when I'm actually shopping."*

## Goal
Implement a state machine for lists (Planning -> Shopping -> Archived) with distinct UI modes optimized for each context.

## Acceptance Criteria
- [ ] **State Management:** Lists have a status (`PLANNING`, `SHOPPING`, `COMPLETED`)
- [ ] **Planning Mode:** Optimized for adding/organizing items. Items sorted by section.
- [ ] **Shopping Mode:** Optimized for execution. 
    - Large checkboxes
    - Wake Lock (prevent screen sleep)
    - "Planned" vs "Bought" quantity tracking
- [ ] **Transitions:** Clear actions to Start, Finish, or Cancel a shopping trip
- [ ] **History:** Finishing a trip archives it

## Tickets
| ID | Title | Status |
|---|---|---|
| GRO-42 | Schema Migration - List Status Enum | 🔲 TODO |
| GRO-43 | Backend - State Transition Actions | 🔲 TODO |
| GRO-46 | Planning Mode UI & Sorting | 🔲 TODO |
| GRO-47 | Shopping Mode UI & Wake Lock | 🔲 TODO |
| GRO-48 | Trip Summary & Completion Flow | 🔲 TODO |
