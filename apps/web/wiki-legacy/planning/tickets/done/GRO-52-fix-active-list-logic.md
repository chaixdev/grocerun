# GRO-52: Fix "Start Shopping List" Logic

**Type**: 🐞 Bug  
**User Story**: [US-9: Shopping State Machine](../user-stories/US-9-shopping-state-machine.md)

## 🐛 The Issue
The "Start Shopping List" button on the Store Card incorrectly creates a new list every time it is clicked, even if an active list already exists for that store.

## 🔍 Root Cause Analysis
- The backend function `getActiveListForStore` queries explicitly for `status: "ACTIVE"`.
- However, new lists are created with the default status `PLANNING`.
- Therefore, the query returns `null`, and the frontend logic proceeds to create a new list.

## ✅ Acceptance Criteria
- [ ] **Backend**: Update `getActiveListForStore` to query for any list where `status != "COMPLETED"` (covering both `PLANNING` and future `SHOPPING` states).
- [ ] **Frontend**: If an active list exists, the button text should read "**Go To List**" instead of "Start Shopping List".
- [ ] **Frontend**: Clicking the button redirects to the existing active list instead of creating a duplicate.

## 🛠 Implementation Plan
1.  Modify `src/actions/list.ts`: Update Prisma query in `getActiveListForStore`.
2.  Modify `src/components/store-directory/StoreCard.tsx`: Update button label logic based on the return value.
