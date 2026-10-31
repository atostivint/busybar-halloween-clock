#!/usr/bin/env bash
# Installs dist/<id>.tgz on a BUSY Bar with the same calls busy-cli makes (busy-cli 0.6 failed on firmware 1.3.1 / API 27.14).
# usage: BAR=10.0.4.20 [BUSY_TOKEN=...] scripts/install.sh [path/to/app.tgz]
set -euo pipefail
BAR="${BAR:-10.0.4.20}"
ID="io.github.atostivint.hwclock"
TGZ="${1:-dist/$ID.tgz}"
AUTH=(); [ -n "${BUSY_TOKEN:-}" ] && AUTH=(-H "X-API-Token: $BUSY_TOKEN")
KEY=$(curl -sf "${AUTH[@]}" -X POST "http://$BAR/api/apps/stage" --data-binary @"$TGZ" | python -c 'import sys,json;print(json.load(sys.stdin)["install_key"])')
curl -sf "${AUTH[@]}" -X POST "http://$BAR/api/apps/install?install_key=$KEY" && echo
curl -sf "${AUTH[@]}" -X POST "http://$BAR/api/apps/launch?app_id=$ID" && echo
