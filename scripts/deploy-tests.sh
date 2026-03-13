#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:8080}"
echo "Running deploy tests against $BASE_URL"

for i in {1..30}; do
  if curl -sf "$BASE_URL/health" >/dev/null; then
    echo "API is up"
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "API did not become ready"
    exit 1
  fi
  sleep 2
done

RESP=$(curl -sf -X POST "$BASE_URL/transfer" -H "Content-Type: application/json" \
  -d '{"amount":100,"vendor":"vendorA","txhash":"0x1234567890abcdef"}')
if echo "$RESP" | grep -q '"txhashStatus":"confirmed"' && echo "$RESP" | grep -q '"status":"success"'; then
  echo "PASS: valid txhash + vendorA returns success"
else
  echo "FAIL: expected confirmed + success. Got: $RESP"
  exit 1
fi

RESP=$(curl -sf -X POST "$BASE_URL/transfer" -H "Content-Type: application/json" \
  -d '{"amount":100,"vendor":"vendorA","txhash":"notavalidhash"}')
if echo "$RESP" | grep -q '"txhashStatus":"not found"'; then
  echo "PASS: invalid txhash returns not found"
else
  echo "FAIL: expected not found. Got: $RESP"
  exit 1
fi

echo "All deployment tests passed."
