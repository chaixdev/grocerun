# Tag 0.1.9 Push Instructions

## Summary
An annotated git tag `0.1.9` has been successfully created on the main branch commit `9f957a3`.

## Current Status
- ✅ Tag created locally
- ❌ Tag not yet pushed to remote (authentication required)

## Why the Tag Isn't Pushed Yet
This task is being executed in a sandboxed environment that doesn't have direct GitHub authentication credentials. The tag has been created locally and documented, but pushing it requires GitHub credentials.

## How to Push the Tag

### Option 1: Using the Helper Script
```bash
./scripts/push-tag.sh
```

### Option 2: Manual Push
```bash
git push origin 0.1.9
```

### Option 3: GitHub CLI
```bash
gh auth login
git push origin 0.1.9
```

## What Happens After Push
Once the tag `0.1.9` is pushed to the remote repository:

1. **GitHub Actions Workflow Triggers**
   - The `docker-build.yml` workflow will be triggered (matches pattern `*.*.*`)
   - Docker images will be built for `linux/amd64` and `linux/arm64`
   - Images will be tagged with `0.1.9` and pushed to GitHub Container Registry

2. **Watchtower Updates**
   - If configured, Watchtower will be notified to pull the new image

3. **Deployment**
   - Users can update by setting `GROCERUN_VERSION=0.1.9` in their `.env` file
   - Run `docker compose pull && docker compose up -d`

## Verification
After pushing, verify the tag is on the remote:
```bash
git ls-remote --tags origin | grep 0.1.9
```

Check the GitHub Actions run:
```bash
gh run list --workflow=docker-build.yml --limit 1
```

## Tag Details
```
Tag: 0.1.9
Commit: 9f957a3af9e7e1c379de71db376fe24a77e2df3c
Branch: main
Message: Release version 0.1.9
Date: 2025-12-09T00:55:27Z
```

## Related Files
- `RELEASE_NOTES_0.1.9.md` - Release notes for this version
- `scripts/push-tag.sh` - Helper script to push the tag
- `.github/workflows/docker-build.yml` - Workflow that processes tags
