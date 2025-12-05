# 🛍️ Grocerun: Smart Shopping List App - Product Vision

**Core Value Proposition:** Grocerun transforms chaotic grocery runs into organized, efficient trips by leveraging user history and customizable store layouts. It saves users time, money, and frustration, and crucially, **enables seamless household collaboration.**

## 💡 Feature Brainstorm (User/Product Owner Perspective)

### 1. ⚙️ Core Setup & Management (The Foundation)

| **Feature**                                 | **Description**                                                                                                                                  | **PO Rationale/User Benefit**                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **User Authentication (Google/OAuth)**      | **Simplified Single Sign-On (SSO)** via Google. Users sign up/in instantly using their existing, trusted accounts.                               | **Must-have.** Outsourcing password management is secure and significantly improves user conversion. Allows for multi-device access. |
| **Store Management**                        | CRUD (Create, Read, Update, Delete) interface for defining stores (Name, Location/Address optional).                                             | Supports the **"multiple stores"** core requirement.                                                                                 |
| **Item Catalog/History**                    | A central list of all items ever bought, tied to the store where they were purchased.                                                            | The foundation for **historic data** and **easy list creation**.                                                                     |
| **Store Configuration (Section Mapping)**   | A dedicated interface to define and manually reorder the sections within a _specific_ store (e.g., "Dairy," "Produce," "Aisle 4: Canned Goods"). | Addresses the core requirement to set the **store specific order** for efficient shopping.                                           |
| **List Collaboration Model (Shared Lists)** | Mechanism to invite other registered users (Editors) to a list via email. This list must support real-time updates for all collaborators.        | **Crucial for household use.** Reduces double-buying and allows multiple people to contribute to the list simultaneously.            |

### 2. ✅ The "Create List" Workflow (Planning & Sharing)

**Goal:** Quick, smart, and collaborative list generation tailored to a specific store.

- **Step 1: New List Creation & Store Selection**
    - User selects the **Store** the list is for (e.g., "Colruyt - Near Home").
    - **Sharing Option:** User can immediately search and add collaborators (Editors) by email address during creation.
    - _System automatically pulls in the Section Order defined for that store._         
        
- **Step 2: Adding Items (The Smart Way)**
    - **"Quick-Add from History" Tab:** A view showing items previously bought at the _selected store_, sorted by purchase frequency/recency. User taps to add.
    - **"My Usuals" Tab:** A filtered view of items bought 3+ times at this store (The **"historic list"** requirement).
    - **"General Search/Ad-hoc" Field:** A single, fast-typing search field to add new or one-off items not in the history.
        - _If the item is new:_ System prompts: "Which section does this belong to?" (Using the store's defined sections).
        - _If the item is known:_ System pre-populates the section.             

- **Step 3: List Review & Refinement**     
    - Items are automatically grouped under their designated **Store Section** (matching the store config).
    - **Collaborative Visibility:** Any changes made by an Editor (adding an item, changing quantity) are reflected for all other collaborators in real-time.
    - Drag-and-drop handles for **manually reordering** sections _for this specific list_ and items _within_ sections.
    - Optional: Add **Quantity** and **Notes** (e.g., "2 packs," "Only if it's on sale").
    - a pre-trip summary page with compact view of the list, + notes like don’t forget your reusable shopping bag and nets for fruits/veggies if the list requires
### 3. 🛒 The "Go Shopping" Workflow (Execution)

**Goal:** A frictionless, mobile-first experience that minimizes back-tracking, with real-time feedback for all users.
- **Mobile-Optimized View:** Large, easy-to-tap buttons and clear text (essential for use with gloves or one hand).
- **Automatic Sorting:** The list is **automatically sorted** according to the store's custom section order.
- **In-Store Check-off (Real-Time):**
    - Items are displayed by section.
    - A single tap on an item **checks it off**.
    - **Crucial:** When a user checks off an item, it is **instantly marked as purchased/completed** for all collaborators viewing the list (optimistic UI required).
    - _Visual cue:_ Completed items should subtly dim or move to the bottom of the section but **stay visible** for review.
    - **Floating "Next Section" button:** A prominent button at the bottom of the screen to quickly jump to the next planned section.
- **"Found All Items" Review:** Once all items are checked, a prompt appears: "**Ready to Checkout?**"
- **The Final Checklist (Post-Checkout):**     
    - A _brief_ screen showing:
        - "Did you get the reusable bags?"
        - "Did you check the receipt for errors?"
        - "Did you remember the special item from the notes?" (if any)            
- **Data Confirmation & History Update:**
    - On final confirmation by the shopper, the system executes the backend logic:
        - **Increments the purchase count** for every item on the list at that specific store.
        - If an item was _new/ad-hoc_, it is officially added to the Item Catalog/History for that store.

# tech stack

## 🎯 Project Goals and Core Learning Objectives

This exercise focuses on mastering the most common enterprise TypeScript architecture: **Monorepo, Structured Backend (NestJS), and Server-Side Rendering (Next.js)**.

### 1. Architectural & Tooling Mastery
1.  **Turborepo Monorepo:** Establish and manage the project using **Turborepo** to enforce separation between Core Domain, the BFF, and shared types.
2.  **End-to-End Type Safety:** Implement type validation from the database (Prisma) through the NestJS services and into the Next.js UI via the shared library.
3.  **Persistence Layer:** Master **Prisma** (ORM and integrated migration tool), implementing complex queries for history aggregation.

### 2. NestJS (Core Domain API) Focus
1.  **Advanced Data Modeling:** Translate the complex **Store, Section, Item, and Collaboration** relationships into a production-ready schema.
2.  **Complex Business Logic:** Implement business logic for **custom sorting** and **data aggregation** ("My Usuals").
3.  **Authentication as Resource Server:** Implement a secure, token-aware Core API that provisions users based on their Google ID.

### 3. Next.js (BFF & Presentation) Focus
1.  **BFF Pattern:** Use **Next.js Server Actions** as a **Backend For Frontend facade** to aggregate data and handle mutations, followed by cache invalidation.
2.  **Authentication Integration:** Implement **Google SSO** using Auth.js and securely pass the resulting session token to the protected NestJS Core API.
3.  **Optimistic UX (Simplified):** Implement logic to show immediate visual feedback on item check-off, followed by a **simple page or data refetch** to load the confirmed state from the backend.

---

## 🛠️ Technical Stack and Responsibilities

| Component | Framework/Tool | Role and Key Responsibilities |
| :--- | :--- | :--- |
| **Monorepo Manager** | **Turborepo** | Manages the workspaces and handles build caching across `server`, `client`, and `shared`. |
| **Core Domain API** | **NestJS** | **The Source of Truth.** Handles all persistent business logic, transactions, entity management, and custom sorting algorithms. |
| **Frontend/BFF** | **Next.js (App Router)** | **Presentation Layer & Facade.** Handles SSR, UI display, and uses Server Actions as the primary mutation mechanism. |
| **Authentication** | **Auth.js** (NextAuth) | Handles the secure Google SSO handshake and session management. |
| **Persistence** | **Prisma** (Mandatory) | ORM layer, schema definition, and integrated database migrations. |
| **Testing** | **Jest** | Unit testing for all NestJS Services and Repositories. |

