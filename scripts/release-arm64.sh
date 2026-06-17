#!/bin/bash
set -euo pipefail

# ── release-arm64.sh ──
# Build and push a linux/arm64 Docker image to ghcr.io.
# Must be run from a semver git tag (e.g. 1.0.1 or v1.0.1).
# amd64 images are built by the GHA workflow; this script handles arm64 only.

REGISTRY="ghcr.io"
REPO="chaixdev/grocerun"
IMAGE="${REGISTRY}/${REPO}"

# ── 1. Guard: must be on a semver git tag ──

TAG=$(git describe --exact-match --tags HEAD 2>/dev/null) || {
    echo "ERROR: HEAD is not at a git tag."
    echo "       Release scripts require a semver tag (e.g. 1.0.1, v2.3.4)."
    exit 1
}

# Strip optional 'v' prefix and validate semver (X.Y.Z with optional pre-release suffix).
STRIPPED="${TAG#v}"
if ! echo "${STRIPPED}" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
    echo "ERROR: Tag '${TAG}' is not a valid semver version."
    echo "       Expected: X.Y.Z or vX.Y.Z (e.g. 1.0.1, v2.3.4, 1.0.0-rc.5)."
    exit 1
fi

MAJOR_MINOR=$(echo "${STRIPPED}" | cut -d. -f1,2)
MAJOR=$(echo "${STRIPPED}" | cut -d. -f1)
SHA=$(git rev-parse HEAD)

echo "=== Releasing arm64 image for ${TAG} ==="
echo "  Version:      ${STRIPPED}"
echo "  Major.Minor:  ${MAJOR_MINOR}"
echo "  Major:        ${MAJOR}"
echo "  SHA:          ${SHA}"
echo ""

# ── 2. Confirm ──

read -rp "Push arm64 image to ${IMAGE} ? [y/N] " CONFIRM
if [ "${CONFIRM}" != "y" ] && [ "${CONFIRM}" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

# ── 3. Build ──

echo ""
echo "=== Building linux/arm64 image ==="
docker buildx build \
    --platform linux/arm64 \
    --build-arg "NEXT_PUBLIC_APP_VERSION=${STRIPPED}" \
    --tag "${IMAGE}:${STRIPPED}" \
    --tag "${IMAGE}:${MAJOR_MINOR}" \
    --tag "${IMAGE}:${MAJOR}" \
    --tag "${IMAGE}:sha-${SHA:0:12}" \
    --load \
    .

echo ""
echo "=== Build complete ==="

# ── 4. Push ──

echo ""
echo "=== Pushing tags ==="
for docker_tag in "${STRIPPED}" "${MAJOR_MINOR}" "${MAJOR}" "sha-${SHA:0:12}"; do
    echo "  → ${IMAGE}:${docker_tag}"
    docker push "${IMAGE}:${docker_tag}"
done

echo ""
echo "=== Done: arm64 image released ==="

# ── 5. Trigger Watchtower (optional) ──

if [ -n "${WATCHTOWER_TOKEN:-}" ] && [ -n "${WATCHTOWER_URL:-}" ]; then
    echo ""
    echo "=== Triggering Watchtower update ==="
    curl --fail --silent --show-error -X POST \
        -H "Authorization: Bearer ${WATCHTOWER_TOKEN}" \
        "${WATCHTOWER_URL}" \
        && echo "Watchtower notified." \
        || echo "WARNING: Watchtower trigger failed (check WATCHTOWER_TOKEN / WATCHTOWER_URL)."
fi
