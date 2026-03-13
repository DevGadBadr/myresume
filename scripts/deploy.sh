#!/usr/bin/env bash
npm run build
pm2 startOrReload ecosystem.config.cjs --only resume-3007 --update-env
pm2 save
