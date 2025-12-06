# GRO-IAM-alternatives: Support Alternative IAM Providers

## Problem
Currently, Grocerun relies exclusively on Google OAuth for authentication. This is a significant barrier for self-hosting users who:
1.  Do not want to rely on Google.
2.  Do not want to set up a Google Cloud Project.
3.  Want to use their own OIDC provider (Keycloak, Authentik) or simple Email/Password.

## Proposed Solution
Implement `next-auth` credentials provider or a generic OIDC provider.

### Requirements
- [ ] Add `CredentialsProvider` for Email/Password login.
- [ ] Add generic `OIDC` provider configuration.
- [ ] Update `auth.config.ts` to support multiple providers based on env vars.
- [ ] Create a registration flow (or disable registration for private instances).

## Acceptance Criteria
- User can log in with a username/password stored in the database.
- User can configure a custom OIDC provider via environment variables.
