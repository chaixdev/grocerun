# Self-Hosting Grocerun

This guide explains how to deploy Grocerun on your own server using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your server.
- A domain name (optional, but recommended for SSL).

## Quick Start

1.  **Download the Compose File**
    Download `docker-compose.prod.yml` and save it as `docker-compose.yml`.

    ```bash
    curl -o docker-compose.yml https://raw.githubusercontent.com/chaixdev/grocerun/main/docker-compose.prod.yml
    ```

2.  **Configure Environment**
    Copy `.env.example` to `.env` and fill in your secrets. **Do not commit `.env` to version control.**

    ```bash
    cp .env.example .env
    ```

    ```bash
    # .env
    GROCERUN_VERSION=latest
    
    # Auth
    AUTH_SECRET=your_generated_secret_here # openssl rand -base64 32
    AUTH_GOOGLE_ID=your_google_client_id
    AUTH_GOOGLE_SECRET=your_google_client_secret
    ```

3.  **Start the Service**

    ```bash
    docker compose up -d
    ```

    The app will be available at `http://localhost:3000`.

## Updating

To update to the latest version:

```bash
docker compose pull
docker compose up -d
```

## Reverse Proxy (Recommended)

It is highly recommended to run Grocerun behind a reverse proxy like Nginx, Caddy, or Traefik to handle SSL termination.

### Example: Nginx Proxy Manager

Point your proxy to `http://<your-server-ip>:3000`.

## Troubleshooting

- **Database Connection**: Ensure the `db` service is healthy.
- **Logs**: Check logs with `docker compose logs -f`.
