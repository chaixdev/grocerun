# GRO-120: Authentication System

**User Story**: [US-100: Identity & Access](../user-stories/US-100-identity-access.md)
**Status**: TODO

## Context
Secure the application. We will use a simple JWT-based auth flow. Since we are Local-First, the "Login" process is essentially "Get a JWT to authorize the Sync Stream".

## Requirements
1.  **Backend**:
    -   `AuthService`: Validate credentials (mock/password for now).
    -   `JwtStrategy`: Protect API endpoints.
    -   `LoginController`: Endpoint to exchange credentials for Access Token.
2.  **Frontend**:
    -   `LoginPage`: Simple form (Email/Password).
    -   `AuthProvider`: React Context to hold the `token` and `user` state.
    -   **Sync Connection**: Pass the JWT to the RxDB replication plugin.
3.  **Guards**:
    -   Protect the `/pull` and `/push` endpoints.

## Acceptance Criteria
- [ ] User can log in via UI.
- [ ] JWT is stored securely (HttpOnly cookie or memory + refresh).
- [ ] RxDB replication fails without valid token.
- [ ] RxDB replication succeeds with valid token.
