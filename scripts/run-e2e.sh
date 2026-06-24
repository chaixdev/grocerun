#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${TMPDIR:-/tmp}/grocerun-e2e-$$"
SERVER_LOG="$LOG_DIR/server.log"
WEB_LOG="$LOG_DIR/web.log"

mkdir -p "$LOG_DIR"

cleanup() {
  local exit_code=$?

  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi

  # npm/turbo may leave child processes behind; clear the ports this script owns.
  lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

  if [[ $exit_code -ne 0 ]]; then
    echo ""
    echo "E2E run failed. Logs:"
    echo "  server: $SERVER_LOG"
    echo "  web:    $WEB_LOG"
  fi

  exit "$exit_code"
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local name="$1"
  local url="$2"
  local log_file="$3"
  local max_attempts="${4:-60}"

  for attempt in $(seq 1 "$max_attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name ready: $url"
      return 0
    fi

    if (( attempt % 10 == 0 )); then
      echo "Still waiting for $name ($attempt/$max_attempts). Log: $log_file"
    fi

    sleep 1
  done

  echo "$name did not become ready at $url"
  echo "Last 80 log lines from $log_file:"
  tail -80 "$log_file" 2>/dev/null || true
  return 1
}

echo "Stopping anything already running on ports 3000/3001..."
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

echo "Starting Grocerun server for Playwright (NODE_ENV=test, DATABASE_URL=file:./test.db)..."
(
  cd "$ROOT_DIR"
  DATABASE_URL=file:./test.db NODE_ENV=test npm run dev -w grocerun-server
) >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

wait_for_url "server" "http://localhost:3001/health" "$SERVER_LOG" 60

echo "Starting Grocerun web app..."
(
  cd "$ROOT_DIR"
  npm run dev -w grocerun-web
) >"$WEB_LOG" 2>&1 &
WEB_PID=$!

wait_for_url "web" "http://localhost:3000" "$WEB_LOG" 60

echo "Running Playwright Chromium journeys..."
(
  cd "$ROOT_DIR/apps/e2e"
  npx playwright test --project=chromium "$@"
)

echo "E2E run passed. Logs retained in $LOG_DIR"
