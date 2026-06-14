# Dex Multi-Auth Pivot

**Status:** DEFERRED

## Summary

Explore Dex as a lightweight long-term pivot if Grocerun needs multi-provider authentication while preserving self-hosting simplicity. Dex would act as an optional OIDC broker in front of Google and other upstream identity providers, while Grocerun continues to own application users, household memberships, and roles.

## Problem

Direct Google OIDC keeps the default deployment simple, but it does not generalize cleanly to multiple providers. A full identity platform like Keycloak or Authentik may solve the architecture problem, but it conflicts with Grocerun's self-hosting goals by adding operational weight.

Dex may offer a middle path: one lightweight broker service, OIDC output to Grocerun, and configurable upstream providers without turning Grocerun into a BFF/session framework.

## Product Context

- Self-hostability is a core product constraint.
- The project intentionally started with SQLite rather than Postgres to minimize deployment burden.
- Requiring Keycloak, Authentik, or another full identity platform would make Grocerun harder to sell as a small self-hosted app.
- If multi-provider auth becomes a requirement, users should not have to run a large identity stack just to sign in with Google, GitHub, LDAP, or an existing OIDC provider.

## Technical Context

Potential target shape:

```text
Browser SPA -> oidc-spa -> Dex -> Google / GitHub / LDAP / upstream OIDC
Browser SPA -> Dex-issued token -> Grocerun API
Grocerun API -> validate Dex issuer/JWKS/audience -> local user + roles
```

Dex responsibilities:

- Act as the single OIDC issuer Grocerun trusts.
- Handle upstream provider redirects and provider-specific quirks.
- Issue tokens with stable subject, email/profile claims, and optional groups.
- Provide JWKS and OIDC discovery metadata.

Grocerun responsibilities:

- Validate Dex-issued tokens.
- Map `(issuer, subject)` to a local `User`.
- Store application roles and household memberships locally.
- Optionally map Dex groups to coarse instance-level permissions.

## Scope

- Evaluate Dex as an optional deployment mode, not as a required default dependency.
- Confirm whether `oidc-spa` works cleanly against Dex as a public SPA client.
- Confirm token claims, audience behavior, refresh behavior, and logout behavior.
- Draft a minimal Docker Compose recipe using Dex plus file/SQLite storage if acceptable for small self-hosted deployments.
- Validate Google connector behavior through Dex so the Google client secret stays in Dex config, not the browser bundle.
- Define how Grocerun maps Dex identity claims to local users.
- Define whether Grocerun should support optional group-based gates such as `OIDC_ALLOWED_GROUP` or `OIDC_ADMIN_GROUP`.

## Out of Scope

- Making Dex mandatory for all deployments.
- Replacing Grocerun local user, household, or role tables with Dex-managed state.
- Building full identity administration inside Grocerun.
- Supporting every Dex connector at launch.
- Implementing BFF/session auth.
- Choosing Keycloak/Auth0/Authentik as the default broker.

## Known Constraints / Prior Findings

- Dex is a broker/shim, not a rich user-management product.
- Dex supports a `groups` claim when requested with the `groups` scope, but connector support varies.
- Dex supports connectors such as LDAP, GitHub, SAML, GitLab, OIDC, OAuth2, Google, Microsoft, and others, with different maturity levels.
- Dex supports SQL storage including SQLite, Postgres, and MySQL.
- Dex documentation says SQLite is recommended for standing Dex up quickly but is not appropriate for real workloads. For small self-hosted Grocerun deployments, this warning needs explicit product judgment.
- Application authorization should stay in Grocerun, not Dex:
  - household owner/member roles
  - invitations
  - app disabled/deleted state
  - shopping-list permissions
- Optional Dex groups can be useful for coarse instance access, but should not replace Grocerun household membership.

## Open Questions

- Is Dex's SQLite storage acceptable for the expected small self-hosted deployment profile?
- Can Dex issue tokens with an audience that `oidc-spa/server` validates cleanly for Grocerun's API?
- Does `oidc-spa` require any Dex-specific configuration for refresh or silent renew?
- What is the smallest safe Dex Docker Compose setup for Grocerun?
- Should Dex be bundled as an example compose profile, or documented as an external recipe?
- How should logout behave across Grocerun, Dex, and upstream Google?
- Should direct Google auth remain available after a Dex pivot, or be deprecated once Dex is documented?
- How should first-login user provisioning work when Dex returns a verified email but no local invite exists?

## Success Criteria

- A proof-of-concept deployment can sign in through Dex using Google as upstream.
- Browser bundle no longer contains the Google OAuth client secret in Dex mode.
- Grocerun validates only Dex-issued tokens in Dex mode.
- Local user provisioning works from Dex claims.
- Household roles remain local to Grocerun.
- Optional group-to-instance-role mapping is either validated or explicitly rejected.
- Deployment documentation remains simple enough for self-hosters.

## Links

- `planning/tickets/google-only-auth-cleanup.md`
- Dex docs: https://dexidp.io/docs/
- Dex scopes and claims: https://dexidp.io/docs/configuration/custom-scopes-claims-clients/
- Dex connectors: https://dexidp.io/docs/connectors/
- Dex storage: https://dexidp.io/docs/configuration/storage/
