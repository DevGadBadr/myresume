#!/usr/bin/env bash
# Deploy resume app: install → Puppeteer Chrome → build → PM2 reload → save.
# Aborts on any failure so a broken build never restarts the process.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="resume-3007"
PORT="${PORT:-3007}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${PORT}/myresume}"

cd "$ROOT_DIR"

# --- Node via nvm (interactive shells load this; bare scripts often do not) ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  if [[ -f "$ROOT_DIR/.nvmrc" ]]; then
    nvm use --silent
  else
    nvm use default --silent 2>/dev/null || nvm use node --silent
  fi
fi

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "error: node/npm not found. Install Node or configure nvm." >&2
  exit 1
fi

echo "==> Deploying resume"
echo "    root:  $ROOT_DIR"
echo "    node:  $(command -v node) ($(node -v))"
echo "    npm:   $(command -v npm) ($(npm -v))"
echo "    app:   $APP_NAME"

# --- Dependencies ---
echo "[1/5] Installing dependencies..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ ! -x "$ROOT_DIR/node_modules/.bin/next" ]]; then
  echo "error: next binary missing after install (node_modules/.bin/next)." >&2
  exit 1
fi

# --- Puppeteer Chrome (PDF export) ---
# Always use the real home cache — Cursor/agent sandboxes may override
# PUPPETEER_CACHE_DIR to a temp path PM2 cannot see at runtime.
export PUPPETEER_CACHE_DIR="${HOME}/.cache/puppeteer"
echo "[2/5] Ensuring Puppeteer Chrome (cache: $PUPPETEER_CACHE_DIR)..."
CHROME_BIN="$(node -e "process.stdout.write(require('puppeteer').executablePath())" 2>/dev/null || true)"
if [[ -n "$CHROME_BIN" && -x "$CHROME_BIN" ]]; then
  echo "    Chrome already installed — skipping download ($CHROME_BIN)"
else
  echo "    Chrome missing — installing..."
  npx --yes puppeteer browsers install chrome
fi

# --- Build ---
echo "[3/5] Building Next.js app..."
npm run build

if [[ ! -f "$ROOT_DIR/.next/BUILD_ID" ]]; then
  echo "error: build did not produce .next/BUILD_ID" >&2
  exit 1
fi

# --- PM2 ---
echo "[4/5] Reloading PM2 process: $APP_NAME"
if ! command -v pm2 >/dev/null; then
  echo "error: pm2 not found on PATH" >&2
  exit 1
fi

pm2 startOrReload ecosystem.config.cjs --only "$APP_NAME" --update-env
pm2 save

# --- Health check (non-fatal if URL is wrong; still report status) ---
echo "[5/5] Checking process / health..."
pm2 describe "$APP_NAME" | grep -E 'status|restarts|script path|exec cwd|node.js version' || true

if command -v curl >/dev/null; then
  sleep 2
  if curl -fsS -o /dev/null --max-time 10 "$HEALTH_URL"; then
    echo "    health: OK ($HEALTH_URL)"
  else
    echo "    health: WARN — $HEALTH_URL did not respond (process may still be starting)" >&2
  fi
fi

echo "Deploy complete."
