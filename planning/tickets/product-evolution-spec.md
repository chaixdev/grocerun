# Product Evolution Specification

> [!IMPORTANT]
> This document outlines the agreed-upon direction for the next evolution of Grocerun. It serves as the blueprint for future implementation tasks.

## 1. Core Philosophy
- **Mobile-First Utility:** Optimized for quick, one-handed usage in stores.
- **Responsive Transition:** Adapts to desktop via layout changes (Bottom Nav -> Sidebar).
- **State-Driven:** Clear distinction between Planning, Shopping, and Archived states.

## 2. Navigation Structure
**Mobile (Bottom Navigation):**
1.  **Lists** (Home/Active)
2.  **Stores** (Catalog/Manage)
3.  **Settings** (Account/Config)

**Desktop (Sidebar Navigation):**
- Vertical sidebar on the left containing the same three primary destinations.
- Two-column layout for content (e.g., List of Stores on left, Store Details on right).

## 3. Screen 1: Active Lists (Dashboard)
**Goal:** Immediate access to ongoing shopping tasks.

### Layout
- **Grouped by Household:**
    - Header: Household Name
    - Content: List of Active List Cards
- **List Cards:**
    - **Store Lists:** Title = Store Name. Subtitle = Item count / "Ready to shop".
    - **General List:** Title = "[Household] General List" (or similar). Distinct visual style. *Note: Primarily a holding area. Advanced features like "Move to Store" are stretch goals.*
- **Archived Section:**
    - Collapsible accordion at the bottom.
    - History of completed trips ("Date - Store Name").

### Interactions
- **Tap Card:** Opens **Planning Mode** for that list.
- **"Start Trip" / "Go Shopping" Button:** (On the card or within Planning Mode) Activates **Shopping Mode**.

## 4. Screen 2: Stores (Catalog)
**Goal:** Manage where you shop and configure store layouts.

### Layout
- **Grouped by Household:**
    - Header: Household Name + "Config" (Gear Icon) + "Add Store" (+)
    - Content: List of Store Cards
- **Store Cards:**
    - Title: Store Name
    - Subtitle: Location
    - **Primary Action:** "List" button.
        - *If Active List exists:* Navigates to it (Lists Screen).
        - *If No Active List:* Creates one and navigates to it.
    - **Secondary Action:** "Edit" (via menu or icon). Opens Store Configuration.

### Sub-Screens
- **Household Config:** Rename, Add Image, Manage Members (Invite/Remove).
- **Store Config:** Rename, Location, Image, **Section Management** (Add/Reorder sections like Produce, Dairy, etc.).

## 5. Screen 3: Settings
**Goal:** User preferences and account management.
- User Profile (Name, Pic).
- Theme Preference (Light/Dark).
- Household Management (Leave household).

## 6. The "Shopping" State Machine
The core value proposition relies on these three distinct states for a list. **Crucially, this state is global:** if one member starts shopping, the list enters Shopping Mode for all household members.

### A. Planning Mode (Default)
- **Context:** Preparing for a trip.
- **Actions:**
    - Add/Remove Items.
    - Edit Quantities/Units.
    - **Sorting:** Items are automatically sorted by Store Section upon addition.
    - *Disabled:* Checking off items.
- **Transition:** "Go Shopping" button -> Switches to **Shopping Mode**.

### B. Shopping Mode (In-Store)
- **Context:** Physically in the store. Focus on execution.
- **UI Changes:**
    - Large Checkboxes.
    - Auto-scroll to unchecked items.
    - Screen Wake Lock (prevent sleep).
    - **Fixed Order:** Item order is locked (cannot reorder manually).
- **Actions:**
    - Check/Uncheck items.
    - **Quantity Tracking:** Ability to distinguish "Planned Amount" vs "Bought Amount" (e.g., planned 2, bought 1).
    - "Cancel Shopping": Reverts to Planning Mode.
    - "Finish Shopping": Opens Summary/Confirmation.
- **Transition:** "Finish" -> Archives list -> Switches to **Archived Mode**.
- *Deferred:* In-store section configuration (teaching the app the layout while shopping) is a stretch goal.

### C. Archived Mode (History)
- **Context:** Reviewing past trips.
- **Actions:**
    - Read-only view of what was bought.
    - "Revive" or "Copy to New List" (potential future feature).

## 7. Technical Considerations
- **Viewport Detection:** Use CSS media queries and React hooks (`useMediaQuery`) to toggle between Bottom Nav and Sidebar.
- **State Management:** Database schema must support `status` enum on Lists (`PLANNING`, `SHOPPING`, `COMPLETED`).
