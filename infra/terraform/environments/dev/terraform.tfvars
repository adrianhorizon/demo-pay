aws_region             = "us-east-1"
ecr_repository_name    = "payments-api-dev"
app_runner_service_name = "payments-api-dev"
image_tag              = "latest"

runtime_environment_variables = {
  NODE_ENV = "development"
}

app_runner_cpu    = "1024"
app_runner_memory = "2048"
auto_deployments_enabled = true
