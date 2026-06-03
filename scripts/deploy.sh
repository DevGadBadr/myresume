#!/usr/bin/env bash
node_modules/.bin/puppeteer browsers install chrome
npm run build
pm2 startOrReload ecosystem.config.cjs --only resume-3007 --update-env
pm2 save
