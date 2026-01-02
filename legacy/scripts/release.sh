#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper to print steps
log() {
  echo -e "${BLUE}[RELEASE]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# 1. Prerequisite Checks
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is not installed. Please install it first."
fi

if ! gh auth status &> /dev/null; then
    error "GitHub CLI is not logged in. Run 'gh auth login' first."
fi

if [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Please commit or stash changes."
fi

# 2. Get Current State
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" ]]; then
    error "You must be on 'main' branch to start a release."
fi

log "Pulling latest changes from remote..."
git pull origin main

current_version=$(npm pkg get version | tr -d '"')
log "Current version: ${GREEN}${current_version}${NC}"

# 3. Ask for Bump Type
echo ""
echo "Select release type:"
select bump_type in "patch" "minor" "major" "cancel"; do
    case $bump_type in
        patch|minor|major) break ;;
        cancel) exit 0 ;;
    esac
done

# 4. dry-run calculations
# We use npm version to calculate the string, but we won't write it yet
# This is a bit tricky with npm version, so we'll just let npm do the work in the branch
log "Starting release process for ${bump_type} bump..."

# 5. Create Release Branch
timestamp=$(date +%s)
branch_name="release/v${timestamp}" # distinct temporary name to avoid conflicts
log "Creating branch ${branch_name}..."
git checkout -b "$branch_name"

# 6. Commit 1: The Release Commit
# updates package.json to new version (e.g., 1.0.1)
log "Bumping version (${bump_type})..."
npm version $bump_type --no-git-tag-version

release_version=$(npm pkg get version | tr -d '"')
release_tag="v${release_version}"
log "Target Release Version: ${GREEN}${release_version}${NC}"

git add package.json package-lock.json
git commit -m "chore(release): ${release_version}"

# 7. Commit 2: The Prepare Next Dev Commit
# We want to go to next patch-dev. e.g. 1.0.1 -> 1.0.2-dev.0
# semver: 'prerelease' on 1.0.1 gives 1.0.2-0 if we use preid?
# Actually simpler: just use 'prepatch' with preid=dev
log "Preparing next development version..."
npm version prepatch --preid=dev --no-git-tag-version

next_dev_version=$(npm pkg get version | tr -d '"')
log "Next Dev Version: ${GREEN}${next_dev_version}${NC}"

git add package.json package-lock.json
git commit -m "chore: prepare for next development iteration (${next_dev_version})"

# 8. Push and PR
log "Pushing branch..."
git push origin "$branch_name"

log "Creating Pull Request..."
pr_url=$(gh pr create --title "chore(release): ${release_version}" --body "Automated release PR for version ${release_version}. Includes version bump and preparation for next dev cycle." --base main --head "$branch_name")

log "PR Created: $pr_url"

# 9. Merge Strategy Warning
warn "IMPORTANT: To tag the correct release commit, we must NOT Squash this PR."
warn "If you Squash, the 'Release' and 'Prepare Dev' commits will trigger a single combined commit."
warn "We will use 'gh pr merge --merge' (Merge Commit) or '--rebase' (Rebase) to preserve individual commits."

if read -r -p "Do you want to merge this PR now? [y/N] " response; then
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        # Defaulting to --merge (Create a merge commit) as it's safest for finding history
        # If repo disallows merge commits, this might fail, necessitating --rebase or --squash (but squash breaks the flow)
        log "Merging PR..."
        gh pr merge "$pr_url" --merge --delete-branch
    else
        log "PR created but not merged. Script stopping here."
        exit 0
    fi
else
    exit 0
fi

# 10. Tagging Ceremony
log "Switching back to main and pulling..."
git checkout main
git pull origin main

# Find the specific commit hash for the release version
# We look for the exact commit message "chore(release): X.Y.Z"
log "Locating release commit for ${release_version}..."
commit_hash=$(git log -1 --format='%H' --grep="chore(release): ${release_version}")

if [[ -z "$commit_hash" ]]; then
    error "Could not find the release commit on main. Did the merge squash rename the commit?"
fi

log "Found release commit: ${commit_hash}"
log "Tagging..."
git tag -a "$release_tag" -m "Release ${release_version}" "$commit_hash"

if read -r -p "Push tag ${release_tag} to remote? [y/N] " push_resp; then
    if [[ "$push_resp" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git push origin "$release_tag"
        log "✅ Release ${release_version} completed successfully!"
    fi
fi
