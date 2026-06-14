# Google-Only Auth Cleanup

**Status:** DONE

## Summary

Clean up the current Google OIDC integration so the application is honest about supporting one auth provider only. Keep the working `oidc-spa` integration for now, but remove multi-provider claims, isolate Google-specific unsafe options, and fix technical gaps discovered during review.

## Problem

The current auth implementation works as a direct Google OIDC integration, but the surrounding architecture language has implied broader multi-provider support. That is misleading. The code hardcodes Google-specific behavior and relies on two provider-specific compromises: `__unsafe_clientSecret` and `__unsafe_useIdTokenAsAccessToken`.

The immediate problem is not that Google login cannot work. The problem is that the implementation and documentation need to clearly say: Grocerun currently supports Google-only authentication, not generic multi-provider product auth.

## Product Context

- Self-hostability remains a core constraint; adding a required broker or identity platform is not appropriate for the default deployment.
- Google login is sufficient for the short term.
- Users and maintainers should not be led to believe that adding Apple, Microsoft, Keycloak, Authentik, or arbitrary OIDC providers is a small configuration-only change.
- Keeping the current SPA token model avoids a BFF/session rewrite while local-first RxDB sync is still settling.

## Technical Context

- Frontend auth is bootstrapped in `apps/web/src/routes/__root.tsx` using `oidc-spa`.
- Current Google-specific frontend options:
  - `issuerUri: "https://accounts.google.com"`
  - `__unsafe_clientSecret: import.meta.env.VITE_OIDC_CLIENT_SECRET`
  - `__unsafe_useIdTokenAsAccessToken: true`
- Backend OIDC validation is bootstrapped in `apps/server/src/main.ts` and `apps/server/src/auth/oidc-server.ts`.
- `OIDC_AUDIENCE` is required in production and must equal the Google OAuth client ID while Google ID tokens are used as API bearer tokens.
- `AuthGuard` accepts `?token=` query-param tokens for SSE, but currently does not restrict that fallback to SSE endpoints despite the documentation saying it does.
- `wiki/adr/009-oidc-client-secret-in-browser.md` was retracted because it promoted a not-yet-accepted architecture decision into canonical ADR space.

## Scope

- Make docs and config language explicitly Google-only.
- Remove or avoid claims that Grocerun currently supports multi-provider auth.
- Keep `oidc-spa` for the short-term Google integration.
- Keep Google direct mode documented as a pragmatic temporary implementation, not a durable architecture.
- Restrict query-param token auth to the actual SSE sync stream endpoint(s).
- Confirm production auth configuration requirements:
  - `VITE_OIDC_CLIENT_ID`
  - `VITE_OIDC_CLIENT_SECRET`
  - `OIDC_ISSUER_URI=https://accounts.google.com`
  - `OIDC_AUDIENCE=<same value as VITE_OIDC_CLIENT_ID>`
- Update `.env.example` and deployment docs if they still imply generic OIDC or omit the Google-specific caveats.
- Update stale references to NextAuth in e2e/development docs if they are encountered while working on auth docs.

## Out of Scope

- Adding non-Google providers.
- Adding Dex, Keycloak, Authentik, or any auth broker.
- Replacing `oidc-spa` with Google Identity Services.
- Implementing a NestJS BFF/session model.
- Reworking RxDB sync auth away from bearer tokens.
- Building account-linking or provider-selection UI.

## Known Constraints / Prior Findings

- Direct Google OIDC via `oidc-spa` requires `__unsafe_clientSecret` for the token exchange in the current implementation.
- Google access tokens are not suitable JWT API tokens for Grocerun, so the current setup uses `__unsafe_useIdTokenAsAccessToken`.
- This is workable only if the API validates the ID token audience against the Google client ID.
- A browser-visible Google client secret is not a cryptographic secret in this SPA context, but it is still a configuration and audit concern.
- `EventSource` cannot send custom headers, so SSE currently uses a query-param token fallback.
- Query-param tokens should be accepted only for SSE endpoints and should not be logged in production.
- The prior ADR was deleted because no implementation followed a finalized accepted architecture decision; the current state belongs in planning until validated.

## Open Questions

- Should Google-only mode remain based on `oidc-spa`, or should a later ticket evaluate Google Identity Services plus Grocerun-issued app tokens?
- Should direct Google login be documented as the only supported auth mode, or as the default mode with future migration caveats?
- Which exact SSE route(s) should be allowed to accept `?token=`?
- Should the backend fail fast outside production too when `OIDC_AUDIENCE` is missing?
- Should self-host docs recommend separate Google OAuth clients for local development and production?

## Success Criteria

- Canonical docs no longer claim accepted multi-provider auth architecture.
- The app and deployment docs clearly describe current auth as Google-only.
- Google-specific unsafe options are documented as temporary implementation constraints.
- Production audience validation requirements are explicit.
- `?token=` auth is accepted only for SSE stream endpoint(s), not every guarded API route.
- Existing Google login, API calls, and RxDB sync still work after cleanup.
- Tests or manual validation cover login, authenticated API request, token renewal/retry, and SSE sync connection.

## Links

- `apps/web/src/routes/__root.tsx`
- `apps/web/src/core/auth/oidc.ts`
- `apps/web/src/core/lib/api.ts`
- `apps/web/src/core/rxdb/database.ts`
- `apps/server/src/main.ts`
- `apps/server/src/auth/auth.guard.ts`
- `apps/server/src/auth/oidc-server.ts`
- `planning/brainstorm/2026-06-11T1346_dex-multi-auth-pivot.md`
