#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV="${1:-dev}"

cd "$ROOT"
TERRAFORM_DIR="infra/terraform/environments/$ENV"
AWS_REGION="${AWS_REGION:-us-east-1}"

if [[ ! -d "$TERRAFORM_DIR" ]]; then
  echo "Environment dir not found: $TERRAFORM_DIR"
  exit 1
fi

echo "Terraform destroy for environment: $ENV"
if [[ -f "$TERRAFORM_DIR/backend.hcl" ]]; then
  (cd "$TERRAFORM_DIR" && terraform init -backend-config=backend.hcl -input=false)
else
  echo "No backend.hcl: using backend.tf (local state)."
  (cd "$TERRAFORM_DIR" && terraform init -input=false)
fi

SERVICE_ID=$(cd "$TERRAFORM_DIR" && terraform output -raw app_runner_service_id 2>/dev/null || true)
if [[ -n "$SERVICE_ID" ]]; then
  echo "Waiting for App Runner to be RUNNING before destroy (required by AWS)..."
  for i in {1..30}; do
    STATUS=$(aws apprunner describe-service --service-identifier "$SERVICE_ID" --region "$AWS_REGION" --query 'Service.Status' --output text 2>/dev/null || echo "UNKNOWN")
    if [[ "$STATUS" == "RUNNING" ]]; then
      echo "App Runner is RUNNING. Proceeding with destroy."
      break
    fi
    echo "  Status: $STATUS (attempt $i/30)"
    sleep 10
  done
  if [[ "$STATUS" != "RUNNING" ]]; then
    echo "Warning: App Runner still not RUNNING. Destroy may fail; wait a few minutes and run this script again."
  fi
fi

echo "Running terraform destroy..."
(cd "$TERRAFORM_DIR" && terraform destroy -var-file=terraform.tfvars -auto-approve)
echo "Done. Infrastructure for $ENV destroyed."
