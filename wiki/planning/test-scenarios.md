# Grocerun E2E Test Scenarios

**Version:** 1.0  
**Date:** 2026-01-10  
**Status:** Phase 2 Complete - Ready for Implementation

---

## Test Organization

Tests are organized by domain and priority:
- 🔴 **P0 (Critical)** - Core functionality, must pass for release
- 🟠 **P1 (High)** - Important features, should pass before deployment
- 🟡 **P2 (Medium)** - Secondary features, nice to have coverage
- 🟢 **P3 (Low)** - Edge cases, can be addressed later

---

## 1. Authentication & Authorization

### AUTH-001: User Login (P0 🔴)
**Description:** User can log in with valid credentials  
**Preconditions:** User account exists  
**Steps:**
1. Navigate to login page
2. Enter valid email and password
3. Click "Sign In"

**Expected:**
- Redirected to dashboard
- Session created
- User info displayed in header

---

### AUTH-002: Invalid Login (P0 🔴)
**Description:** Invalid credentials are rejected  
**Preconditions:** None  
**Steps:**
1. Navigate to login page
2. Enter invalid email/password
3. Click "Sign In"

**Expected:**
- Error message displayed
- Remains on login page
- No session created

---

### AUTH-003: Session Persistence (P1 🟠)
**Description:** User session persists across page refreshes  
**Preconditions:** User is logged in  
**Steps:**
1. Log in successfully
2. Refresh the page

**Expected:**
- User remains logged in
- Session data intact
- No redirect to login

---

### AUTH-004: Logout (P1 🟠)
**Description:** User can log out  
**Preconditions:** User is logged in  
**Steps:**
1. Click user menu
2. Click "Logout"

**Expected:**
- Session destroyed
- Redirected to login page
- Cannot access protected routes

---

### AUTH-005: Unauthorized API Access (P0 🔴)
**Description:** API rejects requests without valid JWT  
**Preconditions:** None  
**Steps:**
1. Make API request without Authorization header
2. Make API request with invalid JWT

**Expected:**
- 401 Unauthorized response
- Error message returned
- No data leaked

---

### AUTH-006: Protected Route Access (P0 🔴)
**Description:** Unauthenticated users redirected from protected routes  
**Preconditions:** User not logged in  
**Steps:**
1. Navigate to /stores
2. Navigate to /lists
3. Navigate to /settings

**Expected:**
- Redirected to /login for all
- Original URL preserved for post-login redirect

---

## 2. Household Management

### HOUSE-001: First-Time User Onboarding (P0 🔴)
**Description:** New user creates first household  
**Preconditions:** User logged in, no households  
**Steps:**
1. Navigate to /stores
2. See "Create My Household" prompt
3. Click "Create My Household"

**Expected:**
- Household created with name "My Household"
- User is owner
- Redirected to stores page
- Can now create stores

---

### HOUSE-002: Create Additional Household (P1 🟠)
**Description:** User creates second household  
**Preconditions:** User has 1+ households  
**Steps:**
1. Navigate to Settings → Households
2. Click "Create Household"
3. Enter name "Work Household"
4. Submit

**Expected:**
- New household created
- User is owner
- Appears in household list
- Can switch between households

---

### HOUSE-003: Rename Household (P1 🟠)
**Description:** Owner renames household  
**Preconditions:** User is household owner  
**Steps:**
1. Navigate to Settings → Households
2. Click edit on household
3. Change name to "Family Shopping"
4. Save

**Expected:**
- Household name updated
- Changes reflected across app
- Other members see new name

---

### HOUSE-004: Rename Household - Non-Owner (P1 🟠)
**Description:** Non-owner cannot rename household  
**Preconditions:** User is household member, not owner  
**Steps:**
1. Navigate to Settings → Households
2. Attempt to edit household name

**Expected:**
- Edit disabled or error shown
- "Only the owner can rename" message
- No changes made

---

### HOUSE-005: Leave Household (P1 🟠)
**Description:** Member leaves household  
**Preconditions:** User is member of 2+ households  
**Steps:**
1. Navigate to Settings → Households
2. Click "Leave" on a household
3. Confirm action

**Expected:**
- Removed from household
- No longer see household's stores
- Other members unaffected

---

### HOUSE-006: Leave Household - Owner Blocked (P1 🟠)
**Description:** Owner cannot leave their household  
**Preconditions:** User is household owner  
**Steps:**
1. Navigate to Settings → Households
2. Try to leave owned household

**Expected:**
- Error: "Owners cannot leave their own household"
- Suggestion to delete instead
- No changes made

---

### HOUSE-007: Delete Household (P1 🟠)
**Description:** Owner deletes empty household  
**Preconditions:** User is owner, household has 1 member (owner only)  
**Steps:**
1. Navigate to Settings → Households
2. Click "Delete" on household
3. Confirm deletion

**Expected:**
- Household deleted
- All associated stores/lists deleted
- User removed from household

---

### HOUSE-008: Delete Household - Multiple Members (P1 🟠)
**Description:** Cannot delete household with other members  
**Preconditions:** Household has 2+ members  
**Steps:**
1. Navigate to Settings → Households
2. Try to delete household

**Expected:**
- Error: "Cannot delete household with other members"
- Instruction to remove members first
- No deletion occurs

---

## 3. Invitation System

### INV-001: Create Invitation (P1 🟠)
**Description:** Member creates invitation link  
**Preconditions:** User is household member  
**Steps:**
1. Navigate to Settings → Households
2. Click "Invite" on a household
3. Copy invitation link

**Expected:**
- 8-character token generated
- Expiration time shown (7 days)
- Link copyable
- Token stored in database

---

### INV-002: Join via Invitation (P0 🔴)
**Description:** New member joins via invitation link  
**Preconditions:** Valid invitation exists, user logged in  
**Steps:**
1. Navigate to invitation URL
2. See household name and owner info
3. Click "Join Household"

**Expected:**
- User added to household
- Invitation marked COMPLETED
- Redirected to household's stores
- Access to household data

---

### INV-003: Join - Already Member (P2 🟡)
**Description:** Existing member cannot rejoin  
**Preconditions:** User already in household  
**Steps:**
1. Navigate to invitation URL for current household

**Expected:**
- Error: "You are already a member"
- No duplicate membership created
- Invitation remains ACTIVE

---

### INV-004: Join - Expired Invitation (P1 🟠)
**Description:** Expired invitation rejected  
**Preconditions:** Invitation created >7 days ago  
**Steps:**
1. Navigate to old invitation URL
2. Try to join

**Expected:**
- Error: "This invitation has expired"
- Invitation marked EXPIRED
- User not added

---

### INV-005: Revoke Invitation (P1 🟠)
**Description:** Member revokes active invitation  
**Preconditions:** Active invitation exists  
**Steps:**
1. Navigate to Settings → Households
2. View active invitations
3. Click "Revoke" on invitation

**Expected:**
- Invitation marked REVOKED
- Link no longer works
- Removed from active list

---

### INV-006: Invitation Rate Limiting (P2 🟡)
**Description:** Rate limit prevents spam  
**Preconditions:** User logged in  
**Steps:**
1. Create 6 invitations rapidly

**Expected:**
- First 5 succeed
- 6th request rejected with rate limit error
- Can retry after 60 seconds

---

## 4. Store Management

### STORE-001: Create First Store (P0 🔴)
**Description:** User creates first store in household  
**Preconditions:** User has household, no stores  
**Steps:**
1. Navigate to /stores
2. Click "Add Store"
3. Enter name "Walmart" and location "123 Main St"
4. Submit

**Expected:**
- Store created
- Appears in store list
- Can be selected
- Linked to household

---

### STORE-002: Create Multiple Stores (P1 🟠)
**Description:** Create multiple stores in same household  
**Preconditions:** Household exists  
**Steps:**
1. Create store "Walmart"
2. Create store "Target"
3. Create store "Costco"

**Expected:**
- All 3 stores visible
- Ordered by creation date (newest first)
- Each independently accessible

---

### STORE-003: Update Store Details (P1 🟠)
**Description:** Edit store name and location  
**Preconditions:** Store exists  
**Steps:**
1. Navigate to store settings
2. Change name to "Walmart Supercenter"
3. Update location to "456 Oak Ave"
4. Save

**Expected:**
- Store info updated
- Changes reflected immediately
- Other household members see updates

---

### STORE-004: Delete Store (P1 🟠)
**Description:** Delete store and all related data  
**Preconditions:** Store exists  
**Steps:**
1. Navigate to store settings
2. Click "Delete Store"
3. Confirm deletion

**Expected:**
- Store deleted
- All sections deleted
- All items deleted
- All lists deleted
- User redirected to stores page

---

### STORE-005: Store Access - Household Member (P0 🔴)
**Description:** All household members can access stores  
**Preconditions:** 2+ users in household, store exists  
**Steps:**
1. User A creates store
2. User B (same household) navigates to /stores

**Expected:**
- User B sees store
- User B can access store
- User B can create lists

---

### STORE-006: Store Access - Different Household (P0 🔴)
**Description:** Users from different households cannot access each other's stores  
**Preconditions:** 2 households, each with stores  
**Steps:**
1. User A creates store in Household 1
2. User B (Household 2 only) tries to access store by ID

**Expected:**
- 403 Forbidden or 404 Not Found
- No store data leaked
- User B cannot see store

---

## 5. Section Management

### SECT-001: Create Section (P1 🟠)
**Description:** Add section to store  
**Preconditions:** Store exists  
**Steps:**
1. Navigate to store settings
2. Click "Add Section"
3. Enter name "Produce"
4. Submit

**Expected:**
- Section created
- Added to end of section list
- Available for item categorization

---

### SECT-002: Reorder Sections (P1 🟠)
**Description:** Drag sections to reorder  
**Preconditions:** Store has 3+ sections  
**Steps:**
1. Navigate to store settings → Sections
2. Drag "Dairy" above "Produce"
3. Save order

**Expected:**
- Section order updated
- New order persisted
- Reflects in item lists

---

### SECT-003: Rename Section (P1 🟠)
**Description:** Update section name  
**Preconditions:** Section exists  
**Steps:**
1. Navigate to store settings
2. Click edit on "Produce"
3. Change to "Fruits & Vegetables"
4. Save

**Expected:**
- Section name updated
- All items still associated
- Changes visible immediately

---

### SECT-004: Delete Empty Section (P1 🟠)
**Description:** Delete section with no items  
**Preconditions:** Section exists with 0 items  
**Steps:**
1. Navigate to store settings
2. Click delete on section
3. Confirm

**Expected:**
- Section deleted
- No longer in section list
- Store unaffected

---

### SECT-005: Delete Section with Items (P2 🟡)
**Description:** Delete section that has items  
**Preconditions:** Section has items assigned  
**Steps:**
1. Navigate to store settings
2. Try to delete section with items

**Expected:**
- Warning shown about items
- Items become uncategorized (sectionId = null) OR
- Deletion prevented until items moved

---

## 6. Item Management

### ITEM-001: Add Item with Section (P0 🔴)
**Description:** Add categorized item to list  
**Preconditions:** List exists, sections configured  
**Steps:**
1. Open shopping list
2. Type "Tomatoes" in add item field
3. Select "Produce" section
4. Click Add

**Expected:**
- Item created in catalog
- Item added to list
- Linked to section
- Appears in list grouped by section

---

### ITEM-002: Add Item without Section (P1 🟠)
**Description:** Add uncategorized item  
**Preconditions:** List exists  
**Steps:**
1. Open shopping list
2. Type "Random Item"
3. Select "Uncategorized" or skip section
4. Click Add

**Expected:**
- Item created with sectionId = null
- Item added to list
- Appears in "Uncategorized" group

---

### ITEM-003: Add Existing Item (P1 🟠)
**Description:** Add item that's already in catalog  
**Preconditions:** Item "Milk" exists in catalog  
**Steps:**
1. Open shopping list
2. Start typing "Mil"
3. See "Milk" in suggestions
4. Click suggestion

**Expected:**
- Existing item reused (not duplicated)
- Item added to list
- Previous section/unit preserved

---

### ITEM-004: Item Already in List (P1 🟠)
**Description:** Cannot add duplicate to same list  
**Preconditions:** Item "Bread" already on list  
**Steps:**
1. Open shopping list
2. Try to add "Bread" again

**Expected:**
- Error: "Already on list" OR
- Message: "Already added"
- No duplicate created
- Can modify quantity instead

---

### ITEM-005: Item Search (P1 🟠)
**Description:** Search items in catalog  
**Preconditions:** Store has 10+ items in catalog  
**Steps:**
1. Open shopping list
2. Type "tom" in search
3. View suggestions

**Expected:**
- Matching items shown ("Tomatoes", "Tomato Sauce")
- Ordered by purchase count (popular first)
- Max 10 results
- Fast response (<200ms)

---

### ITEM-006: Update Item Details (P1 🟠)
**Description:** Edit item name and section  
**Preconditions:** Item exists in catalog  
**Steps:**
1. Navigate to item in catalog/list
2. Edit name from "Milk" to "Whole Milk"
3. Change section to "Dairy"
4. Save

**Expected:**
- Item updated in catalog
- All lists with this item reflect changes
- Purchase history preserved

---

### ITEM-007: Top Items Suggestion (P2 🟡)
**Description:** Show frequently purchased items  
**Preconditions:** Store has purchase history  
**Steps:**
1. Open new shopping list
2. View top items section

**Expected:**
- Shows 5 most purchased items (purchaseCount ≥ 1)
- Ordered by purchaseCount descending
- One-click add to list

---

## 7. Shopping List Workflow

### LIST-001: Create Shopping List (P0 🔴)
**Description:** Start new shopping list  
**Preconditions:** Store exists  
**Steps:**
1. Navigate to store page
2. Click "New List" or "Start Shopping"

**Expected:**
- List created in PLANNING status
- Empty item list
- Named "Shopping List" (default)
- Can add items

---

### LIST-002: Create List - Auto-Resume (P1 🟠)
**Description:** Reuse existing incomplete list  
**Preconditions:** Store has list in PLANNING status  
**Steps:**
1. Navigate to store
2. Try to create new list

**Expected:**
- Existing list resumed instead
- No duplicate list created
- Message: "Continuing your list"

---

### LIST-003: Add Item to List (P0 🔴)
**Description:** Add item with quantity and unit  
**Preconditions:** List in PLANNING status  
**Steps:**
1. Open list
2. Search for "Eggs"
3. Set quantity to 2
4. Set unit to "dozen"
5. Add to list

**Expected:**
- Item added with quantity 2, unit "dozen"
- Appears in list
- Catalog updated with defaultUnit

---

### LIST-004: Update Item Quantity (P1 🟠)
**Description:** Change quantity of list item  
**Preconditions:** Item on list  
**Steps:**
1. Open list
2. Click on "2 dozen Eggs"
3. Change to "3 dozen"
4. Save

**Expected:**
- Quantity updated to 3
- Unit preserved
- Changes saved immediately

---

### LIST-005: Remove Item from List (P1 🟠)
**Description:** Delete item from list  
**Preconditions:** Item on list  
**Steps:**
1. Open list
2. Swipe or click delete on item
3. Confirm

**Expected:**
- Item removed from list
- Item remains in catalog
- List total updated

---

### LIST-006: Start Shopping (P0 🔴)
**Description:** Transition list to shopping mode  
**Preconditions:** List in PLANNING status with items  
**Steps:**
1. Open list
2. Click "Start Shopping"

**Expected:**
- List status changes to SHOPPING
- Items organized by section
- Can check off items
- Cannot add new items (optional UX decision)

---

### LIST-007: Check Off Items (P0 🔴)
**Description:** Mark items as purchased  
**Preconditions:** List in SHOPPING status  
**Steps:**
1. Open shopping list
2. Tap checkbox on "Milk"
3. Tap checkbox on "Bread"

**Expected:**
- Items marked isChecked: true
- purchasedQuantity = quantity (default)
- Visual indication (strikethrough, move to bottom)
- Progress counter updated

---

### LIST-008: Adjust Purchased Quantity (P2 🟡)
**Description:** Override purchased quantity  
**Preconditions:** List in SHOPPING status  
**Steps:**
1. Tap "2 dozen Eggs"
2. Change purchased quantity to 1
3. Check off

**Expected:**
- isChecked: true
- purchasedQuantity: 1 (not 2)
- Quantity difference visible

---

### LIST-009: Uncheck Item (P1 🟠)
**Description:** Uncheck previously checked item  
**Preconditions:** Item is checked  
**Steps:**
1. Open shopping list
2. Tap checkbox on checked item

**Expected:**
- isChecked: false
- purchasedQuantity preserved
- Item moves back to unchecked section
- Progress counter updated

---

### LIST-010: Complete Shopping (P0 🔴)
**Description:** Finish shopping and update catalog  
**Preconditions:** List in SHOPPING status  
**Steps:**
1. Check off desired items
2. Click "Complete Shopping"
3. Confirm

**Expected:**
- List status changes to COMPLETED
- Checked items: purchaseCount += 1, lastPurchased updated
- List becomes read-only
- Redirected to store or new list

---

### LIST-011: Cancel Shopping (P1 🟠)
**Description:** Return to planning mode  
**Preconditions:** List in SHOPPING status  
**Steps:**
1. During shopping, click "Cancel Shopping"

**Expected:**
- List status returns to PLANNING
- All check states preserved
- Can add/remove items again
- No catalog updates

---

### LIST-012: View Completed List (P2 🟡)
**Description:** Review past shopping trip  
**Preconditions:** Completed list exists  
**Steps:**
1. Navigate to store
2. View completed lists
3. Open a completed list

**Expected:**
- Read-only view
- Shows checked/unchecked items
- Shows purchasedQuantity vs planned
- Completion date/time

---

### LIST-013: Edit List During Planning (P1 🟠)
**Description:** Modify list before shopping  
**Preconditions:** List in PLANNING status  
**Steps:**
1. Add 5 items
2. Remove 2 items
3. Update quantities on 2 items
4. Start shopping

**Expected:**
- All changes saved
- Shopping mode shows correct items
- No data loss

---

## 8. User Profile

### PROFILE-001: Update Profile Name (P2 🟡)
**Description:** Change display name  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings → Profile
2. Change name to "John Smith"
3. Save

**Expected:**
- Name updated in database
- Reflected in UI (header, settings)
- Other users see updated name

---

### PROFILE-002: Update Profile Image (P2 🟡)
**Description:** Upload avatar  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings → Profile
2. Upload image file
3. Save

**Expected:**
- Image stored
- Avatar displayed in header
- Image URL saved to profile

---

### PROFILE-003: Invalid Image Upload (P2 🟡)
**Description:** Reject invalid file types  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings → Profile
2. Try to upload .exe or .pdf

**Expected:**
- Error: "Invalid file type"
- Only images accepted
- No changes saved

---

## 9. Dashboard & Overview

### DASH-001: Household Overview (P1 🟠)
**Description:** View household summary  
**Preconditions:** User in household with data  
**Steps:**
1. Navigate to /lists (dashboard)

**Expected:**
- See household name
- Count of stores
- Count of active lists
- Count of completed lists
- Quick links to stores

---

### DASH-002: Empty State - No Households (P1 🟠)
**Description:** New user sees onboarding  
**Preconditions:** No households  
**Steps:**
1. Navigate to /stores or /lists

**Expected:**
- "Create My Household" prompt
- Clear instructions
- One-click household creation

---

### DASH-003: Empty State - No Stores (P1 🟠)
**Description:** Household with no stores  
**Preconditions:** Household exists, no stores  
**Steps:**
1. Navigate to /stores

**Expected:**
- "Add your first store" prompt
- Create store button
- Clear UX guidance

---

## 10. Edge Cases & Error Handling

### EDGE-001: Concurrent List Editing (P2 🟡)
**Description:** Two users edit same list simultaneously  
**Preconditions:** 2 users, 1 shared list  
**Steps:**
1. User A adds "Milk"
2. User B adds "Bread" at same time
3. Both save

**Expected:**
- Both items appear
- No data loss
- Last write wins OR optimistic updates

---

### EDGE-002: Network Offline (P3 🟢)
**Description:** Handle offline scenario  
**Preconditions:** User logged in  
**Steps:**
1. Open list
2. Disable network
3. Try to add item

**Expected:**
- Error: "No network connection"
- Changes queued (if offline support) OR
- Clear error message
- Graceful degradation

---

### EDGE-003: Invalid Store ID (P2 🟡)
**Description:** Access non-existent store  
**Preconditions:** None  
**Steps:**
1. Navigate to /stores/invalid-id-123

**Expected:**
- 404 Not Found page
- Error: "Store not found"
- Link to stores page

---

### EDGE-004: Deleted Store - Active List (P2 🟡)
**Description:** What happens to lists when store deleted  
**Preconditions:** Store with active list  
**Steps:**
1. Create list in store
2. Delete store

**Expected:**
- List deleted (cascade)
- User warned before store deletion
- No orphaned data

---

### EDGE-005: Large Item List (P2 🟡)
**Description:** Performance with 100+ items  
**Preconditions:** None  
**Steps:**
1. Add 100 items to list
2. Start shopping
3. Check off items

**Expected:**
- UI remains responsive
- Load time <1s
- Smooth scrolling
- No UI freezing

---

### EDGE-006: Special Characters in Names (P2 🟡)
**Description:** Handle Unicode and special chars  
**Preconditions:** None  
**Steps:**
1. Create store named "Café & Market"
2. Add item "Crème Brûlée"
3. Create household "家庭"

**Expected:**
- All characters stored correctly
- No encoding errors
- Display correctly in UI

---

### EDGE-007: XSS Protection (P0 🔴)
**Description:** Prevent script injection  
**Preconditions:** None  
**Steps:**
1. Create item named `<script>alert('XSS')</script>`
2. Create store with malicious name

**Expected:**
- Scripts not executed
- Content escaped/sanitized
- No alerts or JS execution

---

### EDGE-008: SQL Injection Protection (P0 🔴)
**Description:** Prevent SQL injection  
**Preconditions:** None  
**Steps:**
1. Search for items: `' OR '1'='1`
2. Create store: `'; DROP TABLE Store; --`

**Expected:**
- Input treated as literal string
- No SQL errors
- No data corruption
- Prisma ORM prevents injection

---

## 11. API-Specific Tests

### API-001: JWT Validation (P0 🔴)
**Description:** API validates JWT tokens  
**Test Type:** Direct API call  
**Steps:**
1. GET /stores without Authorization header
2. GET /stores with invalid JWT
3. GET /stores with expired JWT

**Expected:**
- All return 401 Unauthorized
- Error messages clear
- No data leaked

---

### API-002: Input Validation - Missing Fields (P0 🔴)
**Description:** Validate class-validator DTOs  
**Test Type:** Direct API call  
**Steps:**
1. POST /stores with missing `householdId`
2. POST /lists with missing `storeId`
3. PATCH /items/:id with empty `name`

**Expected:**
- 400 Bad Request
- Validation error details
- Field-level error messages

---

### API-003: Input Validation - Type Errors (P1 🟠)
**Description:** Validate data types  
**Test Type:** Direct API call  
**Steps:**
1. POST /lists/items/add with quantity: "abc"
2. POST /sections/reorder with orderedIds: "not-an-array"

**Expected:**
- 400 Bad Request
- Type error messages
- No server crashes

---

### API-004: Rate Limiting (P1 🟠)
**Description:** Rate limiter blocks spam  
**Test Type:** Direct API call  
**Steps:**
1. POST /invitations 6 times rapidly

**Expected:**
- First 5 succeed (201)
- 6th returns 429 Too Many Requests
- Retry-After header present

---

### API-005: Authorization - Cross-Household (P0 🔴)
**Description:** Cannot access other household's data  
**Test Type:** Direct API call  
**Steps:**
1. User A gets storeId from Household 1
2. User B (Household 2) tries GET /stores/{storeId}

**Expected:**
- 403 Forbidden or 404 Not Found
- No data leaked
- Error message clear

---

### API-006: CORS Headers (P1 🟠)
**Description:** CORS configured correctly  
**Test Type:** Direct API call  
**Steps:**
1. OPTIONS request to /stores from WEB_URL origin
2. OPTIONS request from random origin

**Expected:**
- WEB_URL allowed
- Random origin rejected
- Proper headers (Access-Control-Allow-Origin)

---

### API-007: Error Response Format (P1 🟠)
**Description:** Consistent error structure  
**Test Type:** Direct API call  
**Steps:**
1. Trigger 400, 401, 403, 404, 500 errors
2. Check response structure

**Expected:**
- Consistent JSON format
- { statusCode, message, error } structure
- No stack traces in production

---

### API-008: Response Time (P2 🟡)
**Description:** API performance  
**Test Type:** Direct API call  
**Steps:**
1. GET /household-overview
2. GET /stores
3. GET /lists/:id

**Expected:**
- Simple reads: <50ms
- Complex queries: <200ms
- Mutations: <100ms
- No timeouts

---

## 12. Performance Tests

### PERF-001: Page Load Times (P1 🟠)
**Description:** Fast initial page load  
**Steps:**
1. Navigate to /stores
2. Navigate to /lists/:id
3. Navigate to /settings

**Expected:**
- FCP <1.5s
- LCP <2.5s
- TTI <3.5s
- No layout shift

---

### PERF-002: API Response Times (P1 🟠)
**Description:** Fast API responses  
**Steps:**
1. Measure 10 API calls to each endpoint

**Expected:**
- p50 <50ms
- p95 <200ms
- p99 <500ms
- No timeouts

---

### PERF-003: Database Query Performance (P2 🟡)
**Description:** Efficient database queries  
**Steps:**
1. Check query logs
2. Identify N+1 queries
3. Monitor slow queries (>100ms)

**Expected:**
- No N+1 queries
- Proper indexes used
- JOIN queries optimized

---

## 13. Security Tests

### SEC-001: Password Security (P0 🔴)
**Description:** Passwords hashed and salted  
**Steps:**
1. Create user account
2. Check database

**Expected:**
- Password never stored plaintext
- Bcrypt/Argon2 hash present
- Salt unique per user

---

### SEC-002: Session Security (P0 🔴)
**Description:** Secure session handling  
**Steps:**
1. Login and get session token
2. Inspect token

**Expected:**
- httpOnly cookie
- Secure flag (HTTPS)
- SameSite: Lax or Strict
- Expiration set

---

### SEC-003: CSRF Protection (P1 🟠)
**Description:** CSRF tokens validated  
**Steps:**
1. Make POST request without CSRF token
2. Make POST with invalid token

**Expected:**
- Request rejected
- 403 Forbidden
- Error message clear

---

## Test Execution Plan

### Phase 1: Critical Path (P0 Tests) - Est: 3-4 hrs
- Authentication (AUTH-001, 002, 005, 006)
- Store access (STORE-001, 005, 006)
- Shopping workflow (LIST-001, 003, 006, 007, 010)
- Security (XSS, SQL injection, JWT, authorization)

### Phase 2: Core Features (P1 Tests) - Est: 4-5 hrs
- Household management (5 tests)
- Invitations (4 tests)
- Store/Section/Item CRUD (8 tests)
- List lifecycle (6 tests)
- API validation (5 tests)

### Phase 3: Edge Cases (P2 Tests) - Est: 3-4 hrs
- Error handling (7 tests)
- Performance (3 tests)
- Concurrent editing (1 test)
- Top items/search (2 tests)

### Phase 4: Nice-to-Have (P3 Tests) - Est: 1-2 hrs
- Offline handling
- Profile updates
- Advanced edge cases

---

## Coverage Matrix

| Domain | Total Scenarios | P0 | P1 | P2 | P3 |
|--------|----------------|----|----|----|----|
| Authentication | 6 | 4 | 2 | 0 | 0 |
| Households | 8 | 0 | 7 | 1 | 0 |
| Invitations | 6 | 1 | 3 | 2 | 0 |
| Stores | 6 | 2 | 3 | 1 | 0 |
| Sections | 5 | 0 | 4 | 1 | 0 |
| Items | 7 | 1 | 4 | 2 | 0 |
| Lists | 13 | 4 | 5 | 4 | 0 |
| Profile | 3 | 0 | 0 | 3 | 0 |
| Dashboard | 3 | 0 | 3 | 0 | 0 |
| Edge Cases | 8 | 2 | 0 | 5 | 1 |
| API Tests | 8 | 3 | 4 | 1 | 0 |
| Performance | 3 | 0 | 2 | 1 | 0 |
| Security | 3 | 2 | 1 | 0 | 0 |
| **TOTAL** | **79** | **19** | **38** | **21** | **1** |

---

## Success Criteria

✅ **All P0 tests pass** - Core functionality working  
✅ **90%+ P1 tests pass** - Important features validated  
✅ **Test suite runs in <5 minutes** - Fast feedback  
✅ **<5% flakiness rate** - Reliable results  
✅ **Zero critical bugs in tested flows** - Quality gate

---

## Related Documents

- [ADR 005: E2E Testing with Cypress](../adr/005-e2e-testing-with-cypress.md)
- [Product Evolution Spec](./product-evolution-spec.md)
- [Phase 2 Migration Plan](./PHASE-2-MIGRATION.md)
