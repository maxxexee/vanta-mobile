#!/bin/sh
# The build Brimble runs, from its configured root directory (`landing`).
#
# The site project builds that folder only, so `/app` never existed on the live
# host and the landing's "Open the app" link reloaded the page. This builds the
# wallet app from the repo root, then the landing, then copies the app into
# `landing/dist/app` — the same layout `pnpm build:site` produces locally, so the
# deployed shape and the local one cannot drift.
#
# Kept in sh, not a package script, because it crosses the two workspaces:
# `landing/` is deliberately its own pnpm workspace (see
# landing/pnpm-workspace.yaml), so nothing in either package.json can reach both.
#
# Vite is invoked through node_modules/.bin rather than `pnpm build`: pnpm's
# verify-deps-before-run re-runs an install before any package script and aborts
# on a node_modules tree it did not create, which is how a stale dist/ once
# looked like a successful build here.
set -eu

cd "$(dirname "$0")/.."   # repo root
CI=true pnpm install --frozen-lockfile
./node_modules/.bin/vite build     # the wallet app, into dist/

cd landing
CI=true pnpm install --frozen-lockfile
./node_modules/.bin/vite build     # the landing page, into landing/dist/

test -f ../dist/index.html || { echo "app build produced no dist/index.html" >&2; exit 1; }
test -f dist/index.html || { echo "landing build produced no dist/index.html" >&2; exit 1; }
rm -rf dist/app
cp -r ../dist dist/app
echo "app copied into $(pwd)/dist/app"
