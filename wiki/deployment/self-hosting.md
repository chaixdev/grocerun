# Self-Hosting Grocerun

This guide explains how to deploy Grocerun on your own server using Docker.

## Overview

Grocerun ships as a single Docker container. It contains:

- A NestJS server that serves both the REST API and the Vite-built SPA
- A SQLite database (stored in a Docker volume)
- All frontend assets (no separate web server needed)

One port, one container, one database.

## Prerequisites

- Docker and Docker Compose installed
- An OIDC provider — pick one:
  - **Google** (easiest, default): a Google Cloud project with an OAuth 2.0 client
  - **Authentik** (recommended for privacy-conscious): self-hosted OIDC provider
  - Any other OIDC-compliant provider (Keycloak, Zitadel, etc.)
- (Optional) A domain name and reverse proxy for HTTPS

## Step 1 — OIDC provider setup

### Option A — Google (default, quickest)

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Add authorised JavaScript origins:
   - `http://localhost:3000` (for local testing)
   - `https://your-domain.com` (for production)
4. Add authorised redirect URIs:
   - `http://localhost:3000/` (for local testing)
   - `https://your-domain.com/` (for production)
5. Note the **Client ID** and **Client Secret**.

Google is the only supported provider that requires a client secret in the
browser. This is a Google-specific quirk (requires secret at token endpoint
even with PKCE). The secret is only included in `config.js` when the issuer
is `accounts.google.com`.

### Option B — Authentik (recommended for privacy-conscious)

[Authentik](https://goauthentik.io) is a self-hosted identity provider with
full OIDC support. It uses standard PKCE — no client secret in the browser.

1. Deploy Authentik (see [their installation guide](https://goauthentik.io/docs/install-stable),
   or use the included `deploy/docker-compose.authentik.yml` for local testing — see
   [Local Smoke Test with Authentik](#local-smoke-test-with-authentik) below).
2. Create an **OIDC Application** in the Authentik admin panel.
3. Set redirect URIs:
   - `http://localhost:3000/` (for local testing)
   - `https://your-domain.com/` (for production)
4. Note the **Client ID** (no client secret needed — PKCE only).
5. Note the **Issuer URI** (e.g. `https://auth.your-domain.com/application/o/grocerun/`).

> **Note on redirect URIs:** `oidc-spa` uses the app's base URL as the
> redirect URI — there is no separate `/auth-callback` path. In dev this is
> `http://localhost:3000/`, in production `https://your-domain.com/`.

### Option C — Other OIDC providers

Any provider that exposes `.well-known/openid-configuration` and supports
PKCE will work. Set `OIDC_ISSUER_URI` to the issuer URL and
`OIDC_CLIENT_ID` to your client ID. No client secret is needed for
standard providers.

## Step 2 — Create the Compose file

Save the following as `docker-compose.yml`:

```yaml
services:
  grocerun:
    image: ghcr.io/chaixdev/grocerun:${GROCERUN_VERSION:-latest}
    container_name: grocerun
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: file:/app/data/prod.db
      OIDC_CLIENT_ID: ${OIDC_CLIENT_ID}
      OIDC_CLIENT_SECRET: ${OIDC_CLIENT_SECRET}
      OIDC_ISSUER_URI: ${OIDC_ISSUER_URI:-https://accounts.google.com}
      OIDC_AUDIENCE: ${OIDC_CLIENT_ID}
      HOSTNAME: 0.0.0.0
    volumes:
      - grocerun_data:/app/data

volumes:
  grocerun_data:
```

## Step 3 — Configure environment

Create a `.env` file next to `docker-compose.yml`:

```bash
# Optional: pin a specific version
GROCERUN_VERSION=latest

# OIDC provider (required)
# For Google (default):
OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=GOCSPX-your-google-client-secret
OIDC_ISSUER_URI=https://accounts.google.com

# For Authentik (or any other OIDC provider):
# OIDC_CLIENT_ID=your-authentik-client-id
# OIDC_CLIENT_SECRET=  # NOT needed for standard OIDC providers
# OIDC_ISSUER_URI=https://auth.your-domain.com/application/o/grocerun/
# OIDC_PROVIDER=authentik

# Optional: invitation code expiry in minutes (default: 1440 = 24 hours)
INVITATION_TIMEOUT_MINUTES=1440
```

Do not commit `.env` to version control.

## Step 4 — Start the service

```bash
docker compose up -d
```

The app is available at `http://localhost:3000`.

On first start, the entrypoint script:

1. Creates the SQLite database file in the mounted volume
2. Applies all Prisma migrations automatically
3. Writes the OIDC config so the frontend can initialise `oidc-spa`
4. Starts the NestJS server

## Step 5 — Reverse proxy (recommended)

Run Grocerun behind Nginx, Caddy, or Traefik for HTTPS. Point your proxy to
`http://localhost:3000`.

### Example: Caddy

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

### Example: Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Updating

```bash
docker compose pull
docker compose up -d
```

The entrypoint runs migrations automatically on restart, so database schema
changes are applied without manual steps.

## Backup

The SQLite database lives at `/app/data/prod.db` inside the container, backed
by the `grocerun_data` volume. **Disaster-recovery backups are the operator's
responsibility** — Grocerun does not ship an off-volume backup feature.

### What the entrypoint backups are (and aren't)

On every startup, before applying migrations, the entrypoint copies `prod.db`
to `grocerun_<version>_<timestamp>.db` inside the same volume (md5-rotated,
last 5 kept). These are a **migration safety net** — a way to undo a bad
schema change — not disaster recovery. They live on the same volume as the
live database, so a disk failure or accidental `docker volume rm` takes them
down with it. Treat them as a convenience, not a backup strategy.

### Safe ways to back up

SQLite uses WAL journaling, so a raw file copy of a live database can capture
a torn state — a backup that "restores" to a file that won't open. Two safe
approaches:

**Option A — stop, copy, start (simplest, ~5 s downtime):**

```bash
docker stop grocerun
docker cp grocerun:/app/data/prod.db ./backup-$(date +%Y%m%d).db
docker start grocerun
```

Fine for a household app. Most operators script this with cron and a
healthcheck probe afterwards.

**Option B — online backup via the SQLite backup API (no downtime):**

```bash
docker exec grocerun sqlite3 /app/data/prod.db ".backup '/tmp/backup.db'"
docker cp grocerun:/tmp/backup.db ./backup-$(date +%Y%m%d).db
docker exec grocerun rm /tmp/backup.db
```

The `.backup` command uses SQLite's backup API, which handles WAL/journaling
correctly while the app continues to serve requests. Use this for scheduled
snapshots against a live container.

### What to back up

Only `/app/data/prod.db` matters. The schema is reproducible via migrations,
frontend assets are baked into the image, and the entrypoint's `grocerun_*.db`
rotation files are redundant with your own backups. Store the copied file
off-host (cloud storage, separate disk, offsite backup target) and verify a
restore periodically — an untested backup is a hope, not a backup.

## Environment reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OIDC_CLIENT_ID` | Yes | — | OIDC client ID (from your provider) |
| `OIDC_ISSUER_URI` | No | `https://accounts.google.com` | OIDC issuer URL for JWKS discovery |
| `OIDC_CLIENT_SECRET` | Google only | — | Client secret (only sent to browser when issuer is Google) |
| `OIDC_PROVIDER` | No | `google` | Provider name for Account records (e.g. `authentik`) |
| `OIDC_AUDIENCE` | Production | value of `OIDC_CLIENT_ID` | JWT audience validation |
| `DATABASE_URL` | No | `file:/app/data/prod.db` | SQLite database path |
| `GROCERUN_VERSION` | No | `latest` | Docker image tag |
| `INVITATION_TIMEOUT_MINUTES` | No | `1440` | Invite code lifetime |
| `HOSTNAME` | No | `0.0.0.0` | Bind address |

Note: `OIDC_CLIENT_SECRET` is only included in the browser config when the
issuer is Google (`accounts.google.com`). Standard OIDC providers (Authentik,
Keycloak, etc.) use PKCE without a client secret — no secret reaches the
browser. This is an accepted trade-off for Google's non-standard token
endpoint — see [Auth Conventions](../rules/auth.md) for details.

## Troubleshooting

| Problem | Check |
|---|---|
| App won't start | `docker compose logs grocerun` — look for migration errors |
| Login fails | Verify `OIDC_CLIENT_ID` matches your provider config |
| Login fails (Google) | Also verify `OIDC_CLIENT_SECRET` is set correctly |
| Login fails (Authentik/other) | Verify `OIDC_ISSUER_URI` is correct and reachable |
| Login redirects to wrong URL | Check authorised origins/redirects in your provider config |
| Database errors | Ensure the `grocerun_data` volume is writable (uid 1001) |
| Port conflict | Change the host port: `- "8080:3000"` |

## Local Smoke Test with Authentik

A `docker-compose.authentik.yml` file is included in the `deploy/` directory for
local smoke testing of the generic OIDC integration. It brings up Authentik
(server, worker, PostgreSQL, Redis) on `localhost:9000`. Grocerun runs on
the host via `npm run dev` — both the browser and the NestJS server reach
Authentik at `localhost:9000`, avoiding Docker networking issues.

### 1. Start Authentik

```bash
# Copy and configure the env file
cp deploy/.env.authentik.example .env.authentik

# Generate secrets (paste into .env.authentik)
openssl rand -base64 36 | tr -d '\n'   # → PG_PASS
openssl rand -base64 60 | tr -d '\n'   # → AUTHENTIK_SECRET_KEY

# Start Authentik
docker compose -f deploy/docker-compose.authentik.yml --env-file .env.authentik up -d
```

Wait for the server to be ready (~30 seconds on first start for migrations):

```bash
docker compose -f deploy/docker-compose.authentik.yml logs -f authentik-server
# Wait for "Application startup complete"
```

### 2. Create the admin account

Open `http://localhost:9000/if/flow/initial-setup/` and set the admin
username and password.

### 3. Create an OIDC application

1. Log in to the Authentik admin panel at `http://localhost:9000`.
2. Go to **Applications → Applications** and click **Create with Wizard**.
3. Name it `grocerun`, slug `grocerun`.
4. Choose **OIDC** as the provider type.
5. Set the **Authorization Code** flow (use the default `default-provider-authorization-implicit-consent`).
6. Set **Redirect URI** to `http://localhost:3000/`.
7. Set **Client Type** to **Confidential** (or **Public** — both work with PKCE).
8. **Do not set an encryption key** — leave it empty (see pitfalls below).
9. Save and note the **Client ID**.

The **Issuer URI** will be `http://localhost:9000/application/o/grocerun/`.

> **Critical: Do not set an ID token encryption key.** Authentik supports
> JWE-encrypted ID tokens (`RSA-OAEP-256` + `A256CBC-HS512`), but `oidc-spa`
> expects plain JWTs (`header.payload.signature`). If an encryption key is
> set, the token endpoint returns JWE tokens (`header.encrypted_key.iv.
> ciphertext.tag` — 5 parts) instead of JWTs (3 parts), and `oidc-spa` fails
> with `Invalid token specified: invalid json for part #2`. The signing
> algorithm (RS256) is fine — only the encryption layer must be disabled.

> **Redirect URI must be set.** Without a redirect URI, Authentik blocks CORS
> on the `.well-known/openid-configuration` endpoint with a 200 status and no
> `Access-Control-Allow-Origin` header. The browser sees "Cross-Origin Request
> Blocked" and `oidc-spa` cannot initialise.

> **Redirect URI format.** `oidc-spa` uses the app's `BASE_URL` as the
> redirect URI — there is no separate `/auth-callback` path. In dev this is
> `http://localhost:3000/` (with trailing slash), in production
> `https://your-domain.com/`.

### 4. Configure Grocerun

Update `apps/web/.env`:

```bash
VITE_OIDC_ISSUER_URI=http://localhost:9000/application/o/grocerun/
VITE_OIDC_CLIENT_ID=<your-authentik-client-id>
# No client secret needed — PKCE only
```

Update `apps/server/.env`:

```bash
OIDC_ISSUER_URI=http://localhost:9000/application/o/grocerun/
OIDC_AUDIENCE=<your-authentik-client-id>
OIDC_PROVIDER=authentik
```

### 5. Run and test

```bash
npm run dev
```

Open `http://localhost:3000`, click login, and you should be redirected to
Authentik. After authenticating, you'll be redirected back to Grocerun with
a valid session.

### Tear down

```bash
docker compose -f deploy/docker-compose.authentik.yml --env-file .env.authentik down -v
```

The `-v` flag removes the volumes (database, Redis, media). Omit it to
preserve the Authentik state between runs.

---

**Last Updated:** June 23, 2026
