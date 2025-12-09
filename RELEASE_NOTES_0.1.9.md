# Release Notes - Version 0.1.9

## Overview
This release tags the current main branch as version 0.1.9.

## Tag Information
- **Version**: 0.1.9
- **Commit**: 9f957a3af9e7e1c379de71db376fe24a77e2df3c
- **Branch**: main
- **Date**: December 9, 2025

## Latest Commit on Main
```
commit 9f957a3af9e7e1c379de71db376fe24a77e2df3c
Author: chai <bhagwat.chaitanya@gmail.com>
Date:   Mon Dec 8 14:54:48 2025 +0000

    feat(ui): polish cards, improve navigation flows, and fix redirects
```

## Previous Version
- **0.1.8**: Last tagged version on remote

## Deployment
To use this version:
```bash
export GROCERUN_VERSION=0.1.9
docker compose pull
docker compose up -d
```

## Status
- ✅ Tag created locally on main branch commit
- ⚠️ Tag push pending (requires GitHub authentication/PR merge)

## Next Steps
To push this tag to the remote repository, run:
```bash
./scripts/push-tag.sh
```

Or manually:
```bash
git push origin 0.1.9
```

Once the tag is pushed, the GitHub Actions workflow will automatically:
- Build Docker images for linux/amd64 and linux/arm64
- Tag the images with version 0.1.9
- Push to GitHub Container Registry (ghcr.io)
- Trigger Watchtower updates (if configured)
