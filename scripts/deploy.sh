#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

npm ci
node_modules/.bin/puppeteer browsers install chrome
npm run build
pm2 startOrReload ecosystem.config.cjs --only resume-3007 --update-env
pm2 save
