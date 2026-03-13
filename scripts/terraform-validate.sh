#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

ENVS="${1:-dev prod}"
for env in $ENVS; do
  dir="infra/terraform/environments/$env"
  if [[ ! -d "$dir" ]]; then
    echo "Skip $env: $dir not found"
    continue
  fi
  echo "Validating $env..."
  (cd "$dir" && terraform init -backend=false -input=false && terraform validate)
  echo "OK $env"
done
echo "All Terraform validations passed."
