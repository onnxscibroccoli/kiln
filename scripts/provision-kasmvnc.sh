#!/usr/bin/env bash
# Self-host: XFCE on KasmVNC via linuxserver/webtop (TeamViewer-like browser UI).
# Requires Docker Engine + Compose plugin.
#
#   sudo bash scripts/provision-kasmvnc.sh
#
# Then open the printed HTTPS URL. Default login is whatever you set in
# CUSTOM_USER / PASSWORD (defaults kiln / kiln).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="${ROOT}/deploy/docker-compose.kasmvnc.yml"
WEB_PORT="${WEB_PORT:-3000}"
HTTPS_PORT="${HTTPS_PORT:-3001}"
CUSTOM_USER="${CUSTOM_USER:-kiln}"
PASSWORD="${PASSWORD:-kiln}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for the KasmVNC stack." >&2
  exit 1
fi

export WEB_PORT HTTPS_PORT CUSTOM_USER PASSWORD
docker compose -f "${COMPOSE}" up -d

echo "KasmVNC XFCE is up."
echo "HTTP  http://0.0.0.0:${WEB_PORT}/"
echo "HTTPS http://0.0.0.0:${HTTPS_PORT}/"
echo "User  ${CUSTOM_USER}"
