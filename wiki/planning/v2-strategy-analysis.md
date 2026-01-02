# V2 Development Strategy Analysis

## 1. Legacy Roadmap Review
The Legacy (v1) roadmap followed a **Feature-First** approach:
1.  **Shell & Identity:** Established the container (Nav, Auth, Settings) first.
2.  **Stores (Context):** Built the "places" where shopping happens.
3.  **Lists (Content):** Built the actual shopping lists and items.
4.  **Execution:** Built the "Shopping Mode".

**Why it worked:**
*   **Visual Progress:** We had a clickable app from Week 1.
*   **Logical Dependencies:** You can't create a list without a store. You can't create a store without a user.
*   **Contextual Learning:** We learned the UI patterns (Tailwind/Components) while building the Shell, which helped when building complex features like Lists.

## 2. Current V2 Roadmap Critique
The current V2 roadmap is structured **Horizontally (Layered)**:
1.  **Phase 1: Core Data:** Define *all* schemas (User, Store, Item, List) and sync logic.
2.  **Phase 2: Auth:** Implement security.
3.  **Phase 3: UI Shell:** Build the navigation and layout.
4.  **Phase 4: Features:** Connect UI to Data.

**Risks:**
*   **Waterfall Effect:** We might spend weeks on "Data" without seeing a single pixel.
*   **Context Switching:** Defining the `ListItem` schema (Phase 1) is mentally disconnected from building the `ListItem` UI (Phase 4).
*   **Integration Hell:** Connecting the UI (Phase 3) to the Data (Phase 1) might reveal schema flaws too late.
*   **Auth Blocking:** Sync relies on `HouseholdId`. Building "Data" without "Auth" requires hardcoding/mocking that might be painful to undo.

## 3. Architectural Constraints (Local-First)
In a Local-First architecture (RxDB + ElectricSQL/Sync):
*   **Schema is King:** Changing the schema later is harder (migrations).
*   **UI is a Function of Data:** The UI subscribes directly to the local DB.
*   **Coupling:** The "Feature" *is* the combination of the Schema, the Sync Rules, and the UI Component.

## 4. Proposed Strategy: Vertical Slices
We should revert to the **Legacy Order (Feature-First)** but adapted for **Local-First (Vertical Slices)**.

Instead of layers, we build **Domains**:

### 🟢 Phase 1: Identity & Shell (The Container)
*Goal: A working app where we can log in and navigate.*
*   **Data:** `User`, `Household` (Minimal schemas).
*   **Auth:** Basic Auth Flow (JWT/Session) to establish `HouseholdId`.
*   **UI:** App Shell, Sidebar, Bottom Nav, Settings Page.
*   **Outcome:** A deployable app that "works" but has no content.

### 🟡 Phase 2: Store Management (The Context)
*Goal: Manage the places we shop.*
*   **Data:** `Store`, `Section` schemas & sync.
*   **UI:** Store Directory, Store Cards, Store Configuration.
*   **Outcome:** Users can define their stores.

### 🟠 Phase 3: Planning Mode (The Core)
*Goal: Create lists and add items.*
*   **Data:** `CatalogItem`, `ShoppingList`, `ListItem` schemas & sync.
*   **UI:** Dashboard, List Creation, Autocomplete, Planning Mode.
*   **Outcome:** The core value proposition is functional.

### 🔴 Phase 4: Shopping Mode (The Execution)
*Goal: Execute the trip.*
*   **Data:** Optimistic updates, "Done" state logic.
*   **UI:** Large touch targets, Wake Lock, Trip Summary.

## 5. Recommendation
Rewrite the V2 Roadmap to reflect this **Vertical Slice** strategy. This aligns with the successful Legacy execution order while respecting the new architectural requirements.
