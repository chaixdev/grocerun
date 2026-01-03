# GRO-110 Technical Design: Multi-Household Support (Strategy 2)

## Goal
Achieve feature parity with the Legacy App by allowing a User to belong to multiple Households (M:N relationship) while maintaining a robust Local-First Sync architecture.

## 1. Data Model (Prisma)
We will replicate the Legacy Schema structure.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  // Relation to Join Table
  memberships HouseholdMember[]
}

model Household {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  // Relation to Join Table
  members   HouseholdMember[]
  // Domain Data
  stores    Store[]
}

// The Join Table
model HouseholdMember {
  id          String    @id @default(cuid())
  userId      String
  householdId String
  role        String    @default("MEMBER") // OWNER, ADMIN, MEMBER
  user        User      @relation(fields: [userId], references: [id])
  household   Household @relation(fields: [householdId], references: [id])

  @@unique([userId, householdId])
}
```

## 2. Client Architecture (RxDB)
To handle multiple households without data leakage or sync conflicts, we will use a **Single Database with Namespaced Sync**.

### A. Schema
All domain entities (`Store`, `Product`, `List`) in RxDB will have a `householdId` field.
*   This field is **Indexed**.
*   This field is **Immutable** (you can't move an item between households).

### B. The "Active Household" Concept
The UI will have a global `activeHouseholdId` state.
*   **Queries:** All UI queries will implicitly filter by `activeHouseholdId`.
    *   `myDatabase.items.find({ selector: { householdId: activeHouseholdId } })`

### C. Sync Protocol (The Critical Part)
We cannot use a single global sync stream because the "Checkpoint" (Last Modified Timestamp) is global, but a user might be up-to-date on Household A but behind on Household B.

**Solution: Per-Household Replication States**
We will instantiate a *separate* RxDB ReplicationState for *each* household the user belongs to (or just the active one).

1.  **Replication Key:** Instead of just `my-remote-db`, the replication identifier will be `my-remote-db-household-{ID}`.
2.  **API Request:**
    *   `GET /pull?checkpoint=...&householdId=...`
    *   `POST /push` (Body includes `householdId`)
3.  **Server Logic:**
    *   Middleware verifies `request.user.id` is a member of `query.householdId`.
    *   Query filters: `WHERE householdId = ? AND updatedAt > ?`.

## 3. Implementation Plan
1.  **Update Prisma Schema:** Add `HouseholdMember` model.
2.  **Update RxDB Schema:** Ensure `householdId` is present and indexed on all collections.
3.  **Update Sync Plugin:** Modify our custom sync hook to accept `householdId` and store checkpoints separately.
4.  **UI:** Build a "Household Switcher" in the Settings/Sidebar.

## 4. Trade-offs
*   **Complexity:** Higher than 1:N. We need to manage multiple sync streams.
*   **Performance:** Filtering every query by `householdId` is fast (with index) but non-zero cost.
*   **Security:** We must be extremely careful in the Backend Pull endpoint to ensure a user cannot request data for a `householdId` they are not a member of.

## Approval
This design achieves 100% feature parity with the Legacy App.
