# Forgejo Migration

Replace GitHub + GitHub Actions with self-hosted Forgejo + Forgejo Actions.

## Motivation

- No dependency on GitHub SaaS for CI/CD
- Git repo and CI runner on own hardware
- Forgejo Actions is GHA-compatible — workflows should port with minimal changes

## Components to migrate

| From | To | Status |
|------|----|--------|
| github.com/chaixdev/grocerun | local Forgejo instance | 🔲 |
| GitHub Actions workflows | Forgejo Actions (GHA-compatible) | 🔲 |
| ghcr.io/chaixdev/grocerun | TBD container registry (possibly Forgejo's built-in registry) | 🔲 |

## Open questions

- Container registry: Forgejo has a built-in OCI registry — evaluate if it's sufficient or if a separate registry (e.g. Harbor, self-hosted distribution) is needed
- Caching: GHA cache vs Forgejo Actions cache
- Secrets management in Forgejo
- DNS / TLS for the Forgejo instance
- Backup strategy for repos and container images

## References

- `deploy-staging.sh` — currently pushes to `ghcr.io/chaixdev/grocerun`
- `Dockerfile`, `apps/web/Dockerfile`
