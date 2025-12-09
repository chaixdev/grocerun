#!/bin/bash
# Script to push tag 0.1.9 to remote repository
# This script should be run with appropriate GitHub credentials

set -e

TAG_NAME="0.1.9"
REMOTE="origin"

echo "Pushing tag ${TAG_NAME} to ${REMOTE}..."

# Push the tag
git push ${REMOTE} ${TAG_NAME}

echo "✅ Tag ${TAG_NAME} has been successfully pushed to ${REMOTE}"
echo ""
echo "Verify with: git ls-remote --tags ${REMOTE} | grep ${TAG_NAME}"
