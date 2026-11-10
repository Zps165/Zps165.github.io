#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "Cart Log: http://localhost:8090"
echo "按 Ctrl+C 停止"
exec python3 -m http.server 8090 --bind 0.0.0.0
