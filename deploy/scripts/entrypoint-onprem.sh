#!/bin/sh
set -e

echo "🔍 [CusBox360 On-Prem] Validating bundled industry templates..."
node scripts/cb360.js template validate

if [ -n "$CB360_PRELOAD_TEMPLATE" ]; then
  echo "🏢 [CusBox360 On-Prem] Pre-loading contracted template: $CB360_PRELOAD_TEMPLATE"
fi

exec node server.js
