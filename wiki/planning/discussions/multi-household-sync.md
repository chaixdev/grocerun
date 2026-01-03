# Technical Proposal: Multi-Household Sync (Strategy 2)

## 1. Overview
To achieve feature parity with the Legacy App, we must support users belonging to multiple households (M:N relationship). This introduces complexity into the Local-First Sync protocol, as the client must receive data for *all* households the user is a member of, while maintaining security boundaries.

## 2. Schema Design

### Prisma (Server)
We will replicate the Legacy Schema structure.

```prisma
model User {
  id         String      @id @default(cuid())
  email      String      @unique
  name       String?
  households Household[] // Implicit M:N
  ownedHouseholds Household[] @relation("HouseholdOwner")
  // ... auth fields
}

model Household {
  id    String @id @default(cuid())
  name  String
  users User[] // Implicit M:N
  
  ownerId String
  owner   User   @relation("HouseholdOwner", fields: [ownerId], references: [id])
  // ... other fields
}
```

### RxDB (Client)
The client needs to store the relationships. Since RxDB is NoSQL, we can't use implicit join tables easily. We will sync the `User` object with an array of `householdIds` (or a separate `HouseholdMember` collection if we need metadata like roles).

**Decision:** For Phase 1, we will denormalize.
*   `User` document will have `householdIds: string[]`.
*   `Household` document is standard.

## 3. Sync Protocol Updates

The current Sync Protocol (GRO-105) is a simple "Pull all items > minUpdatedAt". We need to scope this to the User's context.

### The "Sync Context"
When a user authenticates, the server identifies their `userId`.
The Sync Query must become:
*"Give me all documents where `householdId` is in `user.households` AND `updatedAt > checkpoint`."*

### Implementation Details

#### A. Server-Side (`ItemsService.pull`)
1.  **Auth Context:** The `pull` endpoint must be protected (Guard) and receive the `user` object.
2.  **Scope Resolution:**
    ```typescript
    // 1. Get user's households
    const userWithHouseholds = await prisma.user.findUnique({
      where: { id: userId },
      include: { households: true }
    });
    const householdIds = userWithHouseholds.households.map(h => h.id);

    // 2. Query Items
    const items = await prisma.item.findMany({
      where: {
        householdId: { in: householdIds }, // <--- CRITICAL CHANGE
        updatedAt: { gt: minUpdatedAt }
      }
    });
    ```

#### B. Client-Side (RxDB)
1.  **Replication:** The replication plugin doesn't need to change much. It just sends the JWT.
2.  **UI Filtering:**
    *   The UI needs a "Current Household" state (React Context).
    *   All queries to RxDB must include a selector: `.find({ selector: { householdId: currentHouseholdId } })`.

## 4. Migration Plan (GRO-110)

1.  **Update Prisma Schema:** Add `User` and `Household` with M:N relation.
2.  **Update RxDB Schema:** Add `user` and `household` collections.
3.  **Update Sync Service:** Modify `pull` to filter by `user.households`.
4.  **Update Client App:**
    *   Add `HouseholdProvider` to manage `activeHouseholdId`.
    *   Update `ResponsiveShell` to allow switching households (if > 1).

## 5. Security Implications
*   **Leakage:** We must ensure a user *never* receives data for a household they are not part of. The `householdId: { in: householdIds }` clause is the primary defense.
*   **Push Validation:** When pushing, we must verify the user is a member of the `householdId` they are writing to.

## 6. Conclusion
This approach achieves feature parity (M:N) without over-complicating the client-side DB topology. We sync "everything the user has access to" into one local DB, and filter at the View layer.
