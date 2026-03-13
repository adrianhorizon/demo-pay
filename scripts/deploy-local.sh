#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV="${1:-dev}"
APPLY="${2:-}"

cd "$ROOT"
TERRAFORM_DIR="infra/terraform/environments/$ENV"
AWS_REGION="${AWS_REGION:-us-east-1}"

if [[ ! -d "$TERRAFORM_DIR" ]]; then
  echo "Environment dir not found: $TERRAFORM_DIR"
  exit 1
fi

if [[ -n "$APPLY" && "$APPLY" == "apply" ]]; then
  echo "Running Terraform (init + ECR only first)..."
  if [[ -f "$TERRAFORM_DIR/backend.hcl" ]]; then
    (cd "$TERRAFORM_DIR" && terraform init -backend-config=backend.hcl -input=false)
  else
    echo "No backend.hcl: using backend.tf (local state)."
    (cd "$TERRAFORM_DIR" && terraform init -input=false)
  fi
  (cd "$TERRAFORM_DIR" && terraform apply -target=module.ecr -var-file=terraform.tfvars -auto-approve)
  echo "ECR created. Building and pushing image before creating App Runner..."
fi

ECR_URL=$(cd "$TERRAFORM_DIR" && terraform output -raw ecr_repository_url)
echo "ECR repository: $ECR_URL"
echo "Building API image (linux/amd64 for App Runner)..."
docker build --platform linux/amd64 -t "${ECR_URL}:latest" "$ROOT/api"

echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_URL%%/*}"

echo "Pushing image to ECR..."
docker push "${ECR_URL}:latest"

if [[ -n "$APPLY" && "$APPLY" == "apply" ]]; then
  SERVICE_ID=$(cd "$TERRAFORM_DIR" && terraform output -raw app_runner_service_id 2>/dev/null || true)
  if [[ -n "$SERVICE_ID" ]]; then
    echo "Waiting for App Runner to be RUNNING before applying config changes..."
    for i in {1..30}; do
      STATUS=$(aws apprunner describe-service --service-identifier "$SERVICE_ID" --region "$AWS_REGION" --query 'Service.Status' --output text 2>/dev/null || echo "UNKNOWN")
      if [[ "$STATUS" == "RUNNING" ]]; then
        echo "App Runner is RUNNING. Applying Terraform..."
        break
      fi
      echo "  Status: $STATUS (attempt $i/30)"
      sleep 10
    done
    if [[ "$STATUS" != "RUNNING" ]]; then
      echo "Warning: App Runner still not RUNNING after 5 min. Apply may fail with OPERATION_IN_PROGRESS; wait and run 'terraform apply' again."
    fi
  fi
  echo "Applying Terraform (create/update App Runner)..."
  (cd "$TERRAFORM_DIR" && terraform apply -var-file=terraform.tfvars -auto-approve)
fi

echo "Reading Terraform outputs..."
SERVICE_ID=$(cd "$TERRAFORM_DIR" && terraform output -raw app_runner_service_id)
SERVICE_URL_RAW=$(cd "$TERRAFORM_DIR" && terraform output -raw app_runner_service_url)
if [[ "$SERVICE_URL_RAW" != https://* ]]; then
  SERVICE_URL="https://$SERVICE_URL_RAW"
else
  SERVICE_URL="$SERVICE_URL_RAW"
fi

echo "Triggering App Runner deployment..."
aws apprunner start-deployment --service-identifier "$SERVICE_ID" --region "$AWS_REGION"
echo "Waiting 90s for App Runner to deploy..."
sleep 90

echo "Running deployment tests against $SERVICE_URL"
"$SCRIPT_DIR/deploy-tests.sh" "$SERVICE_URL"
echo "Done. Service URL: $SERVICE_URL"
