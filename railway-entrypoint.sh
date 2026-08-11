#!/bin/sh
# Railway entrypoint for SillyTavern.
#
# Mirrors the upstream image's wrapper.sh (move the baked _config/_data/_plugins
# onto the persistent volume, then render config.template.yaml), but inserts an
# admin-seed step BEFORE the web server binds a port so the instance is never
# anonymously claimable — see seed-admin.cjs for the full rationale.
set -e

# Relocate the baked defaults onto the mounted volume on first boot.
[ ! -d "./persist/config" ]  && mv ./_config  ./persist/config
[ ! -d "./persist/data" ]    && mv ./_data    ./persist/data
[ ! -d "./persist/plugins" ] && mv ./_plugins ./persist/plugins

# SillyTavern config knobs (defaults match upstream's wrapper.sh).
export PORT="${PORT:-8080}"
export SILLYTAVERN_DISCREET_LOGIN="${SILLYTAVERN_DISCREET_LOGIN:-false}"
export SILLYTAVERN_LOG_LEVEL="${SILLYTAVERN_LOG_LEVEL:-3}"
export SILLYTAVERN_ENABLE_IPV6="${SILLYTAVERN_ENABLE_IPV6:-false}"
export SILLYTAVERN_PREFER_IPV6="${SILLYTAVERN_PREFER_IPV6:-false}"
export SILLYTAVERN_GEMINI_API_VERSION="${SILLYTAVERN_GEMINI_API_VERSION:-v1beta}"
export SILLYTAVERN_REQUEST_COMPRESSION="${SILLYTAVERN_REQUEST_COMPRESSION:-false}"

envsubst < ./config.template.yaml > ./persist/config/config.yaml

# Seed the default-user password on the volume BEFORE the server starts, so the
# first request the public port ever serves is already authenticated. Exits
# non-zero on an empty ST_ADMIN_PASSWORD, which fails the deploy loudly rather
# than shipping an open admin account.
node ./seed-admin.cjs

exec tini -- ./docker-entrypoint.sh
