# Self-Hosting Guide

Grocerun is designed to be easily self-hostable using Docker.

## Prerequisites

- **Docker Engine** & **Docker Compose**
- A domain name (recommended for SSL)
- **Google Cloud Console Project** (for OAuth) - *Note: We are working on alternative auth methods.*

## Quick Start

See the [Deployment Guide](../../DEPLOY.md) in the root of the repository for quick start instructions.

## Configuration Reference

The application is configured via environment variables.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTH_SECRET` | Random string for session encryption | Yes | - |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Yes | - |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Yes | - |
| `HOSTNAME` | Hostname to bind to | No | `0.0.0.0` |
| `GROCERUN_VERSION` | Docker image tag | No | `latest` |

> **Note**: The application uses SQLite by default. The database file is persisted in the `grocerun_data` volume.

## Friction Points & Known Issues

### Authentication
Currently, Grocerun **only supports Google OAuth**. This means you must set up a Google Cloud Project to log in.
- **Workaround**: None at the moment.
- **Status**: We are tracking this in [GRO-IAM-alternatives](../planning/tickets/backlog/GRO-IAM-alternatives.md).

### Database
The app requires a PostgreSQL database. SQLite is used for development but not recommended for production due to concurrency limits.
