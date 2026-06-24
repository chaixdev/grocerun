#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IMAGE_REPO="${GROCERUN_IMAGE:-ghcr.io/chaixdev/grocerun}"
IMAGE_TAG="${GROCERUN_IMAGE_TAG:-latest}"
PLATFORM="${GROCERUN_PLATFORM:-linux/amd64}"
WATCHTOWER_URL="${WATCHTOWER_URL:-https://watchtower.pi9.noisecraft.me/v1/update}"
SKIP_WATCHTOWER="${SKIP_WATCHTOWER:-0}"
DRY_RUN="${DRY_RUN:-0}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

require_command docker
require_command curl
require_command node

if ! docker buildx version >/dev/null 2>&1; then
  printf 'docker buildx is required\n' >&2
  exit 1
fi

APP_VERSION="${GROCERUN_VERSION:-$(node -p "require('./package.json').version")}" 

if [[ "$SKIP_WATCHTOWER" != "1" && -z "${WATCHTOWER_TOKEN:-}" ]]; then
  printf 'Set WATCHTOWER_TOKEN or use SKIP_WATCHTOWER=1\n' >&2
  exit 1
fi

build_cmd=(
  docker buildx build
  --platform "$PLATFORM"
  --build-arg "APP_VERSION=$APP_VERSION"
  -t "$IMAGE_REPO:$IMAGE_TAG"
  --push
  .
)

watchtower_cmd=(
  curl
  --fail
  --silent
  --show-error
  -X POST
  "$WATCHTOWER_URL"
  -H "Authorization: Bearer ${WATCHTOWER_TOKEN:-}"
)

fmt_duration() {
  local secs=$1
  if (( secs >= 60 )); then
    printf '%dm%02ds' $((secs / 60)) $((secs % 60))
  else
    printf '%ds' "$secs"
  fi
}

if [[ "$DRY_RUN" == "1" ]]; then
  printf 'Build command:\n'
  printf '  %q' "${build_cmd[@]}"
  printf '\n'

  if [[ "$SKIP_WATCHTOWER" == "1" ]]; then
    printf 'Watchtower update skipped\n'
  else
    printf 'Watchtower command:\n'
    printf '  %q' "${watchtower_cmd[@]}"
    printf '\n'
  fi

  exit 0
fi

printf '\n'
printf '  \033[32m┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\033[0m\n'
printf '  \033[32m┃\033[0m  \033[1;32m🥬  grocerun\033[0m  \033[2m→  staging\033[0m                       \033[32m┃\033[0m\n'
printf '  \033[32m┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\033[0m\n'
printf '\n'

t_start=$SECONDS
"${build_cmd[@]}"
t_build=$((SECONDS - t_start))

t_watchtower=0
if [[ "$SKIP_WATCHTOWER" != "1" ]]; then
  t_wt_start=$SECONDS
  "${watchtower_cmd[@]}"
  t_watchtower=$((SECONDS - t_wt_start))
fi

t_total=$((SECONDS - t_start))

printf '\n'
printf '  \033[32m┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\033[0m\n'
printf '  \033[32m┃\033[0m  \033[1;32m✓  deploy complete\033[0m                             \033[32m┃\033[0m\n'
printf '  \033[32m┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\033[0m\n'
printf '  \033[32m┃\033[0m  image     \033[37m%-36s\033[0m \033[32m┃\033[0m\n' "$IMAGE_REPO:$IMAGE_TAG"
printf '  \033[32m┃\033[0m  version   \033[37m%-36s\033[0m \033[32m┃\033[0m\n' "$APP_VERSION"
printf '  \033[32m┃\033[0m  platform  \033[37m%-36s\033[0m \033[32m┃\033[0m\n' "$PLATFORM"
printf '  \033[32m┃\033[0m  build     \033[1;37m%-36s\033[0m \033[32m┃\033[0m\n' "$(fmt_duration $t_build)"
if [[ "$SKIP_WATCHTOWER" != "1" ]]; then
  printf '  \033[32m┃\033[0m  notify    \033[37m%-36s\033[0m \033[32m┃\033[0m\n' "$(fmt_duration $t_watchtower)"
fi
printf '  \033[32m┃\033[0m  total     \033[1;37m%-36s\033[0m \033[32m┃\033[0m\n' "$(fmt_duration $t_total)"
printf '  \033[32m┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\033[0m\n'
