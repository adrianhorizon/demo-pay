#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:8080}"
AMOUNT="${2:-100}"
VENDOR="${3:-vendorA}"
TXHASH="${4:-0x1234567890abcdef}"
curl -s -X POST "$BASE_URL/transfer" -H "Content-Type: application/json" \
  -d "{\"amount\":$AMOUNT,\"vendor\":\"$VENDOR\",\"txhash\":\"$TXHASH\"}" | (command -v jq >/dev/null && jq . || cat)
