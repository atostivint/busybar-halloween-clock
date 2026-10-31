#!/usr/bin/env bash
# Dump the bar's in-memory log and print it (optionally filtered). usage: BAR=.. [BUSY_TOKEN=..] tools/devlog.sh [grep-regex]
H=(); [ -n "${BUSY_TOKEN:-}" ] && H=(-H "X-API-Token: $BUSY_TOKEN")
curl -s "${H[@]}" -X POST "http://${BAR:-10.0.4.20}/api/log_dump" >/dev/null
curl -s "${H[@]}" "http://${BAR:-10.0.4.20}/api/storage/read?path=/ext/log.txt" | sed 's/\x1b\[[0-9;]*m//g' | grep -i -E "${1:-.}"
