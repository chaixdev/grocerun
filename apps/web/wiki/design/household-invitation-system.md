# Design: Household Invitation System (Token-Based)

## 1. Overview
To simplify household onboarding without maintaining a mail server (KISS/YAGNI), we will implement a **Token-Based Invitation System**. 

**Flow:**
1.  **Sender** (Household Member) generates a secure, short-lived token.
2.  **Sender** shares this token (or a deep link) via their preferred channel (WhatsApp, Signal, SMS).
3.  **Receiver** enters the token in the Grocerun app to join the household.

## 2. User Experience (UX)

### Sender Flow
1.  Navigate to **Settings > Households**.
2.  Select a Household.
3.  Click **"Invite Member"**.
4.  **System**: Generates a unique code (e.g., `GRO-8X29-M4K1`).
5.  **UI**: Displays the code with a "Copy" button and a "Share" button (using Web Share API if available).
    *   *Text*: "Join my household on Grocerun! Use code: GRO-8X29-M4K1"

### Receiver Flow
1.  Navigate to **Settings > Households**.
2.  Click **"Join Household"**.
3.  **UI**: Input field for "Invitation Code".
4.  **Action**: User pastes code and clicks "Join".
5.  **System**: Validates code. If valid, adds user to household and redirects to Household view.
6.  **Feedback**: "Successfully joined [Household Name]!"

## 3. Security Considerations

### Token Entropy
*   **Format**: Alphanumeric, case-insensitive for easy typing/copying.
*   **Length**: 8-12 characters (excluding confusing chars like I/l, O/0).
*   **Collision Risk**: Negligible for short-lived tokens.

### Expiration & Usage
*   **TTL (Time To Live)**: 24 hours.
*   **Usage Limit**: **Strictly One-time use**. Once a user joins, the token is invalidated immediately.
    *   *Security*: Maximizes security. If a token is intercepted after use, it is useless.
    *   *UX*: If inviting multiple people, the sender must generate a unique token for each person.

### Scope & Validation
*   Token is bound to a specific `householdId`.
*   Token stores `createdBy` userId for audit.
*   **Rate Limiting**: Prevent brute-force guessing of tokens on the "Join" endpoint.

## 4. Technical Implementation

### Database Schema
New model `Invitation`:
```prisma
model Invitation {
  id          String   @id @default(cuid())
  token       String   @unique // The user-facing code
  householdId String
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  creatorId   String
  creator     User     @relation(fields: [creatorId], references: [id])
  status      String   @default("ACTIVE") // ACTIVE, EXPIRED, REVOKED, COMPLETED
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([token])
}
```
*Note: Removed `maxUses` and `usedCount` as we are enforcing single-use.*

### API / Server Actions
1.  `createInvitation(householdId)`: 
    *   Checks if user is admin/member.
    *   Generates token.
    *   Saves to DB with `expiresAt = now() + 24h`.
2.  `joinHousehold(token)`:
    *   Finds invitation by token.
    *   Checks `expiresAt > now()` and `status == ACTIVE`.
    *   Adds `currentUser` to `household.users`.
    *   Sets `status = COMPLETED`.

## 5. Industry Best Practices
*   **Deep Links**: Support `https://grocerun.app/join?code=XYZ` for one-click joining.
*   **Confirmation Screen**: Before joining, show "You are joining 'Smith Family' created by 'John'". Prevents phishing/accidental joins.
*   **Revocation**: Allow sender to see active invites and revoke them.

## 6. Recommendation for MVP
*   **Token**: 8-char alphanumeric.
*   **Validity**: 24 hours, **Single Use**.
*   **UI**: Copy-paste code.
*   **Security**: Rate limit the `join` action.
