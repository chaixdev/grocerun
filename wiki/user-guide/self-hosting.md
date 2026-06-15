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
- A Google Cloud project with an OAuth 2.0 client configured
- (Optional) A domain name and reverse proxy for HTTPS

## Step 1 — Google OAuth setup

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Add authorised JavaScript origins:
   - `http://localhost:3000` (for local testing)
   - `https://your-domain.com` (for production)
4. Add authorised redirect URIs:
   - `http://localhost:3000/auth-callback` (for local testing)
   - `https://your-domain.com/auth-callback` (for production)
5. Note the **Client ID** and **Client Secret**.

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

# Google OAuth (required)
OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=GOCSPX-your-google-client-secret

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
by the `grocerun_data` volume. To back it up:

```bash
docker cp grocerun:/app/data/prod.db ./backup-$(date +%Y%m%d).db
```

The entrypoint also creates automatic backups on startup (keeps the last 5).

## Environment reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OIDC_CLIENT_ID` | Yes | — | Google OAuth client ID |
| `OIDC_CLIENT_SECRET` | Yes | — | Google OAuth client secret |
| `OIDC_AUDIENCE` | Production | value of `OIDC_CLIENT_ID` | JWT audience validation |
| `DATABASE_URL` | No | `file:/app/data/prod.db` | SQLite database path |
| `GROCERUN_VERSION` | No | `latest` | Docker image tag |
| `INVITATION_TIMEOUT_MINUTES` | No | `1440` | Invite code lifetime |
| `HOSTNAME` | No | `0.0.0.0` | Bind address |

Note: `OIDC_CLIENT_SECRET` is visible in the browser bundle because Grocerun is
a public SPA (no BFF to proxy the token exchange). This is an accepted
trade-off for the current architecture — see
[Security and Auth](../architecture/security-and-auth.md) for details.

## Troubleshooting

| Problem | Check |
|---|---|
| App won't start | `docker compose logs grocerun` — look for migration errors |
| Login fails | Verify `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` match Google Console |
| Login redirects to wrong URL | Check authorised origins/redirects in Google Console |
| Database errors | Ensure the `grocerun_data` volume is writable (uid 1001) |
| Port conflict | Change the host port: `- "8080:3000"` |

---

**Last Updated:** June 15, 2026
