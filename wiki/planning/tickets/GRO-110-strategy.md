# GRO-110 Strategy Proposal: User & Household Domain

## Context
We need to define the `User` and `Household` models. There is a conflict between the Legacy Schema (Many-to-Many) and the Ticket Requirements (One-to-Many).

## Strategy 1: Simplified 1:N (Recommended)
**Description:** A User belongs to exactly **one** Household. The `User` table has a `householdId` foreign key.
**Fit:** Aligns perfectly with the Ticket GRO-110 requirements and simplifies the Local-First Sync protocol (1 User = 1 Sync Stream).
**Pros:**
*   Extremely simple Sync logic.
*   Clear ownership.
*   Matches the "Family/Household" mental model (you usually live in one place).
**Cons:**
*   Regression from Legacy: Users cannot belong to multiple households (e.g., "Home" and "Office").

## Strategy 2: Legacy M:N (Full Port)
**Description:** Replicate the Legacy schema where `User` and `Household` are connected via a many-to-many relation.
**Fit:** Matches the Legacy app exactly.
**Pros:**
*   No feature regression.
*   Flexible.
**Cons:**
*   **Sync Complexity:** The client would need to sync *multiple* households. RxDB would need to handle data from different contexts, or we'd need a "Switch Household" UI that tears down and rebuilds the DB.
*   Violates the current Ticket instructions.

## Strategy 3: Hybrid (Active Context)
**Description:** Support M:N in the schema, but enforce a single `activeHouseholdId` on the User for Sync purposes.
**Fit:** Future-proofs the schema while keeping the Sync simple for now.
**Pros:**
*   Allows future expansion to multiple households.
*   Keeps Sync simple (only sync the active one).
**Cons:**
*   Over-engineering for Phase 1.
*   Adds schema noise (`HouseholdMember` table) that isn't used yet.

## Recommendation
**Strategy 1**. The Local-First architecture is complex enough. Let's stick to the "One Household" constraint for V2.0 to ensure we ship a robust sync engine. We can migrate to Strategy 3 later if users demand it.
