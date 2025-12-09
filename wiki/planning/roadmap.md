# Grocerun Product Roadmap

> [!NOTE]
> This document is the **Single Source of Truth** for project priority. 
> The file location of a ticket (`backlog`, `in-progress`, `done`) is secondary to its position on this board.

## 🟢 Phase 1: The Foundation (Responsive Shell)
*Goal: Establish the app structure, navigation, and user settings.*
- [x] [GRO-35: Responsive Navigation Shell](./tickets/done/GRO-35-responsive-shell.md) ([US-6](./user-stories/US-6-responsive-shell.md))
- [x] [GRO-36: Routing & Placeholders](./tickets/done/GRO-36-routing-setup.md) ([US-6](./user-stories/US-6-responsive-shell.md))
- [x] [GRO-49: Settings Page](./tickets/done/GRO-49-settings-page.md) ([US-10](./user-stories/US-10-settings-and-preferences.md))
- [x] [GRO-16: Invitation Backend](./tickets/done/GRO-16-invite-user.md) ([US-3](./user-stories/US-3-household-collaboration.md))
- [x] [GRO-50: Invitation UI](./tickets/done/GRO-50-invitation-ui.md) ([US-3](./user-stories/US-3-household-collaboration.md))

## 🟡 Phase 2: Core Data (Stores & Dashboard)
*Goal: Enable users to manage stores and view their active lists.*
- [x] [GRO-38: Dashboard Layout](./tickets/done/GRO-38-dashboard-layout.md) ([US-7](./user-stories/US-7-dashboard-experience.md))
- [x] [GRO-37: Active List Card](./tickets/done/GRO-37-list-card-design.md) ([US-7](./user-stories/US-7-dashboard-experience.md))
- [x] [GRO-41: Store Directory Page](./tickets/done/GRO-41-store-directory.md) ([US-8](./user-stories/US-8-store-catalog-management.md))
- [x] [GRO-40: Store Card Design](./tickets/done/GRO-40-store-card-design.md) ([US-8](./user-stories/US-8-store-catalog-management.md))
- [x] [GRO-44: Store Configuration Screen](./tickets/done/GRO-44-store-config.md) ([US-8](./user-stories/US-8-store-catalog-management.md))
- [x] [GRO-45: Section Management UI](./tickets/done/GRO-45-section-management.md) ([US-8](./user-stories/US-8-store-catalog-management.md))

## 🟠 Phase 3: Planning Mode (List Creation)
*Goal: Frictionless list creation and item entry.*
- [x] [GRO-13: Intelligent Autocomplete](./tickets/done/GRO-13-autocomplete.md) ([US-1](./user-stories/US-1-autocomplete.md))
- [ ] [GRO-52: Fix "Start Shopping List" Logic](./tickets/backlog/GRO-52-fix-active-list-logic.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-46: Planning Mode UI](./tickets/backlog/GRO-46-planning-mode.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-51: Planning Mode Quantity Editing](./tickets/backlog/GRO-51-planning-quantity.md) ([US-5](./user-stories/US-5-mobile-quantity-editing.md))
- [ ] [GRO-14: Fuzzy Matching (FTS5)](./tickets/backlog/GRO-14-fuzzy-matching.md) ([US-1](./user-stories/US-1-autocomplete.md))
- [ ] [GRO-23: Pantry Items](./tickets/backlog/GRO-23-pantry-items.md) ([US-2](./user-stories/US-2-common-items.md))
- [ ] [GRO-15: Smart List Creation ("My Usuals")](./tickets/backlog/GRO-15-smart-list-creation.md) ([US-8](./user-stories/US-8-store-catalog-management.md))
- [ ] [GRO-24: Filter Modes](./tickets/backlog/GRO-24-filter-modes.md) ([US-2](./user-stories/US-2-common-items.md))



## 🔴 Phase 4: Shopping Mode (Execution)
*Goal: The in-store experience and trip completion.*
- [ ] [GRO-42: Schema Migration (Status Enum)](./tickets/backlog/GRO-42-schema-status.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-43: Backend State Actions](./tickets/backlog/GRO-43-backend-state-actions.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-47: Shopping Mode UI & Wake Lock](./tickets/backlog/GRO-47-shopping-mode.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-20: Display Quantity/Unit](./tickets/backlog/GRO-20-display-quantity.md) ([US-5](./user-stories/US-5-mobile-quantity-editing.md))
- [ ] [GRO-21: Mobile Quantity Stepper](./tickets/backlog/GRO-21-quantity-stepper.md) ([US-5](./user-stories/US-5-mobile-quantity-editing.md))
- [ ] [GRO-18: Real-Time Sync](./tickets/backlog/GRO-18-realtime-sync.md) ([US-3](./user-stories/US-3-household-collaboration.md))
- [ ] [GRO-48: Trip Summary & Completion](./tickets/backlog/GRO-48-trip-summary.md) ([US-9](./user-stories/US-9-shopping-state-machine.md))
- [ ] [GRO-39: Archived Lists Accordion](./tickets/backlog/GRO-39-archived-accordion.md) ([US-7](./user-stories/US-7-dashboard-experience.md))

## 🏗️ Architecture & Refactoring
- [ ] [GRO-53: Refactor Folder Structure](./tickets/backlog/GRO-53-refactor-folder-structure.md) (Feature-Based Architecture)

## 🧊 Deferred / Future
*Items that are valid but not currently prioritized.*
- [ ] [GRO-22: In-Trip Section Reassignment](./tickets/backlog/GRO-22-in-trip-reassignment.md) ([US-4](./user-stories/US-4-in-trip-config.md))
- [ ] [GRO-19: Drag-and-Drop Sections](./tickets/backlog/GRO-19-drag-drop-sections.md) (Deprecated)

## ✅ Completed History (v1 Foundation)
*Previous work that established the current baseline.*
- [x] [GRO-1: Project Init](./tickets/done/GRO-1-init.md)
- [x] [GRO-2: Authentication](./tickets/done/GRO-2-auth.md)
- [x] [GRO-3: Store CRUD](./tickets/done/GRO-3-store-crud.md)
- [x] [GRO-4: Store Sections](./tickets/done/GRO-4-store-sections.md)
- [x] [GRO-5: Item Catalog](./tickets/done/GRO-5-item-catalog.md)
- [x] [GRO-6: Shopping Execution](./tickets/done/GRO-6-execution.md)
- [x] [GRO-7: Trip Completion](./tickets/done/GRO-7-trip-completion.md)
- [x] [GRO-8: Amounts & Units](./tickets/done/GRO-8-amounts-units.md)
- [x] [GRO-9: Archived Lists](./tickets/done/GRO-9-archived-lists.md)
- [x] [GRO-10: UI Polish](./tickets/done/GRO-10-ui-polish.md)
- [x] [GRO-11: Item Editing](./tickets/done/GRO-11-item-editing.md)
- [x] [GRO-12: Mobile UX](./tickets/done/GRO-12-mobile-ux.md)
